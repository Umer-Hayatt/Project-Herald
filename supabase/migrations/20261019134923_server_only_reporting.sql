-- Reader identities cannot reserve or mutate shared reporting.
-- Keep saved Editions and source rows intact.
drop function if exists public.claim_reporting_refresh(boolean);
create or replace function public.claim_reporting_refresh(
  p_force_refresh boolean,
  p_provider_calls integer default 5
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta public.reporting_cache_meta%rowtype;
  v_count integer;
  v_token uuid;
  v_now timestamptz := statement_timestamp();
  v_day date := (statement_timestamp() at time zone 'UTC')::date;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    return null;
  end if;

  insert into public.reporting_cache_meta (id, day_date, last_fetched_at)
  values ('news_supply', v_day, v_now - interval '3601 seconds')
  on conflict (id) do nothing;

  select * into v_meta
  from public.reporting_cache_meta
  where id = 'news_supply'
  for update;

  v_count := case when v_meta.day_date = v_day then v_meta.daily_request_count else 0 end;

  if v_meta.day_date = v_day
    and v_meta.is_fetching
    and v_meta.locked_at > v_now - interval '60 seconds' then
    return null;
  end if;

  if not p_force_refresh
    and v_meta.day_date = v_day
    and v_meta.last_fetched_at > v_now - interval '3600 seconds' then
    return null;
  end if;

  if p_provider_calls is null or p_provider_calls < 1 or p_provider_calls > 15 or v_count + p_provider_calls > 15 then
    return null;
  end if;

  v_token := gen_random_uuid();
  update public.reporting_cache_meta
  set day_date = v_day,
      daily_request_count = v_count + greatest(0, p_provider_calls),
      is_fetching = true,
      locked_at = v_now,
      lock_token = v_token
  where id = 'news_supply';

  return v_token;
end;
$$;

-- 5. Trusted ingestion procedure with security definer
create or replace function public.ingest_source_articles(
  p_lock_token uuid,
  p_articles jsonb
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta public.reporting_cache_meta%rowtype;
  v_count integer := 0;
  v_item jsonb;
  v_user_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  -- Only the server reporting identity may ingest.
  if v_user_role <> 'service_role' then
    raise exception 'Unauthenticated client cannot ingest source articles';
  end if;

  -- Even the server must hold an unexpired reservation.
  if p_lock_token is null then
    raise exception 'Lock token required for trusted ingestion';
  end if;

  select * into v_meta
  from public.reporting_cache_meta
  where id = 'news_supply'
    and lock_token = p_lock_token
    and is_fetching = true and locked_at > statement_timestamp() - interval '60 seconds' for update;

  if not found then
    raise exception 'Invalid or expired lock token for trusted ingestion';
  end if;

  if p_articles is null or jsonb_array_length(p_articles) = 0 then
    return 0;
  end if;

  for v_item in select * from jsonb_array_elements(p_articles)
  loop
    insert into public.source_articles (
      id,
      external_id,
      title,
      description,
      snippet,
      url,
      image_url,
      publisher,
      published_at,
      retrieved_at,
      language,
      categories,
      locale,
      raw_data
    ) values (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      v_item->>'external_id',
      v_item->>'title',
      v_item->>'description',
      v_item->>'snippet',
      v_item->>'url',
      v_item->>'image_url',
      v_item->>'publisher',
      (v_item->>'published_at')::timestamptz,
      coalesce((v_item->>'retrieved_at')::timestamptz, statement_timestamp()),
      coalesce(v_item->>'language', 'en'),
      case
        when v_item->'categories' is not null and jsonb_typeof(v_item->'categories') = 'array'
        then array(select jsonb_array_elements_text(v_item->'categories'))
        else array['general']::text[]
      end,
      v_item->>'locale',
      v_item->'raw_data'
    )
    on conflict (external_id) do update set
      title = excluded.title,
      description = coalesce(excluded.description, public.source_articles.description),
      snippet = coalesce(excluded.snippet, public.source_articles.snippet),
      url = excluded.url,
      image_url = coalesce(excluded.image_url, public.source_articles.image_url),
      publisher = excluded.publisher,
      published_at = excluded.published_at,
      retrieved_at = excluded.retrieved_at,
      language = excluded.language,
      categories = excluded.categories,
      locale = coalesce(excluded.locale, public.source_articles.locale),
      raw_data = coalesce(excluded.raw_data, public.source_articles.raw_data);

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.finish_reporting_refresh(
  p_lock_token uuid,
  p_succeeded boolean
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' or p_lock_token is null then
    return false;
  end if;

  update public.reporting_cache_meta
  set last_fetched_at = case when p_succeeded then statement_timestamp() else last_fetched_at end,
      is_fetching = false,
      locked_at = null,
      lock_token = null
  where id = 'news_supply'
    and lock_token = p_lock_token;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.claim_reporting_refresh(boolean, integer) from public, anon, authenticated;
revoke all on function public.ingest_source_articles(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.finish_reporting_refresh(uuid, boolean) from public, anon, authenticated;
grant execute on function public.claim_reporting_refresh(boolean, integer) to service_role;
grant execute on function public.ingest_source_articles(uuid, jsonb) to service_role;
grant execute on function public.finish_reporting_refresh(uuid, boolean) to service_role;

-- Short-lived shared search results; query hashes contain no reader identifiers.
create table public.reporting_search_cache (
  cache_key text primary key,
  articles jsonb not null,
  expires_at timestamptz not null
);
alter table public.reporting_search_cache enable row level security;
revoke all on public.reporting_search_cache from public, anon, authenticated;

create function public.read_reporting_search(p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Server reporting identity required';
  end if;
  return (select articles from public.reporting_search_cache
    where cache_key = p_key and expires_at > statement_timestamp());
end;
$$;

create function public.save_reporting_search(p_key text, p_lock_token uuid, p_articles jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Server reporting identity required';
  end if;
  perform 1 from public.reporting_cache_meta where id = 'news_supply'
    and lock_token = p_lock_token and is_fetching
    and locked_at > statement_timestamp() - interval '60 seconds' for update;
  if not found then raise exception 'Active reporting reservation required'; end if;
  if coalesce(p_key, '') !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_articles) is distinct from 'array'
    then raise exception 'Invalid search cache payload'; end if;
  if jsonb_array_length(p_articles) > 10 then raise exception 'Invalid search cache payload'; end if;
  delete from public.reporting_search_cache where expires_at <= statement_timestamp();
  insert into public.reporting_search_cache values (p_key, p_articles, statement_timestamp() + interval '1 hour')
  on conflict (cache_key) do update set articles = excluded.articles, expires_at = excluded.expires_at;
end;
$$;
revoke all on function public.read_reporting_search(text) from public, anon, authenticated;
revoke all on function public.save_reporting_search(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.read_reporting_search(text) to service_role;
grant execute on function public.save_reporting_search(text, uuid, jsonb) to service_role;

-- Existing cache entries were reader-writable and cannot establish provenance.
-- Only fresh server persistence may mark an entry trusted; saved Editions are untouched.
alter table public.story_processing_cache
  add column trusted_server boolean not null default false;
revoke all on public.story_processing_cache from public, anon, authenticated;
grant select on public.story_processing_cache to authenticated;
drop policy "Signed-in readers can add processed source reporting" on public.story_processing_cache;
alter policy "Signed-in readers can reuse processed source reporting"
  on public.story_processing_cache
  using ((select auth.uid()) is not null and trusted_server);

create function public.save_processed_stories(p_stories jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_story jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Server reporting identity required';
  end if;
  if p_stories is null or jsonb_typeof(p_stories) <> 'array' then
    raise exception 'Invalid processed stories';
  end if;
  if jsonb_array_length(p_stories) > 16 then
    raise exception 'Invalid processed stories';
  end if;
  for v_story in select * from jsonb_array_elements(p_stories) loop
    if coalesce(v_story->>'cache_key', '') !~ '^[a-f0-9]{64}$'
      or jsonb_typeof(v_story->'payload') is distinct from 'object'
      or (v_story->'payload'->>'source') is distinct from 'gemini' then
      raise exception 'Invalid processed story';
    end if;
    insert into public.story_processing_cache(cache_key, payload, trusted_server)
    values (v_story->>'cache_key', v_story->'payload', true)
    on conflict (cache_key) do update
      set payload = excluded.payload, trusted_server = true, created_at = statement_timestamp()
      where not public.story_processing_cache.trusted_server;
  end loop;
end;
$$;
revoke all on function public.save_processed_stories(jsonb) from public, anon, authenticated;
grant execute on function public.save_processed_stories(jsonb) to service_role;
