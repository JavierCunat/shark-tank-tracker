-- Run in the Supabase SQL Editor.
-- Supabase exposes every table in `public` through its REST API. We only ever talk to Postgres
-- directly (as the owner role, which bypasses RLS), so enable RLS with NO policies: the REST API
-- can then read or write nothing, and our scripts and the site keep working unchanged.

alter table episodes          enable row level security;
alter table companies         enable row level security;
alter table updates           enable row level security;
alter table update_candidates enable row level security;

-- Belt and braces: revoke the API roles' table access entirely.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
