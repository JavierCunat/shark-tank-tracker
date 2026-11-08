// Nightly update finder.
// For each company (oldest-verified first), search news, hand candidate articles to an LLM,
// and insert anything relevant into update_candidates for human review. Never writes to `updates`.
//
// Env: DATABASE_URL, ANTHROPIC_API_KEY, NEWS_API_KEY (any news-search API that returns {title,url,publishedAt,snippet})
// Run: npx tsx scripts/find-updates.ts [--limit 50]
import "dotenv/config";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";

const LIMIT = Number(process.argv.includes("--limit") ? process.argv[process.argv.indexOf("--limit") + 1] : 50);
const MODEL = process.env.CLASSIFIER_MODEL ?? "claude-sonnet-5-5";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic();

type Article = { title: string; url: string; publishedAt: string; snippet: string };

// Swap this for whichever news API you pick. Keep the shape.
async function searchNews(query: string): Promise<Article[]> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("language", "en");
  const res = await fetch(url, { headers: { "X-Api-Key": process.env.NEWS_API_KEY! } });
  if (!res.ok) throw new Error(`news api ${res.status}`);
  const json = (await res.json()) as { articles: { title: string; url: string; publishedAt: string; description: string }[] };
  return json.articles.map((a) => ({ title: a.title, url: a.url, publishedAt: a.publishedAt, snippet: a.description ?? "" }));
}

const STATUSES = ["active", "acquired", "closed", "deal_closed", "deal_fell_through"] as const;

type Classification = {
  relevant: boolean;
  relevance_reason: string;
  status: (typeof STATUSES)[number] | null;
  summary: string | null;
  confidence: number;
  event_date: string | null; // YYYY-MM-DD if the article states when it happened
};

async function classify(company: { name: string; description: string; season: number; deal_sharks: string[] | null }, a: Article): Promise<Classification> {
  const prompt = `You are classifying a news article for a database that tracks what happened to companies after they appeared on Shark Tank.

Company: ${company.name}
What they pitched (season ${company.season}): ${company.description}
On-air deal with: ${company.deal_sharks?.join(", ") ?? "no deal"}

Article title: ${a.title}
Published: ${a.publishedAt}
Snippet: ${a.snippet}
URL: ${a.url}

Answer with JSON only:
{
  "relevant": boolean,            // true ONLY if the article is about this specific company (not a same-named business, not a generic Shark Tank roundup that merely lists them)
  "relevance_reason": string,     // one sentence
  "status": one of ${JSON.stringify(STATUSES)} or null,
  "summary": string or null,      // 1-2 sentences, your own words, stating the concrete new fact
  "confidence": number 0-1,
  "event_date": "YYYY-MM-DD" or null
}
If the snippet does not contain a concrete fact about the company's current state, set relevant=false.`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "{}";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json) as Classification;
}

await db.connect();
const { rows: companies } = await db.query<{
  id: string; name: string; description: string; season: number; deal_sharks: string[] | null;
}>(
  `select c.id, c.name, c.description, e.season, c.deal_sharks
     from companies c join episodes e on e.id = c.episode_id
    order by c.last_verified_at nulls first, e.air_date
    limit $1`,
  [LIMIT],
);

let queued = 0;
for (const c of companies) {
  let articles: Article[] = [];
  try {
    articles = await searchNews(`"${c.name}" "Shark Tank"`);
  } catch (e) {
    console.error(`search failed for ${c.name}:`, e);
    continue;
  }
  for (const a of articles) {
    const seen = await db.query("select 1 from update_candidates where company_id = $1 and article_url = $2", [c.id, a.url]);
    if (seen.rowCount) continue;
    let r: Classification;
    try {
      r = await classify(c, a);
    } catch (e) {
      console.error(`classify failed for ${c.name} / ${a.url}:`, e);
      continue;
    }
    if (!r.relevant || r.confidence < 0.5) continue;
    await db.query(
      `insert into update_candidates
         (company_id, article_url, article_title, article_date, proposed_status, proposed_summary,
          confidence, relevance_reason, raw_excerpt, model)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict do nothing`,
      [c.id, a.url, a.title, r.event_date ?? a.publishedAt.slice(0, 10), r.status, r.summary,
       r.confidence, r.relevance_reason, a.snippet, MODEL],
    );
    queued++;
  }
}
console.log(`checked ${companies.length} companies, queued ${queued} candidates`);
await db.end();
