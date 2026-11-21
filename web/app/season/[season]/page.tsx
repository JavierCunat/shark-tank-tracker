import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesBySeason, getSeasons, longDate } from "@/lib/companies";
import { CompanyGrid } from "@/app/company-grid";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ season: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  return {
    title: `Shark Tank Season ${season}: Every Company and Where They Are Now`,
    description: `All the businesses that pitched in Shark Tank season ${season}, the deals they got on air, and what happened to each one afterward.`,
    alternates: { canonical: `/season/${season}` },
  };
}

export default async function SeasonPage({ params }: Props) {
  const seasonNum = Number((await params).season);
  if (!Number.isInteger(seasonNum)) notFound();
  const [companies, seasons] = await Promise.all([getCompaniesBySeason(seasonNum), getSeasons()]);
  if (companies.length === 0) notFound();
  const nums = seasons.map((s) => s.season);
  const prev = nums.filter((n) => n < seasonNum).pop();
  const next = nums.find((n) => n > seasonNum);

  const first = companies[0].air_date;
  const last = companies[companies.length - 1].air_date;

  // group by episode
  const byEpisode = new Map<number, typeof companies>();
  for (const c of companies) byEpisode.set(c.episode_in_season, [...(byEpisode.get(c.episode_in_season) ?? []), c]);

  return (
    <>
      <section className="hero">
        <p className="eyebrow"><Link href="/seasons">All seasons</Link> · Season {seasonNum}</p>
        <h1>Every company and where they are now</h1>
        <p className="lede">
          {companies.length} businesses across {byEpisode.size} episodes, {longDate(first)} to {longDate(last)}.
        </p>
      </section>
      {[...byEpisode.entries()].map(([ep, list]) => (
        <section key={ep}>
          <h2 id={`episode-${ep}`}>Episode {ep} <span className="muted">· {longDate(list[0].air_date)}</span></h2>
          <CompanyGrid companies={list} />
        </section>
      ))}
      <nav className="season-nav" aria-label="Season navigation">
        {prev ? <Link href={`/season/${prev}`}>← Season {prev}</Link> : <span />}
        <Link href="/seasons">All seasons</Link>
        {next ? <Link href={`/season/${next}`}>Season {next} →</Link> : <span />}
      </nav>
    </>
  );
}
