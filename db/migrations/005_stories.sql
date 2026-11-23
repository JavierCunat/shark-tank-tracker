-- Run in the Supabase SQL Editor.
-- A reviewed, sourced write-up per company: four short sections rendered on the company page.
alter table companies add column if not exists story jsonb;             -- {pitch, deal, after, now, sources:[{url,name}]}
alter table companies add column if not exists story_updated_at timestamptz;

-- Research can propose a story alongside (or instead of) a status update.
alter table update_candidates add column if not exists proposed_story jsonb;
alter table update_candidates add column if not exists kind text not null default 'update' check (kind in ('update','story'));
