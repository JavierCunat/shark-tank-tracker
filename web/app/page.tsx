import Link from "next/link";
import { getFeaturedCompanies, getSeasonSummaries, getStatusCounts, STATUS_LABEL, longDate, money } from "@/lib/companies";
import { getHeroImages } from "@/lib/hero-images";
import { SearchBox } from "./search-box";
import { ImageStreamHero } from "@/components/image-stream-hero";

export const dynamic = "force-dynamic";

const compact = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : `$${Math.round(n / 1000)}K`;
const year = (d: string) => d.slice(0, 4);

const STATUS_BLURB: Record<string, string> = {
  active: "Verified operating today",
  acquired: "Bought after the show",
  closed: "Shut down since airing",
  deal_fell_through: "Handshakes that never closed",
  deal_closed: "Handshakes that became real",
};

export default async function Home() {
  const [featured, seasons, heroImages, counts] = await Promise.all([getFeaturedCompanies(), getSeasonSummaries(), getHeroImages(), getStatusCounts()]);
  const total = seasons.reduce((n, s) => n + s.companies, 0);
  const count = (k: string) => counts.find((c) => c.current_status === k)?.n ?? 0;

  return (
    <>
      <ImageStreamHero images={heroImages} className="home-hero" cards={9} speed={20} axis={56}>
        <div className="home-hero-content">
          <h1>What happened to every Shark Tank company?</h1>
          <p className="lede">
            {total} companies across {seasons.length} season{seasons.length === 1 ? "" : "s"}, each with a sourced timeline
            of what came next.
          </p>
          <SearchBox />
        </div>
      </ImageStreamHero>

      <section className="home-section">
        <div className="section-head">
          <h2>Seasons</h2>
          <Link href="/seasons" className="section-more">All seasons →</Link>
        </div>
        <div className="season-strip">
          {seasons.map((s) => {
            const pct = (n: number) => `${(n / Math.max(1, s.companies)) * 100}%`;
            return (
              <Link href={`/season/${s.season}`} className="season-mini" key={s.season}>
                <span className="season-mini-num">{s.season}</span>
                <span className="season-mini-year">{year(s.first_aired)}</span>
                <span className="season-mini-meta">{s.companies} companies · {s.deals} deals</span>
                <div className="outcome-bar">
                  <span className="active" style={{ width: pct(s.active) }} />
                  <span className="acquired" style={{ width: pct(s.acquired) }} />
                  <span className="closed" style={{ width: pct(s.closed) }} />
                  <span className="unknown" style={{ width: pct(s.unknown) }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>Biggest successes</h2>
          <Link href="/status/acquired" className="section-more">Acquired companies →</Link>
        </div>
        {featured.length ? (
          <div className="feature-grid">
            {featured.map((c, i) => (
              <Link href={`/company/${c.slug}`} className="feature-card" key={c.id}>
                <span className="feature-rank">{String(i + 1).padStart(2, "0")}</span>
                <span className={`badge ${c.current_status}`}>{STATUS_LABEL[c.current_status]}</span>
                <span className="feature-name">{c.name}</span>
                <span className="feature-meta">Season {c.season} · {longDate(c.air_date)}</span>
                {c.deal_on_air && c.deal_amount_usd != null && (
                  <span className="feature-deal"><span className="money">{money(c.deal_amount_usd)}</span> for {c.deal_equity_pct}% · {c.deal_sharks?.join(" & ")}</span>
                )}
                {c.latest_update_summary && <span className="feature-summary">{c.latest_update_summary}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Coming soon.</p>
        )}
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>Browse by what happened</h2>
          <Link href="/about" className="section-more">How we verify →</Link>
        </div>
        <div className="status-tiles">
          {(["active", "acquired", "closed", "deal_fell_through", "deal_closed"] as const).map((k) => (
            <Link key={k} href={`/status/${k}`} className={`status-tile ${k}`}>
              <span className="status-tile-n">{count(k)}</span>
              <span className="status-tile-label">{STATUS_LABEL[k]}</span>
              <span className="status-tile-blurb">{STATUS_BLURB[k]}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="muted" style={{ marginTop: 28 }}>
        Know what happened to one of these companies? <Link href="/contribute">Tell us</Link>.
      </p>
    </>
  );
}
