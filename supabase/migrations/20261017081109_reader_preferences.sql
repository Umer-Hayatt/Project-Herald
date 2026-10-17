create function public.is_valid_time_zone(zone text)
returns boolean language sql stable security invoker set search_path = ''
as $$ select exists (select 1 from pg_catalog.pg_timezone_names where name = zone) $$;
revoke all on function public.is_valid_time_zone(text) from public;
grant execute on function public.is_valid_time_zone(text) to authenticated;

create table public.reader_preferences (
  reader_id uuid primary key references auth.users(id) on delete cascade,
  interests text[] not null default '{}',
  preferred_region text not null default 'global' check (preferred_region in ('global','pk','us','gb','in','ca','au')),
  reading_length integer not null default 10 check (reading_length in (5,10,15)),
  time_zone text not null check (length(time_zone) <= 100 and public.is_valid_time_zone(time_zone)),
  onboarding_complete boolean not null default false,
  constraint supported_interests check (interests <@ array['general','science','technology','business','health','sports','entertainment','politics','travel','food']::text[] and cardinality(interests) <= 10 and array_position(interests,null) is null),
  constraint completed_interests check (not onboarding_complete or cardinality(interests) > 0)
);
alter table public.reader_preferences enable row level security;
revoke all on public.reader_preferences from anon, authenticated;
grant select, insert, update on public.reader_preferences to authenticated;
create policy "Readers see their preferences" on public.reader_preferences for select to authenticated using ((select auth.uid()) = reader_id);
create policy "Readers create their preferences" on public.reader_preferences for insert to authenticated with check ((select auth.uid()) = reader_id);
create policy "Readers update their preferences" on public.reader_preferences for update to authenticated using ((select auth.uid()) = reader_id) with check ((select auth.uid()) = reader_id);

