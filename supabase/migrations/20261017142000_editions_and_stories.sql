-- Slice 02: Editions, Stories, Source Articles, and Reporting Cache

-- Shared reporting articles fetched from providers (reusable across readers)
create table if not exists public.source_articles (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  title text not null,
  description text,
  snippet text,
  url text not null,
  image_url text,
  publisher text not null,
  published_at timestamptz not null,
  retrieved_at timestamptz not null default now(),
  language text not null default 'en',
  categories text[] not null default '{}',
  locale text,
  raw_data jsonb
);

create index if not exists idx_source_articles_published_at on public.source_articles(published_at desc);
create index if not exists idx_source_articles_categories on public.source_articles using gin(categories);
create index if not exists idx_source_articles_locale on public.source_articles(locale);

alter table public.source_articles enable row level security;
revoke all on public.source_articles from anon, authenticated;
grant select, insert, update on public.source_articles to anon, authenticated;

create policy "All users can read source articles"
  on public.source_articles for select to anon, authenticated using (true);
create policy "All users can insert source articles"
  on public.source_articles for insert to anon, authenticated with check (true);
create policy "All users can update source articles"
  on public.source_articles for update to anon, authenticated using (true) with check (true);

-- Reporting cache metadata and request accounting for rate limits
create table if not exists public.reporting_cache_meta (
  id text primary key,
  last_fetched_at timestamptz not null default now(),
  daily_request_count integer not null default 0,
  day_date date not null default current_date,
  is_fetching boolean not null default false,
  locked_at timestamptz
);

alter table public.reporting_cache_meta enable row level security;
revoke all on public.reporting_cache_meta from anon, authenticated;
grant select, insert, update on public.reporting_cache_meta to anon, authenticated;

create policy "All users can read cache meta"
  on public.reporting_cache_meta for select to anon, authenticated using (true);
create policy "All users can insert cache meta"
  on public.reporting_cache_meta for insert to anon, authenticated with check (true);
create policy "All users can update cache meta"
  on public.reporting_cache_meta for update to anon, authenticated using (true) with check (true);

-- Preserved daily Editions
create table if not exists public.editions (
  id uuid primary key default gen_random_uuid(),
  reader_id uuid not null references auth.users(id) on delete cascade,
  edition_date date not null,
  time_zone text not null,
  reading_length integer not null check (reading_length in (5, 10, 15)),
  estimated_reading_minutes integer not null default 1,
  word_count integer not null default 0,
  selection_version text not null default 'v1',
  status text not null default 'completed' check (status in ('generating', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  constraint unique_reader_edition_date unique (reader_id, edition_date)
);

create index if not exists idx_editions_reader_date on public.editions(reader_id, edition_date desc);

alter table public.editions enable row level security;
revoke all on public.editions from anon, authenticated;
grant select, insert, update, delete on public.editions to authenticated;

create policy "Readers see their editions"
  on public.editions for select to authenticated
  using ((select auth.uid()) = reader_id);
create policy "Readers create their editions"
  on public.editions for insert to authenticated
  with check ((select auth.uid()) = reader_id);
create policy "Readers update their editions"
  on public.editions for update to authenticated
  using ((select auth.uid()) = reader_id)
  with check ((select auth.uid()) = reader_id);
create policy "Readers delete their editions"
  on public.editions for delete to authenticated
  using ((select auth.uid()) = reader_id);

-- Ordered Stories belonging to an Edition
create table if not exists public.edition_stories (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  reader_id uuid not null references auth.users(id) on delete cascade,
  position integer not null,
  title text not null,
  excerpt text not null,
  publisher text not null,
  source_url text not null,
  published_at timestamptz not null,
  category text not null,
  locale text,
  word_count integer not null default 0,
  section text not null default 'main' check (section in ('main', 'beyond_bubble')),
  source_article_id uuid references public.source_articles(id),
  supporting_sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint unique_edition_position unique (edition_id, position)
);

create index if not exists idx_edition_stories_edition on public.edition_stories(edition_id, position asc);
create index if not exists idx_edition_stories_reader on public.edition_stories(reader_id);

alter table public.edition_stories enable row level security;
revoke all on public.edition_stories from anon, authenticated;
grant select, insert, update, delete on public.edition_stories to authenticated;

create policy "Readers see their edition stories"
  on public.edition_stories for select to authenticated
  using ((select auth.uid()) = reader_id);
create policy "Readers create their edition stories"
  on public.edition_stories for insert to authenticated
  with check ((select auth.uid()) = reader_id);
create policy "Readers update their edition stories"
  on public.edition_stories for update to authenticated
  using ((select auth.uid()) = reader_id)
  with check ((select auth.uid()) = reader_id);
create policy "Readers delete their edition stories"
  on public.edition_stories for delete to authenticated
  using ((select auth.uid()) = reader_id);

