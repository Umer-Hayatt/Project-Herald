-- Recovery Slice R01: Protect shared reporting writes behind trusted ingestion.
-- Revoke direct INSERT/UPDATE/DELETE on source_articles from anon and authenticated clients.
-- Provide trusted ingestion via security definer RPC function scoped to active refresh locks.

-- 1. Drop public write policies
drop policy if exists "All users can insert source articles" on public.source_articles;
drop policy if exists "All users can update source articles" on public.source_articles;

-- 2. Revoke direct write privileges
revoke insert, update, delete on public.source_articles from anon, authenticated;

-- 3. Confirm public select remains granted and policy exists
grant select on public.source_articles to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'source_articles' and policyname = 'All users can read source articles'
  ) then
    create policy "All users can read source articles"
      on public.source_articles for select to anon, authenticated using (true);
  end if;
end $$;

-- 4. Backward-compatible refresh reservation with optional provider call count
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
  if auth.uid() is null then
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

  if p_provider_calls > 0 and v_count + p_provider_calls > 15 then
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
  -- Require authentication or service_role in JWT
  if auth.uid() is null and v_user_role not in ('service_role', 'supabase_admin') then
    raise exception 'Unauthenticated client cannot ingest source articles';
  end if;

  -- Lock token is strictly required for authenticated readers
  if v_user_role not in ('service_role', 'supabase_admin') then
    if p_lock_token is null then
      raise exception 'Lock token required for trusted ingestion';
    end if;

    select * into v_meta
    from public.reporting_cache_meta
    where id = 'news_supply'
      and lock_token = p_lock_token
      and is_fetching = true;

    if not found then
      raise exception 'Invalid or expired lock token for trusted ingestion';
    end if;
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

revoke all on function public.claim_reporting_refresh(boolean, integer) from public, anon;
grant execute on function public.claim_reporting_refresh(boolean, integer) to authenticated;
revoke all on function public.ingest_source_articles(uuid, jsonb) from public, anon;
grant execute on function public.ingest_source_articles(uuid, jsonb) to authenticated;
