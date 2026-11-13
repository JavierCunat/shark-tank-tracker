import Link from "next/link";
import { getFeaturedCompanies, getSeasons } from "@/lib/companies";
import { getHeroImages } from "@/lib/hero-images";
import { CompanyGrid } from "./company-grid";
import { SearchBox } from "./search-box";
import { ImageStreamHero } from "@/components/image-stream-hero";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, seasons, heroImages] = await Promise.all([getFeaturedCompanies(), getSeasons(), getHeroImages()]);
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

      <h2>Biggest successes</h2>
      {featured.length ? <CompanyGrid companies={featured} /> : <p className="muted">Coming soon.</p>}
      <p className="muted" style={{ marginTop: 18 }}>
        Know what happened to one of these companies? <Link href="/contribute">Tell us</Link>.
      </p>
    </>
  );
}
