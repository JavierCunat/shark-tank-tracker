// Research what happened to each company, using Claude with web search.
// Results go into update_candidates for a human to approve. Never writes to `updates`.
//
// Env: DATABASE_URL, ANTHROPIC_API_KEY  (optional: RESEARCH_MODEL)
// Run: npm run find-updates -- --limit 10          (defaults to 10 companies, least-recently-verified first)
//      npm run find-updates -- --slug pork-barrel-bbq
import "dotenv/config";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";

const argv = process.argv.slice(2);
const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const LIMIT = Number(arg("--limit") ?? 10);
const SLUG = arg("--slug");
const MODEL = process.env.RESEARCH_MODEL ?? "claude-sonnet-5-5";

const STATUSES = ["active", "acquired", "closed", "deal_closed", "deal_fell_through"] as const;
type Status = (typeof STATUSES)[number];

type Finding = {
  found: boolean;
  status: Status | null;
  summary: string | null;        // 1-3 sentences, concrete, in plain words
  event_date: string | null;     // YYYY-MM-DD, or YYYY-MM-01 / YYYY-01-01 when only month/year is known
  deal_outcome: "closed" | "fell_through" | "unknown" | "no_deal";
  confidence: number;            // 0-1
  primary_source_url: string | null;
  primary_source_name: string | null;
  other_source_urls: string[];
  notes: string | null;          // anything the reviewer should know (name collisions, conflicting reports)
};

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic();

async function research(c: { name: string; description: string; season: number; episode_in_season: number; air_date: string; deal_on_air: boolean; deal_sharks: string[] | null; deal_amount_usd: number | null; deal_equity_pct: string | null }): Promise<Finding> {
  const deal = c.deal_on_air
    ? `On air they accepted $${c.deal_amount_usd?.toLocaleString()} for ${c.deal_equity_pct}% from ${c.deal_sharks?.join(" and ")}.`
    : "They did not get a deal on air.";

  const prompt = `Research what happened to a company after it appeared on Shark Tank (the US show on ABC).

Company: ${c.name}
Pitched: ${c.description}
Aired: Season ${c.season}, episode ${c.episode_in_season}, on ${c.air_date}
${deal}

Use web search to find out, as of today:
1. Is the company still operating, acquired, or closed?
2. ${c.deal_on_air ? "Did the on-air deal actually close after due diligence, or fall through?" : "(No deal on air, so skip the deal question.)"}
3. Any notable milestones (revenue figures, retail distribution, relaunch, founder moved on).

Be careful about name collisions: there may be unrelated businesses with the same name. Only report facts clearly about THIS Shark Tank company. Prefer primary sources (the company's own site/social, news outlets, the show's update segments) over listicles. If sources conflict, say so in notes and lower confidence.

When done, reply with ONLY a JSON object, no prose before or after:
{
  "found": boolean,                       // false if you could not find anything reliable
  "status": ${JSON.stringify(STATUSES)} or null,   // the CURRENT state. Use deal_closed/deal_fell_through only if that is the most important fact and you know nothing more recent.
  "summary": string or null,              // 1-3 sentences in plain words stating the concrete facts, for a general reader
  "event_date": "YYYY-MM-DD" or null,     // when the most recent fact was true/reported; use the 1st if only month/year known
  "deal_outcome": "closed" | "fell_through" | "unknown" | "no_deal",
  "confidence": number 0-1,
  "primary_source_url": string or null,   // the single best source
  "primary_source_name": string or null,  // e.g. "Forbes", "company website", "Shark Tank Blog"
  "other_source_urls": string[],
  "notes": string or null
}`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 } as any],
    messages: [{ role: "user", content: prompt }],
  });

  // The final text block holds the JSON; search results come back as other block types.
  const text = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error(`no JSON in response: ${text.slice(0, 200)}`);
  return normalize(JSON.parse(text.slice(start, end + 1)));
}

// The model doesn't always follow the schema exactly. Coerce what we can, reject what we can't.
function normalize(raw: any): Finding {
  const pickStatus = (v: unknown): Status | null => {
    const list = Array.isArray(v) ? v : [v];
    // If it gave several, prefer the one describing the current state over the deal outcome.
    const order: Status[] = ["closed", "acquired", "active", "deal_fell_through", "deal_closed"];
    const valid = list.filter((x): x is Status => typeof x === "string" && (STATUSES as readonly string[]).includes(x));
    return order.find((o) => valid.includes(o)) ?? null;
  };
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const date = (v: unknown) => {
    const m = typeof v === "string" ? v.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/) : null;
    return m ? `${m[1]}-${m[2] ?? "01"}-${m[3] ?? "01"}` : null;
  };
  const conf = Number(raw?.confidence);
  return {
    found: Boolean(raw?.found),
    status: pickStatus(raw?.status),
    summary: str(raw?.summary),
    event_date: date(raw?.event_date),
    deal_outcome: ["closed", "fell_through", "unknown", "no_deal"].includes(raw?.deal_outcome) ? raw.deal_outcome : "unknown",
    confidence: Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0.5,
    primary_source_url: str(raw?.primary_source_url),
    primary_source_name: str(raw?.primary_source_name),
    other_source_urls: Array.isArray(raw?.other_source_urls) ? raw.other_source_urls.filter((u: unknown) => typeof u === "string") : [],
    notes: str(raw?.notes) ?? (Array.isArray(raw?.status) ? `model gave several statuses: ${raw.status.join(", ")}` : null),
  };
}

await db.connect();
const where = SLUG ? "where c.slug = $2" : "";
const params: unknown[] = SLUG ? [LIMIT, SLUG] : [LIMIT];
const { rows: companies } = await db.query<any>(
  `select c.id, c.slug, c.name, c.description, c.deal_on_air, c.deal_sharks, c.deal_amount_usd, c.deal_equity_pct,
          e.season, e.episode_in_season, e.air_date::text
     from companies c join episodes e on e.id = c.episode_id
     ${where}
    order by c.last_verified_at nulls first, e.air_date, c.name
    limit $1`,
  params,
);

let queued = 0;
for (const c of companies) {
  process.stdout.write(`researching ${c.name} (S${c.season}E${c.episode_in_season})... `);
  let f: Finding;
  try {
    f = await research(c);
  } catch (e) {
    console.log(`failed: ${(e as Error).message}`);
    continue;
  }
  if (!f.found || !f.status || !f.summary) {
    console.log("nothing reliable found");
    // record the attempt so this company drops to the back of the queue
    await db.query("update companies set last_verified_at = coalesce(last_verified_at, '1970-01-01') where id = $1", [c.id]);
    continue;
  }
  const url = f.primary_source_url ?? `research:${new Date().toISOString().slice(0, 10)}`;
  let res;
  try {
    res = await db.query(
    `insert into update_candidates
       (company_id, article_url, article_title, article_date, proposed_status, proposed_summary,
        confidence, relevance_reason, raw_excerpt, model)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (company_id, article_url) do nothing`,
    [c.id, url, f.primary_source_name, f.event_date, f.status, f.summary,
     f.confidence, f.notes ?? `deal_outcome=${f.deal_outcome}`, (f.other_source_urls ?? []).join("\n"), MODEL],
    );
  } catch (e) {
    console.log(`db insert failed: ${(e as Error).message}`);
    continue;
  }
  queued += res.rowCount ?? 0;
  console.log(`${f.status} (${Math.round(f.confidence * 100)}%)${res.rowCount ? "" : " [already queued]"}`);
}
console.log(`\nresearched ${companies.length} companies, queued ${queued} new candidates. Run: npm run review`);
await db.end();
