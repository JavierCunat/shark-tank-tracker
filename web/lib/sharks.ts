import { query, type CompanyCard } from "./companies";

// Bios are editorial; stats come from the database. Add a shark here when a new one appears in deal_sharks.
export const SHARKS: { slug: string; name: string; bio: string; seasons: string }[] = [
  { slug: "barbara-corcoran", name: "Barbara Corcoran", bio: "Built The Corcoran Group into New York's biggest residential brokerage and sold it for $66 million. Known for betting on founders over spreadsheets.", seasons: "Season 1–present" },
  { slug: "daymond-john", name: "Daymond John", bio: "Founder of FUBU, which he grew from his mother's house in Queens into a $6 billion apparel brand. The branding and licensing shark.", seasons: "Season 1–present" },
  { slug: "kevin-oleary", name: "Kevin O'Leary", bio: "\"Mr. Wonderful.\" Sold The Learning Company to Mattel for $4.2 billion. Famous for royalty deals and brutal valuations.", seasons: "Season 1–present" },
  { slug: "robert-herjavec", name: "Robert Herjavec", bio: "Croatian-Canadian founder of the cybersecurity firm Herjavec Group. The tech and enterprise shark, and often the softest touch.", seasons: "Season 1–present" },
  { slug: "kevin-harrington", name: "Kevin Harrington", bio: "Infomercial pioneer behind As Seen On TV. An original shark who left after Season 1 and was replaced by Mark Cuban.", seasons: "Season 1 only" },
  { slug: "mark-cuban", name: "Mark Cuban", bio: "Sold Broadcast.com to Yahoo for $5.7 billion, then owned the Dallas Mavericks. Joined in Season 2 and became the tank's biggest spender.", seasons: "Season 2–16" },
  { slug: "lori-greiner", name: "Lori Greiner", bio: "\"Queen of QVC,\" with hundreds of products and patents. Joined in Season 3; her deals skew toward consumer products that can sell on TV.", seasons: "Season 3–present" },
];

export const sharkSlug = (name: string) => name.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type SharkStats = {
  name: string;
  deals: number;
  invested: number;
  active: number;   // deals whose company is active / acquired / deal_closed
  closed: number;   // closed / deal_fell_through
  unknown: number;
};

export function getSharkStats() {
  return query<SharkStats>(
    `select s.name,
            count(*)::int as deals,
            coalesce(sum(c.deal_amount_usd), 0)::int as invested,
            count(*) filter (where c.current_status in ('active','acquired','deal_closed'))::int as active,
            count(*) filter (where c.current_status in ('closed','deal_fell_through'))::int as closed,
            count(*) filter (where c.current_status = 'unknown')::int as unknown
       from companies c, unnest(c.deal_sharks) as s(name)
      where c.deal_on_air
      group by s.name
      order by deals desc, invested desc`,
  );
}

export function getSharkDeals(name: string) {
  // Ranked: best known outcome first, then biggest check.
  return query<CompanyCard>(
    `select cc.* from company_cards cc
      where cc.deal_on_air and $1 = any(cc.deal_sharks)
      order by case cc.current_status
                 when 'acquired' then 0 when 'active' then 1 when 'deal_closed' then 2
                 when 'unknown' then 3 when 'deal_fell_through' then 4 when 'closed' then 5 end,
               cc.deal_amount_usd desc nulls last, cc.season, cc.episode_in_season`,
    [name],
  );
}
