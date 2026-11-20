import Link from "next/link";
import { getFeaturedCompanies, getSeasons, getRecentlyUpdated, getStatusCounts, STATUS_LABEL } from "@/lib/companies";
import { getHeroImages } from "@/lib/hero-images";
import { CompanyGrid } from "./company-grid";
import { SearchBox } from "./search-box";
import { ImageStreamHero } from "@/components/image-stream-hero";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, seasons, heroImages, recent, counts] = await Promise.all([getFeaturedCompanies(), getSeasons(), getHeroImages(), getRecentlyUpdated(), getStatusCounts()]);
  const count = (k: string) => counts.find((c) => c.current_status === k)?.n ?? 0;
  const total = seasons.reduce((n, s) => n + s.companies, 0);

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

      <h2>Seasons</h2>
      {seasons.map((s) => (
        <div className="season-row" key={s.season}>
          <Link href={`/season/${s.season}`}>Season {s.season}</Link>
          <span className="muted">{s.episodes} episodes · {s.companies} companies</span>
        </div>
      ))}

      <h2>Browse by what happened</h2>
      <div className="status-links">
        {(["active", "acquired", "closed", "deal_fell_through", "deal_closed"] as const).map((k) => (
          <Link key={k} href={`/status/${k}`} className={`status-link ${k}`}>
            <span className="n">{count(k)}</span><span>{STATUS_LABEL[k]}</span>
          </Link>
        ))}
      </div>

      {recent.length > 0 && (<><h2>Recently updated</h2><CompanyGrid companies={recent} /></>)}

      <h2>Biggest successes</h2>
      {featured.length ? <CompanyGrid companies={featured} /> : <p className="muted">Coming soon.</p>}
      <p className="muted" style={{ marginTop: 18 }}>
        Know what happened to one of these companies? <Link href="/contribute">Tell us</Link>.
      </p>
    </>
  );
}
