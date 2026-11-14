-- Run in the Supabase SQL Editor.
-- Track when the research job last looked at a company, so it never repeats work needlessly.
alter table companies add column if not exists last_researched_at timestamptz;

-- The old script used 1970-01-01 as a "found nothing" marker in last_verified_at. Clear those.
update companies set last_verified_at = null where last_verified_at = '1970-01-01';
