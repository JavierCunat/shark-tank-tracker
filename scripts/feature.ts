// Mark a company as featured on the home page (or remove it).
// Usage: npm run feature -- <slug> <rank>      e.g. npm run feature -- pork-barrel-bbq 1
//        npm run feature -- <slug> none        removes it
import "dotenv/config";
import pg from "pg";

const [slug, rank] = process.argv.slice(2);
if (!slug || !rank) { console.error("usage: npm run feature -- <slug> <rank|none>"); process.exit(1); }

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const res = await db.query("update companies set featured_rank = $2 where slug = $1 returning name", [slug, rank === "none" ? null : Number(rank)]);
console.log(res.rowCount ? `✓ ${res.rows[0].name}: featured_rank = ${rank}` : `no company with slug "${slug}"`);
await db.end();
