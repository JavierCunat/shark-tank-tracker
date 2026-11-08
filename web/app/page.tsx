import Link from "next/link";
import { getAllCompanies, getSeasons, STATUS_LABEL } from "@/lib/companies";
import { CompanyGrid } from "./company-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [companies, seasons] = await Promise.all([getAllCompanies(), getSeasons()]);
  const withUpdates = companies.filter((c) => c.latest_update_date).length;
  return (
    <>
      <h1>What happened to every Shark Tank company?</h1>
      <p className="lede">
        {companies.length} companies tracked across {seasons.length} season{seasons.length === 1 ? "" : "s"}, with sourced
        updates on {withUpdates} of them so far. Every status links to where we found it.
      </p>
      <h2>Seasons</h2>
      {seasons.map((s) => (
        <div className="season-row" key={s.season}>
          <Link href={`/season/${s.season}`}>Season {s.season}</Link>
          <span className="muted">{s.episodes} episodes · {s.companies} companies</span>
        </div>
      ))}

      <h2>All companies</h2>
      <CompanyGrid companies={companies} />
      <footer>Statuses: {Object.values(STATUS_LABEL).join(" · ")}</footer>
    </>
  );
}
