// Print companies with no verified update yet, oldest first.
import "dotenv/config";
import pg from "pg";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const { rows } = await db.query<{ slug: string; name: string; season: number; episode_in_season: number; deal_on_air: boolean }>(
  `select c.slug, c.name, e.season, e.episode_in_season, c.deal_on_air
     from companies c join episodes e on e.id = c.episode_id
    where c.last_verified_at is null
    order by e.season, e.episode_in_season, c.name`,
);
console.log(`${rows.length} companies not yet verified:\n`);
for (const r of rows) console.log(`  S${r.season}E${String(r.episode_in_season).padStart(2, "0")}  ${r.slug.padEnd(34)} ${r.deal_on_air ? "deal" : "    "}  ${r.name}`);
await db.end();
