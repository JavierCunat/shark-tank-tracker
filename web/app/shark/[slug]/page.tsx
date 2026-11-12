import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SHARKS, getSharkDeals, getSharkStats } from "@/lib/sharks";
import { money } from "@/lib/companies";
import { CompanyGrid } from "@/app/company-grid";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  const known = SHARKS.find((s) => s.slug === slug);
  if (known) return known;
  const stats = await getSharkStats();
  const hit = stats.find((s) => s.name.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-") === slug);
  return hit ? { slug, name: hit.name, bio: "", seasons: "Guest shark" } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shark = await resolve((await params).slug);
  if (!shark) return {};
  return {
    title: `${shark.name}'s Shark Tank deals: every company and where they are now`,
    description: `All of ${shark.name}'s on-air Shark Tank deals, ranked by how the companies turned out, with sourced updates on each.`,
    alternates: { canonical: `/shark/${shark.slug}` },
  };
}

export default async function SharkPage({ params }: Props) {
  const shark = await resolve((await params).slug);
  if (!shark) notFound();
  const [deals, stats] = await Promise.all([getSharkDeals(shark.name), getSharkStats()]);
  const st = stats.find((s) => s.name === shark.name);
  const wins = deals.filter((d) => ["acquired", "active", "deal_closed"].includes(d.current_status)).slice(0, 5);
  const rest = deals.filter((d) => !wins.includes(d));

  return (
    <>
      <p className="muted"><Link href="/sharks">Sharks</Link> · {shark.seasons}</p>
      <h1>{shark.name}</h1>
      {shark.bio && <p className="lede">{shark.bio}</p>}

      {st && (
        <dl className="facts">
          <dt>On-air deals</dt><dd>{st.deals}</dd>
          <dt>Invested on air</dt><dd><strong>{money(st.invested)}</strong></dd>
          <dt>Verified outcomes</dt>
          <dd>{st.active} still going · {st.closed} closed or fell through · {st.unknown} not yet verified</dd>
        </dl>
      )}

      <h2>Biggest wins</h2>
      {wins.length ? (
        <CompanyGrid companies={wins} />
      ) : (
        <p className="muted">No verified successes yet; check back as updates are confirmed.</p>
      )}

      {rest.length > 0 && (
        <>
          <h2>All other deals</h2>
          <CompanyGrid companies={rest} />
        </>
      )}
    </>
  );
}
