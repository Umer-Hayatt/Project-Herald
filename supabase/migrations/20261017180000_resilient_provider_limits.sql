-- Slice 07: serialize shared reporting refreshes and reserve actual provider requests.
alter table public.reporting_cache_meta
  add column if not exists lock_token uuid;

drop policy if exists "All users can read cache meta" on public.reporting_cache_meta;
drop policy if exists "All users can insert cache meta" on public.reporting_cache_meta;
drop policy if exists "All users can update cache meta" on public.reporting_cache_meta;
revoke all on public.reporting_cache_meta from anon, authenticated;

create or replace function public.claim_reporting_refresh(
  p_force_refresh boolean
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

  if v_count + 5 > 15 then
    return null;
  end if;

  v_token := gen_random_uuid();
  update public.reporting_cache_meta
  set day_date = v_day,
      daily_request_count = v_count + 5,
      is_fetching = true,
      locked_at = v_now,
      lock_token = v_token
  where id = 'news_supply';

  return v_token;
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
  if auth.uid() is null or p_lock_token is null then
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

revoke all on function public.claim_reporting_refresh(boolean) from public, anon;
revoke all on function public.finish_reporting_refresh(uuid, boolean) from public, anon;
grant execute on function public.claim_reporting_refresh(boolean) to authenticated;
grant execute on function public.finish_reporting_refresh(uuid, boolean) to authenticated;
