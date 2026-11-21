import type { Metadata } from "next";
import Link from "next/link";
import { getSeasonSummaries, money } from "@/lib/companies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Every Shark Tank Season: companies, deals and where they are now",
  description: "Browse every season of Shark Tank, episode by episode, with sourced updates on what happened to each company.",
  alternates: { canonical: "/seasons" },
};

const year = (d: string) => d.slice(0, 4);
const compact = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : `$${Math.round(n / 1000)}K`;

export default async function SeasonsPage() {
  const seasons = await getSeasonSummaries();
  const total = seasons.reduce((n, s) => n + s.companies, 0);
  const invested = seasons.reduce((n, s) => n + s.invested, 0);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Browse</p>
        <h1>Every season</h1>
        <p className="lede">{total} companies, {compact(invested)} offered on air, and a sourced answer to what happened next. More seasons land as they're verified.</p>
      </section>

      <div className="season-cards">
        {seasons.map((s, i) => {
          const y1 = year(s.first_aired), y2 = year(s.last_aired);
          const known = s.companies - s.unknown;
          const pct = (n: number) => `${(n / Math.max(1, s.companies)) * 100}%`;
          return (
            <Link href={`/season/${s.season}`} className="season-card" key={s.season} style={{ "--i": i } as React.CSSProperties}>
              <div className="season-card-top">
                <span className="season-big">{s.season}</span>
                <span className="season-years">{y1 === y2 ? y1 : `${y1}–${y2}`}</span>
              </div>
              <div className="season-stats">
                <div><strong>{s.companies}</strong><span>companies</span></div>
                <div><strong>{s.deals}</strong><span>deals</span></div>
                <div><strong className="money">{compact(s.invested)}</strong><span>on the table</span></div>
              </div>
              <div className="outcome-bar" title={`${s.active} still going · ${s.acquired} acquired · ${s.closed} closed · ${s.unknown} unverified`}>
                <span className="active" style={{ width: pct(s.active) }} />
                <span className="acquired" style={{ width: pct(s.acquired) }} />
                <span className="closed" style={{ width: pct(s.closed) }} />
                <span className="unknown" style={{ width: pct(s.unknown) }} />
              </div>
              <div className="outcome-legend">
                {known > 0 ? <><b>{Math.round(((s.active + s.acquired) / known) * 100)}%</b> of verified companies still going</> : "Verification in progress"}
              </div>
              {s.top_name && (
                <div className="season-top">
                  <span className="muted">Standout</span>
                  <span className="season-top-name">{s.top_name}</span>
                  {s.top_amount != null && <span className="muted">{money(s.top_amount)} deal</span>}
                </div>
              )}
              <span className="season-cta">{s.episodes} episodes →</span>
            </Link>
          );
        })}
      </div>

      <p className="muted outcome-key">
        <i className="k active" /> still going <i className="k acquired" /> acquired <i className="k closed" /> closed or deal fell through <i className="k unknown" /> not yet verified
      </p>
    </>
  );
}
