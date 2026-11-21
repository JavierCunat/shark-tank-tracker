import type { Metadata } from "next";
import Link from "next/link";
import { getSeasons, longDate } from "@/lib/companies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Every Shark Tank Season: companies, deals and where they are now",
  description: "Browse every season of Shark Tank, episode by episode, with sourced updates on what happened to each company.",
  alternates: { canonical: "/seasons" },
};

export default async function SeasonsPage() {
  const seasons = await getSeasons();
  const total = seasons.reduce((n, s) => n + s.companies, 0);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Browse</p>
        <h1>Every season</h1>
        <p className="lede">{total} companies across {seasons.length} season{seasons.length === 1 ? "" : "s"} so far. More seasons are added as they're verified.</p>
      </section>
      <div className="season-cards">
        {seasons.map((s) => (
          <Link href={`/season/${s.season}`} className="card season-card" key={s.season}>
            <span className="season-num">Season {s.season}</span>
            <span className="meta">First aired {longDate(s.first_aired)}</span>
            <span className="meta">{s.episodes} episode{s.episodes === 1 ? "" : "s"} · {s.companies} companies</span>
          </Link>
        ))}
      </div>
    </>
  );
}
