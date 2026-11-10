import { query } from "./db";

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

export const longDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
