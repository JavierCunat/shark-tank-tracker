import { query } from "./db";
export { query };

export type CompanyStatus = "unknown" | "active" | "acquired" | "closed" | "deal_closed" | "deal_fell_through";

export type CompanyCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  current_status: CompanyStatus;
  deal_on_air: boolean;
  deal_sharks: string[] | null;
  deal_amount_usd: number | null;
  deal_equity_pct: string | null;
  season: number;
  episode_in_season: number;
  air_date: string;
  latest_update_date: string | null;
  latest_update_summary: string | null;
  latest_update_source: string | null;
};

export type Update = {
  id: string;
  update_date: string;
  status: CompanyStatus;
  summary: string;
  source_url: string;
  source_name: string | null;
};

export const STATUS_LABEL: Record<CompanyStatus, string> = {
  unknown: "Status unknown",
  active: "Still in business",
  acquired: "Acquired",
  closed: "Out of business",
  deal_closed: "Deal closed",
  deal_fell_through: "Deal fell through",
};

export function getAllCompanies() {
  return query<CompanyCard>(
    `select * from company_cards order by season, episode_in_season, name`,
  );
}

export function getFeaturedCompanies() {
  return query<CompanyCard>(
    `select cc.* from company_cards cc join companies c on c.id = cc.id
      where c.featured_rank is not null
      order by c.featured_rank, cc.name`,
  );
}

export function searchCompanies(q: string) {
  // Prefix/word match on name or description. Postgres handles this fine at a few thousand rows;
  // swap for pg_trgm similarity if it ever gets slow or needs typo tolerance.
  const pattern = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
  return query<CompanyCard>(
    `select * from company_cards
      where name ilike $1 or description ilike $1 or array_to_string(deal_sharks, ' ') ilike $1
      order by (name ilike $1) desc, season, episode_in_season, name
      limit 60`,
    [pattern],
  );
}

export function getCompanyOptions() {
  return query<{ slug: string; name: string; season: number }>(
    `select slug, name, season from company_cards order by season, name`,
  );
}

export function getCompaniesBySeason(season: number) {
  return query<CompanyCard>(
    `select * from company_cards where season = $1 order by episode_in_season, name`,
    [season],
  );
}

export async function getCompany(slug: string) {
  const rows = await query<CompanyCard & { deal_notes: string | null; website_url: string | null; last_verified_at: string | null }>(
    `select cc.*, c.deal_notes, c.website_url, c.last_verified_at
       from company_cards cc join companies c on c.id = cc.id
      where cc.slug = $1`,
    [slug],
  );
  return rows[0] ?? null;
}

export function getUpdates(companyId: string) {
  return query<Update>(
    `select id, update_date, status, summary, source_url, source_name
       from updates where company_id = $1
      order by update_date desc, created_at desc`,
    [companyId],
  );
}

export function getSeasons() {
  return query<{ season: number; episodes: number; companies: number; first_aired: string }>(
    `select e.season, count(distinct e.id)::int as episodes, count(c.id)::int as companies, min(e.air_date) as first_aired
       from episodes e left join companies c on c.episode_id = e.id
      group by e.season order by e.season`,
  );
}

export function getAllSlugs() {
  return query<{ slug: string; latest_update_date: string | null; air_date: string }>(
    `select slug, latest_update_date, air_date from company_cards`,
  );
}

export const money = (n: number | null) =>
  n == null ? null : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const longDate = (d: string | Date) => {
  const iso = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

/** Other companies from the same episode, then other deals by the same sharks. */
export async function getRelatedCompanies(c: CompanyCard, limit = 6) {
  const sameEpisode = await query<CompanyCard>(
    `select * from company_cards where season = $1 and episode_in_season = $2 and id <> $3 order by name`,
    [c.season, c.episode_in_season, c.id],
  );
  if (sameEpisode.length >= limit || !c.deal_sharks?.length) return sameEpisode.slice(0, limit);
  const sameShark = await query<CompanyCard>(
    `select * from company_cards where deal_on_air and deal_sharks && $1::text[] and id <> $2 and not (season = $3 and episode_in_season = $4)
      order by random() limit $5`,
    [c.deal_sharks, c.id, c.season, c.episode_in_season, limit - sameEpisode.length],
  );
  return [...sameEpisode, ...sameShark];
}

export function getCompaniesByStatus(status: CompanyStatus) {
  return query<CompanyCard>(`select * from company_cards where current_status = $1 order by latest_update_date desc nulls last, season, episode_in_season, name`, [status]);
}

export function getRecentlyUpdated(limit = 8) {
  return query<CompanyCard>(`select * from company_cards where latest_update_date is not null order by latest_update_date desc limit $1`, [limit]);
}

export function getStatusCounts() {
  return query<{ current_status: CompanyStatus; n: number }>(`select current_status, count(*)::int as n from companies group by current_status`);
}

export type SeasonSummary = {
  season: number; episodes: number; companies: number; first_aired: string; last_aired: string;
  deals: number; invested: number; active: number; acquired: number; closed: number; unknown: number;
  top_name: string | null; top_slug: string | null; top_amount: number | null;
};

export function getSeasonSummaries() {
  return query<SeasonSummary>(
    `with s as (
       select e.season,
              count(distinct e.id)::int as episodes,
              count(c.id)::int as companies,
              min(e.air_date) as first_aired, max(e.air_date) as last_aired,
              count(c.id) filter (where c.deal_on_air)::int as deals,
              coalesce(sum(c.deal_amount_usd) filter (where c.deal_on_air), 0)::int as invested,
              count(c.id) filter (where c.current_status in ('active','deal_closed'))::int as active,
              count(c.id) filter (where c.current_status = 'acquired')::int as acquired,
              count(c.id) filter (where c.current_status in ('closed','deal_fell_through'))::int as closed,
              count(c.id) filter (where c.current_status = 'unknown')::int as unknown
         from episodes e left join companies c on c.episode_id = e.id
        group by e.season
     ),
     top as (
       select distinct on (e.season) e.season, c.name as top_name, c.slug as top_slug, c.deal_amount_usd as top_amount
         from companies c join episodes e on e.id = c.episode_id
        where c.deal_on_air
        order by e.season, (c.current_status in ('acquired','active','deal_closed')) desc, c.deal_amount_usd desc nulls last
     )
     select s.*, top.top_name, top.top_slug, top.top_amount
       from s left join top on top.season = s.season
      order by s.season`,
  );
}
