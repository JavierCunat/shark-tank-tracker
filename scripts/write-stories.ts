// Backfill write-ups for companies that already have verified updates but no story yet.
// Uses the existing timeline + sources as grounding, with a few web searches to fill gaps.
// Results go to update_candidates (kind='story') for review. Never writes to companies directly.
//
// Run: npm run write-stories -- --limit 10     |   npm run write-stories -- --slug pork-barrel-bbq
import "dotenv/config";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";
import { STORY_SPEC, STORY_RULES, normalizeStory } from "./story-prompt";

const argv = process.argv.slice(2);
const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const LIMIT = Number(arg("--limit") ?? 10);
const SLUG = arg("--slug");
const MODEL = process.env.RESEARCH_MODEL ?? "claude-sonnet-5-5";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic();
await db.connect();

const { rows: companies } = await db.query<any>(
  `select c.id, c.slug, c.name, c.description, c.deal_on_air, c.deal_sharks, c.deal_amount_usd, c.deal_equity_pct, c.deal_notes, c.website_url,
          e.season, e.episode_in_season, e.air_date::text,
          coalesce(json_agg(json_build_object('date', u.update_date, 'status', u.status, 'summary', u.summary, 'source_url', u.source_url, 'source_name', u.source_name)
                   order by u.update_date desc) filter (where u.id is not null), '[]') as updates
     from companies c join episodes e on e.id = c.episode_id
     left join updates u on u.company_id = c.id
    where c.story is null
      ${SLUG ? "and c.slug = $2" : "and exists (select 1 from updates x where x.company_id = c.id) and not exists (select 1 from update_candidates q where q.company_id = c.id and q.kind = 'story' and q.status = 'pending')"}
    group by c.id, e.season, e.episode_in_season, e.air_date
    order by e.air_date, c.name
    limit $1`,
  SLUG ? [LIMIT, SLUG] : [LIMIT],
);
if (!companies.length) { console.log("nothing to write (every verified company has a story or a story pending review)"); await db.end(); process.exit(0); }

let queued = 0;
for (const c of companies) {
  process.stdout.write(`writing ${c.name} (S${c.season}E${c.episode_in_season})... `);
  const deal = c.deal_on_air
    ? `Accepted on air: $${c.deal_amount_usd?.toLocaleString()} for ${c.deal_equity_pct}% from ${c.deal_sharks?.join(" and ")}${c.deal_notes ? ` (${c.deal_notes})` : ""}.`
    : "No deal on air.";
  const prompt = `Write the story of a Shark Tank company for a reference site. You may use web search (a few times) to fill gaps, but the verified facts below are authoritative; do not contradict them.

Company: ${c.name}
Pitched: ${c.description}
Aired: Season ${c.season}, episode ${c.episode_in_season}, ${c.air_date}
${deal}
${c.website_url ? `Website: ${c.website_url}` : ""}

Verified updates (most recent first):
${(c.updates as any[]).map((u) => `- ${u.date} [${u.status}] ${u.summary} (source: ${u.source_url}${u.source_name ? ", " + u.source_name : ""})`).join("\n") || "- none"}

${STORY_RULES}

Reply with ONLY a JSON object:
{
  ${STORY_SPEC}
}`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL, max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 } as any],
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    const a = text.indexOf("{"), z = text.lastIndexOf("}");
    const story = normalizeStory(JSON.parse(text.slice(a, z + 1))?.story);
    if (!story) { console.log("no usable story"); continue; }
    await db.query(
      `insert into update_candidates (company_id, article_url, article_title, proposed_story, kind, model, relevance_reason, origin)
       values ($1, $2, $3, $4, 'story', $5, 'Story draft from verified updates', 'research')
       on conflict (company_id, article_url) do update set proposed_story = excluded.proposed_story, status = 'pending'`,
      [c.id, `story:${c.slug}`, story.sources[0]?.name ?? null, JSON.stringify(story), MODEL],
    );
    queued++; console.log(`queued (${story.sources.length} sources)`);
  } catch (e) {
    console.log(`failed: ${(e as Error).message}`);
  }
}
console.log(`\nqueued ${queued} story drafts. Run: npm run review`);
await db.end();
