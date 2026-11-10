// Add one verified update for a company and mark it verified today.
//
// Usage:
//   npm run add-update -- <slug> <YYYY-MM-DD> <status> "<summary>" <source_url> ["<source_name>"]
//
// Example:
//   npm run add-update -- pork-barrel-bbq 2024-05-01 active \
//     "Still selling sauces and rubs nationally; the company reports over $100M in lifetime sales." \
//     https://example.com/article "Forbes"
//
// Status must be one of: active, acquired, closed, deal_closed, deal_fell_through
import "dotenv/config";
import pg from "pg";

const STATUSES = ["active", "acquired", "closed", "deal_closed", "deal_fell_through"];
const [slug, date, status, summary, sourceUrl, sourceName] = process.argv.slice(2);

function die(msg: string): never {
  console.error(`\n${msg}\n\nUsage: npm run add-update -- <slug> <YYYY-MM-DD> <status> "<summary>" <source_url> ["<source_name>"]`);
  process.exit(1);
}

if (!slug || !date || !status || !summary || !sourceUrl) die("Missing arguments.");
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) die(`Date must be YYYY-MM-DD, got "${date}".`);
if (!STATUSES.includes(status)) die(`Status must be one of ${STATUSES.join(", ")}, got "${status}".`);
if (!/^https?:\/\//.test(sourceUrl)) die(`Source must be a full URL, got "${sourceUrl}".`);

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  const company = await db.query<{ id: string; name: string }>("select id, name from companies where slug = $1", [slug]);
  if (!company.rowCount) {
    const near = await db.query<{ slug: string }>("select slug from companies where slug ilike $1 limit 5", [`%${slug.split("-")[0]}%`]);
    die(`No company with slug "${slug}".` + (near.rowCount ? ` Did you mean: ${near.rows.map((r) => r.slug).join(", ")}` : ""));
  }
  const { id, name } = company.rows[0];

  await db.query("begin");
  await db.query(
    `insert into updates (company_id, update_date, status, summary, source_url, source_name)
     values ($1,$2,$3,$4,$5,$6)`,
    [id, date, status, summary, sourceUrl, sourceName ?? null],
  );
  await db.query("update companies set last_verified_at = current_date where id = $1", [id]);
  await db.query("commit");

  const after = await db.query<{ current_status: string }>("select current_status from companies where id = $1", [id]);
  console.log(`✓ ${name}: added ${status} update dated ${date}. Company status is now "${after.rows[0].current_status}".`);
} catch (e) {
  await db.query("rollback").catch(() => {});
  throw e;
} finally {
  await db.end();
}
