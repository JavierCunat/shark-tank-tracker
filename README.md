# Shark Tank Tracker

Every company that appeared on Shark Tank, when they aired, and what happened to them since.

## Layout

```
seed/               season CSVs + the scripts that build them (season1.csv is the first)
db/schema.sql       Postgres schema: episodes, companies, updates, update_candidates
scripts/load-seed.ts    CSV -> Postgres (idempotent)
scripts/find-updates.ts nightly: news search -> LLM classify -> review queue
.github/workflows/  the schedule that runs find-updates
```

## Setup (first time)

1. `npm install`
2. Create a Supabase project. Run the contents of `db/schema.sql` in its SQL Editor.
3. `cp .env.example .env` and paste your Supabase connection string as `DATABASE_URL`.
4. `npm run seed` loads Season 1 (14 episodes, 64 companies).
5. Check the Table Editor in Supabase: `companies` should have 64 rows.

Then scaffold the Next.js app in this repo (`npx create-next-app@latest web`) and read from the `company_cards` view.

## Secrets the GitHub Action needs

`DATABASE_URL`, `ANTHROPIC_API_KEY`, `NEWS_API_KEY` under the repo's Settings > Secrets and variables > Actions.

## Data rules

- Nothing is published without a human approving it in `update_candidates`. The Action only ever writes to the queue.
- An update is a row, not a column. Company status is derived from the latest `updates` row by trigger.
- Every published update carries a `source_url`. No source, no update.
- Season 1 seed comes from Wikipedia's season page; on-air asks aren't listed there, so `ask_*` columns are blank until backfilled.

## SEO (why this site can win)

The search intent is "what happened to X from Shark Tank". Every company page should be built to rank for that exact query:

- URL: `/company/<slug>` (`/company/ava-the-elephant`). Never query strings, never IDs.
- `<title>`: "What Happened to {Name} After Shark Tank? ({Season} Update)". H1 says the same thing. The first paragraph answers the question directly in two sentences, then the timeline.
- Season pages `/season/1`, episode pages `/season/1/episode/3`, and shark pages `/shark/barbara-corcoran` (every deal she made) for internal linking and long-tail queries.
- JSON-LD on company pages: `Organization` (name, url, foundingDate if known) + `Article` with `dateModified` set to the latest update date. Freshness is a real ranking input here.
- `sitemap.xml` generated from the DB with `lastmod` = latest update date per company. `robots.txt` pointing at it.
- Static-generate everything (`generateStaticParams`) and revalidate when an update is approved. Fast pages, no client fetching for the core content.
- Auto-generated OG image per company (Next's `ImageResponse`): name, season, status badge. These get shared on Reddit/X when an update lands.
- A "last verified" date visible on every page. It signals to readers and to Google that this isn't a stale 2014 listicle.
