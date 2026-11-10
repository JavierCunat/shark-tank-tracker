// Walk through pending research candidates and approve or reject each one.
// Approving inserts a row into `updates` (which flips the company's status via trigger)
// and marks the company verified today.
//
// Run: npm run review
import "dotenv/config";
import pg from "pg";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const rl = readline.createInterface({ input, output });

const { rows } = await db.query<any>(
  `select uc.*, c.name, c.slug, c.deal_on_air, c.deal_sharks, e.season, e.episode_in_season
     from update_candidates uc
     join companies c on c.id = uc.company_id
     join episodes e on e.id = c.episode_id
    where uc.status = 'pending'
    order by uc.origin desc, uc.confidence desc nulls last, uc.created_at`,
);

if (rows.length === 0) {
  console.log("Nothing pending. Run `npm run find-updates` first.");
} else {
  console.log(`${rows.length} candidate(s) to review.\n`);
}

let approved = 0, rejected = 0;
for (const [i, r] of rows.entries()) {
  console.log(`─── ${i + 1}/${rows.length} ─────────────────────────────────────────`);
  console.log(`${r.name}  (S${r.season}E${r.episode_in_season}, ${r.deal_on_air ? "deal with " + r.deal_sharks?.join(" & ") : "no deal"})`);
  console.log(`From:       ${r.origin === "community" ? "VISITOR SUBMISSION" + (r.submitter_contact ? ` (${r.submitter_contact})` : "") : `research (${r.model})`}`);
  console.log(`Proposed:   ${r.proposed_status}  ·  dated ${r.article_date ?? "unknown"}  ·  confidence ${r.confidence == null ? "n/a" : Math.round(r.confidence * 100) + "%"}`);
  console.log(`Summary:    ${r.proposed_summary}`);
  console.log(`Source:     ${r.article_url}${r.article_title ? `  (${r.article_title})` : ""}`);
  if (r.raw_excerpt) console.log(`Also:       ${r.raw_excerpt.split("\n").join("\n            ")}`);
  if (r.relevance_reason) console.log(`Notes:      ${r.relevance_reason}`);

  const answer = (await rl.question("\n[a]pprove  [e]dit summary then approve  [r]eject  [s]kip  [q]uit > ")).trim().toLowerCase();

  if (answer === "q") break;
  if (answer === "s" || answer === "") { console.log(); continue; }
  if (answer === "r") {
    await db.query("update update_candidates set status = 'rejected', reviewed_at = now() where id = $1", [r.id]);
    rejected++; console.log("rejected\n"); continue;
  }
  if (answer === "a" || answer === "e") {
    let summary = r.proposed_summary;
    let date = r.article_date;
    if (answer === "e") {
      const s = (await rl.question(`Summary [${summary}]: `)).trim(); if (s) summary = s;
      const d = (await rl.question(`Date YYYY-MM-DD [${date ?? ""}]: `)).trim(); if (d) date = d;
    }
    if (!date) { date = (await rl.question("No date on this candidate. Date YYYY-MM-DD: ")).trim(); }
    if (!/^https?:\/\//.test(r.article_url)) {
      console.log("Candidate has no real source URL; rejecting instead (no source, no update)."); 
      await db.query("update update_candidates set status = 'rejected', reviewed_at = now() where id = $1", [r.id]);
      rejected++; console.log(); continue;
    }
    await db.query("begin");
    await db.query(
      `insert into updates (company_id, update_date, status, summary, source_url, source_name)
       values ($1,$2,$3,$4,$5,$6)`,
      [r.company_id, date, r.proposed_status, summary, r.article_url, r.article_title],
    );
    await db.query("update companies set last_verified_at = current_date where id = $1", [r.company_id]);
    await db.query("update update_candidates set status = 'approved', reviewed_at = now() where id = $1", [r.id]);
    await db.query("commit");
    approved++; console.log(`approved → ${r.slug} is now ${r.proposed_status}\n`);
  }
}
rl.close();
console.log(`done: ${approved} approved, ${rejected} rejected, ${rows.length - approved - rejected} left pending`);
await db.end();
