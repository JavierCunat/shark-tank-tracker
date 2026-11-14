// Build seed/season<N>.csv from the Wikipedia season page using Claude to extract the pitches,
// then load it into Postgres. Review the CSV afterward; fix anything odd and re-run `npm run load -- seed/seasonN.csv`.
//
// Usage: npm run seed-season -- 2            (fetch + extract + load)
//        npm run seed-season -- 2 --no-load  (just write the CSV)
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";

const season = Number(process.argv[2]);
if (!season) { console.error("usage: npm run seed-season -- <season number> [--no-load]"); process.exit(1); }
const noLoad = process.argv.includes("--no-load");
const MODEL = process.env.RESEARCH_MODEL ?? "claude-sonnet-5-5";
const SOURCE = `https://en.wikipedia.org/wiki/Shark_Tank_season_${season}`;

// --- 1. fetch and strip the page to text ---
const res = await fetch(SOURCE, { headers: { "User-Agent": "shark-tank-tracker seed script" } });
if (!res.ok) { console.error(`fetch ${SOURCE}: ${res.status}`); process.exit(1); }
const html = await res.text();
const text = html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
  .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")          // citation markers
  .replace(/<\/(tr|p|li|h\d|div)>/gi, "\n")
  .replace(/<\/t[dh]>/gi, " | ")
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n");
const start = Math.max(0, text.indexOf("Episodes"));
const body = text.slice(start, start + 120_000);
console.log(`fetched ${SOURCE} (${body.length} chars of episode text)`);

// --- 2. extract with Claude ---
const prompt = `Below is the text of the Wikipedia page for Shark Tank (US) season ${season}. Extract EVERY pitch into JSON.

Rules:
- One object per company pitched. Skip "Update on ..." segments; those are not pitches.
- episode_in_season: the episode's number within the season (1, 2, 3...). prod_code: the production code if shown (e.g. "203"), else "".
- air_date: YYYY-MM-DD of the episode's original air date.
- deal_on_air: true if any shark's offer was accepted on air, false otherwise.
- deal_sharks: array of full shark names who are part of the accepted deal (empty if no deal). Use canonical names: "Barbara Corcoran", "Daymond John", "Kevin O'Leary", "Robert Herjavec", "Kevin Harrington", "Mark Cuban", "Lori Greiner", and full names for guests.
- deal_amount_usd: the accepted deal's dollar amount as an integer, or null. deal_equity_pct: the equity percentage as a number, or null (100 if the company was sold outright).
- deal_notes: royalties, loans, contingencies, "sold the company", later off-air changes mentioned, else "".
- ask_amount_usd / ask_equity_pct: what the founders asked for, if the page states it; else null.
- description: a short plain-English description of the product or business (under 120 characters), no marketing language.
- company: the company or product name exactly as the page gives it.

Return ONLY a JSON array, no prose, no code fences.

PAGE TEXT:
${body}`;

const anthropic = new Anthropic();
process.stdout.write("extracting with Claude... ");
let out = "";
const stream = anthropic.messages.stream({ model: MODEL, max_tokens: 24000, messages: [{ role: "user", content: prompt }] });
stream.on("text", (t) => { out += t; if (out.length % 2000 < t.length) process.stdout.write("."); });
await stream.finalMessage();
console.log();
const a = out.indexOf("["), z = out.lastIndexOf("]");
if (a < 0 || z < 0) { console.error("no JSON array in response:\n" + out.slice(0, 500)); process.exit(1); }
type Row = { company: string; description: string; episode_in_season: number; prod_code: string; air_date: string;
  ask_amount_usd: number | null; ask_equity_pct: number | null; deal_on_air: boolean; deal_sharks: string[];
  deal_amount_usd: number | null; deal_equity_pct: number | null; deal_notes: string };
const rows: Row[] = JSON.parse(out.slice(a, z + 1));
console.log(`${rows.length} pitches`);

// --- 3. write CSV in the same shape as season1.csv ---
const slugify = (s: string) => s.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const q = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const header = "slug,company,description,season,episode_in_season,prod_code,air_date,ask_amount_usd,ask_equity_pct,deal_on_air,deal_sharks,deal_amount_usd,deal_equity_pct,deal_notes,source_url";
const seen = new Map<string, number>();
const lines = rows.map((r) => {
  let slug = slugify(r.company);
  const n = (seen.get(slug) ?? 0) + 1; seen.set(slug, n);
  if (n > 1) slug = `${slug}-s${season}e${r.episode_in_season}`;      // same name twice in one season: disambiguate
  return [slug, r.company, r.description, season, r.episode_in_season, r.prod_code ?? "", r.air_date,
    r.ask_amount_usd ?? "", r.ask_equity_pct ?? "", r.deal_on_air ? "true" : "false",
    (r.deal_sharks ?? []).join("; "), r.deal_amount_usd ?? "", r.deal_equity_pct ?? "", r.deal_notes ?? "", SOURCE].map(q).join(",");
});
const file = `seed/season${season}.csv`;
writeFileSync(file, header + "\n" + lines.join("\n") + "\n");
const episodes = new Set(rows.map((r) => r.episode_in_season)).size;
const deals = rows.filter((r) => r.deal_on_air).length;
console.log(`wrote ${file}: ${rows.length} pitches, ${episodes} episodes, ${deals} on-air deals`);
const bad = rows.filter((r) => !/^\d{4}-\d{2}-\d{2}$/.test(r.air_date));
if (bad.length) console.warn(`WARNING: ${bad.length} rows have a bad air_date; fix them in the CSV before loading:`, bad.map((r) => r.company).join(", "));

// --- 4. load ---
if (noLoad || bad.length) { console.log(`not loaded. When the CSV looks right: npm run load -- ${file}`); process.exit(0); }
execSync(`npx tsx scripts/load-seed.ts ${file}`, { stdio: "inherit" });
