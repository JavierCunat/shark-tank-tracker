import type { Metadata } from "next";
import Link from "next/link";
import { SHARKS, getSharkStats, sharkSlug } from "@/lib/sharks";
import { money } from "@/lib/companies";
import { Marquee } from "@/components/marquee";
import { OceanBackground } from "@/components/ocean-background";
import ascii from "@/lib/shark-ascii.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Sharks: every investor's deals and track record",
  description: "Every Shark Tank investor, how many deals they've made on air, how much they've put in, and how those companies are doing now.",
  alternates: { canonical: "/sharks" },
};

const ART = ascii as Record<string, string>;
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

export default async function SharksPage() {
  const stats = await getSharkStats();
  const byName = new Map(stats.map((s) => [s.name, s]));
  const roster = [
    ...SHARKS.map((s) => ({ ...s, stats: byName.get(s.name) })),
    ...stats.filter((s) => !SHARKS.some((k) => k.name === s.name)).map((s) => ({ slug: sharkSlug(s.name), name: s.name, bio: "", seasons: "Guest", stats: s })),
  ].filter((s) => s.stats);

  const totalDeals = stats.reduce((n, s) => n + s.deals, 0);
  const totalInvested = stats.reduce((n, s) => n + s.invested, 0);
  const top = [...stats].sort((a, b) => b.invested - a.invested)[0];

  return (
    <section className="sharks-page">
      <OceanBackground />

      <div className="sharks-inner">
        <header className="sharks-head">
          <div className="sharks-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 14c3-1 5-6 10-6 4 0 6 2 10 2-2 3-5 5-10 5-4 0-6-1-10-1Z" /><path d="M12 8c1-3 2-4 4-5-1 2-1 3 0 5" /><path d="M6 15l-2 4 5-2" />
            </svg>
          </div>
          <h1>Meet the Sharks</h1>
          <p>Every on-air deal they've made, and how those companies are doing today.</p>
        </header>

        <div className="sharks-marquee">
          <Marquee duration={48} gap={24}>
            {roster.map((s) => {
              const st = s.stats!;
              const known = st.deals - st.unknown;
              const going = known > 0 ? Math.round((st.active / known) * 100) + "%" : "–";
              return (
                <Link href={`/shark/${s.slug}`} className="mcard" key={s.slug}>
                  <div className="mcard-portrait">
                    {ART[s.slug] ? <pre className="shark3d-ascii">{ART[s.slug]}</pre> : <span className="mcard-initials">{initials(s.name)}</span>}
                  </div>
                  <div className="mcard-caption">
                    <h3>{s.name}</h3>
                    <p>{s.seasons} · {st.deals} deals · {going} still going</p>
                  </div>
                </Link>
              );
            })}
          </Marquee>
        </div>

        <div className="sharks-quote">
          <p>
            {totalDeals} on-air deals worth {money(totalInvested)} so far
            {top ? <>, with {top.name} the biggest spender at {money(top.invested)}.</> : "."}
          </p>
          <span className="muted">Figures are the amounts agreed on air; "still going" counts verified companies only.</span>
        </div>
      </div>
    </section>
  );
}
