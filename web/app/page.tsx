import Link from "next/link";
import { getFeaturedCompanies, getSeasons } from "@/lib/companies";
import { CompanyGrid } from "./company-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, seasons] = await Promise.all([getFeaturedCompanies(), getSeasons()]);
  const total = seasons.reduce((n, s) => n + s.companies, 0);
  return (
    <>
      <h1>What happened to every Shark Tank company?</h1>
      <p className="lede">
        {total} companies across {seasons.length} season{seasons.length === 1 ? "" : "s"}, each with a sourced timeline of
        what came after the pitch. Browse by season, or <Link href="/contribute">tell us what you know</Link>.
      </p>

      <h2>Seasons</h2>
      {seasons.map((s) => (
        <div className="season-row" key={s.season}>
          <Link href={`/season/${s.season}`}>Season {s.season}</Link>
          <span className="muted">{s.episodes} episodes · {s.companies} companies</span>
        </div>
      ))}

      <h2>Biggest successes</h2>
      {featured.length ? (
        <CompanyGrid companies={featured} />
      ) : (
        <p className="muted">Coming soon.</p>
      )}
    </>
  );
}
