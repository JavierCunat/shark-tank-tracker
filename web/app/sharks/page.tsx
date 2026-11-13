import type { Metadata } from "next";
import Link from "next/link";
import { SHARKS, getSharkStats, sharkSlug } from "@/lib/sharks";
import { money } from "@/lib/companies";
import { Marquee } from "@/components/marquee";
import { OceanBackground } from "@/components/ocean-background";
import ascii from "@/lib/shark-ascii.json";
import { existsSync } from "node:fs";
import path from "node:path";

// Real portrait at public/sharks/<slug>.(png|jpg|webp); shown on hover over the ASCII.
function photoFor(slug: string): string | null {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    if (existsSync(path.join(process.cwd(), "public", "sharks", `${slug}.${ext}`))) return `/sharks/${slug}.${ext}`;
  }
  return null;
}

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
  const zero = (name: string) => ({ name, deals: 0, invested: 0, active: 0, closed: 0, unknown: 0 });
  const roster = [
    ...SHARKS.map((s) => ({ ...s, stats: byName.get(s.name) ?? zero(s.name) })),
    ...stats.filter((s) => !SHARKS.some((k) => k.name === s.name)).map((s) => ({ slug: sharkSlug(s.name), name: s.name, bio: "", seasons: "Guest", stats: s })),
  ];

  const totalDeals = stats.reduce((n, s) => n + s.deals, 0);
  const totalInvested = stats.reduce((n, s) => n + s.invested, 0);
  const top = [...stats].sort((a, b) => b.invested - a.invested)[0];

  return (
    <section className="sharks-page">
      <OceanBackground />

      <div className="sharks-inner">
        <header className="sharks-head">
          <h1>Meet the Sharks</h1>
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
                    {photoFor(s.slug) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="mcard-photo" src={photoFor(s.slug)!} alt="" loading="lazy" draggable={false} />
                    )}
                  </div>
                  <div className="mcard-caption">
                    <h3>{s.name}</h3>
                    <p>{s.seasons}{st.deals ? <> · {st.deals} deal{st.deals === 1 ? "" : "s"} · {going} still going</> : " · no deals tracked yet"}</p>
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
        </div>
      </div>
    </section>
  );
}
