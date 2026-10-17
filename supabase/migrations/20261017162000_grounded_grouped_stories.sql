-- Slice 03: immutable processing cache for shared source reporting and
-- preserved, attributed Briefings in Edition snapshots.

alter table public.edition_stories
  add column if not exists briefing text,
  add column if not exists why_it_matters text,
  add column if not exists topics text[] not null default '{}',
  add column if not exists briefing_source text not null default 'publisher_excerpt'
    check (briefing_source in ('gemini', 'publisher_excerpt', 'publisher_headline'));

alter table public.editions
  add column if not exists discovery_note text;

create table if not exists public.story_processing_cache (
  cache_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.story_processing_cache enable row level security;
revoke all on public.story_processing_cache from anon, authenticated;
grant select, insert on public.story_processing_cache to authenticated;

create policy "Signed-in readers can reuse processed source reporting"
  on public.story_processing_cache for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Signed-in readers can add processed source reporting"
  on public.story_processing_cache for insert to authenticated
  with check ((select auth.uid()) is not null);
