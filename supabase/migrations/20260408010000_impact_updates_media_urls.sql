-- Support carousel-style impact posts (multiple images in one update)
alter table public.impact_updates
add column if not exists media_urls text[];

