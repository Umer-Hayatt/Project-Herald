create table public.story_feedback (
  reader_id uuid not null references auth.users(id) on delete cascade,
  story_key text not null check (length(story_key) = 64),
  source_identities text[] not null default '{}',
  feedback text not null check (feedback in ('more', 'less')),
  topics text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (reader_id, story_key),
  constraint supported_feedback_topics check (
    topics <@ array['general','science','technology','business','health','sports','entertainment','politics','travel','food']::text[]
  )
);

create index story_feedback_source_identities_idx
  on public.story_feedback using gin (source_identities);

alter table public.story_feedback enable row level security;
revoke all on public.story_feedback from anon, authenticated;
grant select, insert, update, delete on public.story_feedback to authenticated;

create policy "Readers see their own story feedback"
  on public.story_feedback for select to authenticated
  using ((select auth.uid()) = reader_id);
create policy "Readers create their own story feedback"
  on public.story_feedback for insert to authenticated
  with check ((select auth.uid()) = reader_id);
create policy "Readers update their own story feedback"
  on public.story_feedback for update to authenticated
  using ((select auth.uid()) = reader_id)
  with check ((select auth.uid()) = reader_id);
create policy "Readers delete their own story feedback"
  on public.story_feedback for delete to authenticated
  using ((select auth.uid()) = reader_id);
