-- Shark Tank tracker schema (Postgres 14+)
-- Design: an "update" is its own row, never a column on the company.
-- A company's "latest update" is simply the most recent published update row.

create extension if not exists pgcrypto;

create type company_status as enum (
  'unknown',          -- no verified update yet
  'active',           -- still operating
  'acquired',
  'closed',
  'deal_closed',      -- on-air deal finalized after due diligence
  'deal_fell_through' -- on-air deal never closed
);

create type candidate_status as enum ('pending', 'approved', 'rejected', 'duplicate');

create table episodes (
  id                serial primary key,
  season            int  not null,
  episode_in_season int  not null,
  prod_code         text,
  air_date          date not null,
  unique (season, episode_in_season)
);

create table companies (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  episode_id       int  not null references episodes(id),
  ask_amount_usd   int,
  ask_equity_pct   numeric(5,2),
  deal_on_air      boolean not null default false,
  deal_sharks      text[],              -- ['Barbara Corcoran', 'Daymond John']
  deal_amount_usd  int,
  deal_equity_pct  numeric(5,2),
  deal_notes       text,
  website_url      text,
  current_status   company_status not null default 'unknown',  -- denormalized from latest update (trigger below)
  last_verified_at date,                                        -- when a human last confirmed the status
  source_url       text,
  created_at       timestamptz not null default now()
);

create index companies_episode_idx on companies(episode_id);
create index companies_status_idx on companies(current_status);

-- Published, human-approved updates. This is what the site renders.
create table updates (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  update_date  date not null,          -- when the thing happened (or was reported), not when we found it
  status       company_status not null,
  summary      text not null,          -- one or two sentences, in our own words
  source_url   text not null,
  source_name  text,                   -- "Forbes", "company blog", "Shark Tank S5E12 update segment"
  created_at   timestamptz not null default now()
);

create index updates_company_date_idx on updates(company_id, update_date desc);

-- Review queue. The GitHub Action writes here; a human promotes rows into `updates`.
create table update_candidates (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies(id) on delete cascade,
  article_url      text not null,
  article_title    text,
  article_date     date,
  proposed_status  company_status,
  proposed_summary text,
  confidence       numeric(3,2),       -- 0.00-1.00 from the classifier
  relevance_reason text,               -- why the model thinks this is about THIS company
  raw_excerpt      text,               -- the snippet the model saw, for reviewer context
  model            text,               -- which model/version produced this
  status           candidate_status not null default 'pending',
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (company_id, article_url)     -- never re-queue the same article for the same company
);

create index candidates_pending_idx on update_candidates(status) where status = 'pending';

-- Keep companies.current_status in sync with the latest published update.
create or replace function sync_company_status() returns trigger language plpgsql as $$
begin
  update companies c
     set current_status = u.status
    from (
      select company_id, status
        from updates
       where company_id = coalesce(new.company_id, old.company_id)
       order by update_date desc, created_at desc
       limit 1
    ) u
   where c.id = u.company_id;
  return null;
end $$;

create trigger updates_sync_status
after insert or update or delete on updates
for each row execute function sync_company_status();

-- Convenience view for the site: one row per company with its latest update.
create view company_cards as
select c.id, c.slug, c.name, c.description, c.current_status, c.deal_on_air, c.deal_sharks,
       c.deal_amount_usd, c.deal_equity_pct,
       e.season, e.episode_in_season, e.air_date,
       u.update_date as latest_update_date, u.summary as latest_update_summary, u.source_url as latest_update_source
  from companies c
  join episodes e on e.id = c.episode_id
  left join lateral (
    select update_date, summary, source_url
      from updates where company_id = c.id
     order by update_date desc, created_at desc limit 1
  ) u on true;
