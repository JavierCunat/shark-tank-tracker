-- Run this in the Supabase SQL Editor (or psql). Safe to run once.

-- Featured companies for the home page. Lower rank shows first.
alter table companies add column if not exists featured_rank int;
create index if not exists companies_featured_idx on companies(featured_rank) where featured_rank is not null;

-- Where a candidate came from: our nightly research, or a visitor.
alter table update_candidates add column if not exists origin text not null default 'research'
  check (origin in ('research', 'community'));
alter table update_candidates add column if not exists submitter_contact text;  -- optional, never shown publicly

-- Season 1's standout success.
update companies set featured_rank = 1 where slug = 'pork-barrel-bbq';
