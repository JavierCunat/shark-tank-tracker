// Loads seed/*.csv into Postgres. Idempotent (upserts on slug / (season, episode)).
// Run: npx tsx scripts/load-seed.ts seed/season1.csv   (reads DATABASE_URL from .env)
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import pg from "pg";

const file = process.argv[2];
if (!file) throw new Error("usage: load-seed.ts <csv>");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (put it in .env)");

type Row = Record<string, string>;
const rows: Row[] = parse(readFileSync(file), { columns: true, skip_empty_lines: true });

const num = (s: string) => (s === "" ? null : Number(s));
const sharks = (s: string) => (s === "" ? null : s.split(";").map((x) => x.trim()));

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
await db.query("begin");
try {
  for (const r of rows) {
    const ep = await db.query<{ id: number }>(
      `insert into episodes (season, episode_in_season, prod_code, air_date)
       values ($1,$2,$3,$4)
       on conflict (season, episode_in_season) do update set prod_code = excluded.prod_code, air_date = excluded.air_date
       returning id`,
      [num(r.season), num(r.episode_in_season), r.prod_code, r.air_date],
    );
    await db.query(
      `insert into companies (slug, name, description, episode_id, ask_amount_usd, ask_equity_pct,
                              deal_on_air, deal_sharks, deal_amount_usd, deal_equity_pct, deal_notes, source_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       on conflict (slug) do update set
         name = excluded.name, description = excluded.description, episode_id = excluded.episode_id,
         ask_amount_usd = excluded.ask_amount_usd, ask_equity_pct = excluded.ask_equity_pct,
         deal_on_air = excluded.deal_on_air, deal_sharks = excluded.deal_sharks,
         deal_amount_usd = excluded.deal_amount_usd, deal_equity_pct = excluded.deal_equity_pct,
         deal_notes = excluded.deal_notes, source_url = excluded.source_url`,
      [
        r.slug, r.company, r.description, ep.rows[0].id,
        num(r.ask_amount_usd), num(r.ask_equity_pct),
        r.deal_on_air === "true", sharks(r.deal_sharks),
        num(r.deal_amount_usd), num(r.deal_equity_pct),
        r.deal_notes || null, r.source_url,
      ],
    );
  }
  await db.query("commit");
  console.log(`loaded ${rows.length} companies from ${file}`);
} catch (e) {
  await db.query("rollback");
  throw e;
} finally {
  await db.end();
}
