-- Add image_url to edition_stories for visual layout and photography support
alter table public.edition_stories
  add column if not exists image_url text;
