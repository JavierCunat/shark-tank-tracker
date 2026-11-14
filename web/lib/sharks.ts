import { query, type CompanyCard } from "./companies";

export type NotableDeal = { name: string; slug: string; season: number; note: string };

export type SharkProfile = {
  slug: string; name: string; seasons: string;
  bio: string;            // one line, used on cards
  about: string[];        // paragraphs for the profile page
  style: string;          // how they invest, one line
  notable: NotableDeal[]; // famous deals, independent of which seasons are loaded
};

// Editorial content. Stats and the deal list come from the database.
export const SHARKS: SharkProfile[] = [
  {
    slug: "barbara-corcoran", name: "Barbara Corcoran", seasons: "Season 1–present",
    bio: "Built The Corcoran Group into New York's biggest residential brokerage and sold it for $66 million.",
    about: [
      "Barbara Corcoran started The Corcoran Group in 1973 with a $1,000 loan and grew it into one of New York's largest residential real-estate brokerages before selling it to NRT for $66 million in 2001.",
      "On Shark Tank she is the shark most openly guided by the founder rather than the numbers, and she has said she looks for people who have overcome something. Her deals skew toward food, consumer products and franchises with a strong story.",
    ],
    style: "Bets on founders over spreadsheets; likes food and franchises.",
    notable: [
      { name: "Cousins Maine Lobster", slug: "cousins-maine-lobster", season: 4, note: "$55K for 15%; grew into a nationwide franchise with over $1B in systemwide sales." },
      { name: "The Comfy", slug: "the-comfy", season: 9, note: "$50K for 30%; the wearable blanket passed $550M in sales." },
      { name: "Grace and Lace", slug: "grace-and-lace", season: 5, note: "$175K for 10%; became a multi-million-dollar apparel brand." },
      { name: "Pork Barrel BBQ", slug: "pork-barrel-bbq", season: 1, note: "$50K for 50%; one of the original season's lasting successes." },
    ],
  },
  {
    slug: "daymond-john", name: "Daymond John", seasons: "Season 1–present",
    bio: "Founder of FUBU, which he grew from his mother's house in Queens into a $6 billion apparel brand.",
    about: [
      "Daymond John co-founded FUBU in 1992, sewing the first hats in his mother's house in Hollis, Queens, and built it into a global apparel brand with more than $6 billion in sales.",
      "He is the tank's branding and licensing specialist, and his biggest Shark Tank win, Bombas, is the most successful company in the show's history by revenue.",
    ],
    style: "Branding, licensing and retail distribution; apparel is home turf.",
    notable: [
      { name: "Bombas", slug: "bombas", season: 6, note: "$200K for 17.5%; the sock company has passed $2B in lifetime sales, the show's biggest success." },
      { name: "Bubba's Q Boneless Ribs", slug: "bubbas-q", season: 5, note: "$300K for 30%; landed in thousands of stores." },
      { name: "Mr. Tod's Pie Factory", slug: "mr-tods-pie-factory", season: 1, note: "The very first deal in Shark Tank history, with Barbara Corcoran." },
    ],
  },
  {
    slug: "kevin-oleary", name: "Kevin O'Leary", seasons: "Season 1–present",
    bio: "\"Mr. Wonderful.\" Sold The Learning Company to Mattel for $4.2 billion.",
    about: [
      "Kevin O'Leary co-founded SoftKey, which became The Learning Company, and sold it to Mattel in 1999 for about $4.2 billion. He appeared on Dragons' Den in Canada before joining Shark Tank.",
      "He is known for royalty deals, venture-debt structures and blunt valuations, and he often prefers getting paid back per unit to owning equity.",
    ],
    style: "Royalties, debt and \"show me the money\"; brutal on valuation.",
    notable: [
      { name: "Wicked Good Cupcakes", slug: "wicked-good-cupcakes", season: 4, note: "A royalty deal that paid him back many times over before the company was acquired." },
      { name: "Plated", slug: "plated", season: 5, note: "Made an offer alongside Mark Cuban; the company later sold to Albertsons for about $200M." },
      { name: "Gift Card Rescue", slug: "gift-card-rescue", season: 1, note: "$200K for 50% with Robert Herjavec, one of the season's bigger checks." },
    ],
  },
  {
    slug: "robert-herjavec", name: "Robert Herjavec", seasons: "Season 1–present",
    bio: "Croatian-Canadian founder of the cybersecurity firm Herjavec Group.",
    about: [
      "Robert Herjavec emigrated from Croatia to Canada as a child, built and sold the security software firm BRAK Systems, and founded Herjavec Group, one of the largest cybersecurity companies in Canada.",
      "He is the tank's technology and enterprise shark and often the warmest negotiator, with a soft spot for founders with immigrant stories like his own.",
    ],
    style: "Tech and enterprise; often the most founder-friendly offer in the room.",
    notable: [
      { name: "Tipsy Elves", slug: "tipsy-elves", season: 5, note: "$100K for 10%; the holiday-apparel brand passed $125M in lifetime sales." },
      { name: "Grill Charms", slug: "grill-charms", season: 1, note: "$50K for 25%, one of his first deals." },
    ],
  },
  {
    slug: "kevin-harrington", name: "Kevin Harrington", seasons: "Season 1 only",
    bio: "Infomercial pioneer behind As Seen On TV; an original shark who left after Season 1.",
    about: [
      "Kevin Harrington is credited with inventing the infomercial and co-founded the As Seen On TV brand, selling billions of dollars of products through direct-response television.",
      "He was an original shark in Season 1 and was replaced by Mark Cuban from Season 2; several of his Season 1 deals were royalty or buyout structures that reflected his TV-sales background.",
    ],
    style: "Direct-response TV; buys products outright or takes royalties.",
    notable: [
      { name: "Element Bars", slug: "element-bars", season: 1, note: "$150K for 30% plus a royalty; the custom energy-bar company is still operating." },
      { name: "Nubrella", slug: "nubrella", season: 1, note: "$200K for 25% with Daymond John." },
    ],
  },
  {
    slug: "mark-cuban", name: "Mark Cuban", seasons: "Season 2–16",
    bio: "Sold Broadcast.com to Yahoo for $5.7 billion; the tank's biggest spender.",
    about: [
      "Mark Cuban sold his first company, MicroSolutions, to CompuServe, then co-founded Broadcast.com and sold it to Yahoo in 1999 for $5.7 billion in stock. He owned the Dallas Mavericks from 2000 until selling a majority stake in 2023.",
      "He joined Shark Tank in Season 2 and became its most active investor by dollars committed, favouring technology, consumer brands and founders who already have traction. He announced Season 16 would be his last as a regular.",
    ],
    style: "Writes the biggest checks; wants traction and a founder who knows the numbers.",
    notable: [
      { name: "Dude Wipes", slug: "dude-wipes", season: 9, note: "$300K for 25%; now does over $300M a year." },
      { name: "Ten Thirty One Productions", slug: "ten-thirty-one-productions", season: 5, note: "$2M for 20%, at the time the largest deal in the show's history." },
      { name: "Manscaped", slug: "manscaped", season: 10, note: "Handshake deal with Lori Greiner that fell through; the company went on to ~$300M a year anyway." },
    ],
  },
  {
    slug: "lori-greiner", name: "Lori Greiner", seasons: "Season 3–present",
    bio: "\"Queen of QVC,\" with hundreds of products and patents.",
    about: [
      "Lori Greiner invented a plastic earring organizer in 1996, sold it on QVC, and went on to create and sell hundreds of consumer products, earning the nickname \"Queen of QVC.\"",
      "She joined Shark Tank as a regular in Season 4 after guest appearances in Season 3, and her deals skew toward physical consumer products she can take straight to TV and retail. By number of hit products, she has the strongest record in the tank.",
    ],
    style: "Consumer products with a demo; a straight path to QVC and retail.",
    notable: [
      { name: "Scrub Daddy", slug: "scrub-daddy", season: 4, note: "$200K for 20%; the smiling sponge has passed $1.4B in lifetime sales." },
      { name: "Squatty Potty", slug: "squatty-potty", season: 6, note: "$350K for 10%; sold to Aterian in 2021 after $260M+ in sales." },
      { name: "Simply Fit Board", slug: "simply-fit-board", season: 7, note: "$125K for 25%; over $160M in retail sales." },
      { name: "Everlywell", slug: "everlywell", season: 9, note: "$1M line of credit; the at-home testing company passed $1.4B in sales." },
    ],
  },
];

export const sharkSlug = (name: string) => name.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type SharkStats = { name: string; deals: number; invested: number; active: number; closed: number; unknown: number };

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

/** Slugs of companies that exist in the database, so notable-deal links only point at real pages. */
export async function getExistingSlugs(slugs: string[]) {
  if (!slugs.length) return new Set<string>();
  const rows = await query<{ slug: string }>(`select slug from companies where slug = any($1)`, [slugs]);
  return new Set(rows.map((r) => r.slug));
}

export function searchSharks(q: string) {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  return SHARKS.filter((s) => s.name.toLowerCase().includes(needle) || s.bio.toLowerCase().includes(needle));
}
