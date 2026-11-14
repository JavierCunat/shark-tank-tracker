import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import path from "node:path";
import { SHARKS, getSharkDeals, getSharkStats, getExistingSlugs, sharkSlug, type SharkProfile } from "@/lib/sharks";
import { money } from "@/lib/companies";
import { CompanyGrid } from "@/app/company-grid";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function photoFor(slug: string): string | null {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    if (existsSync(path.join(process.cwd(), "public", "sharks", `${slug}.${ext}`))) return `/sharks/${slug}.${ext}`;
  }
  return null;
}

async function resolve(slug: string): Promise<SharkProfile | null> {
  const known = SHARKS.find((s) => s.slug === slug);
  if (known) return known;
  const stats = await getSharkStats();
  const hit = stats.find((s) => sharkSlug(s.name) === slug);
  return hit ? { slug, name: hit.name, seasons: "Guest shark", bio: "", about: [], style: "", notable: [] } : null;
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
  const [deals, stats, existing] = await Promise.all([
    getSharkDeals(shark.name), getSharkStats(), getExistingSlugs(shark.notable.map((n) => n.slug)),
  ]);
  const st = stats.find((s) => s.name === shark.name);
  const photo = photoFor(shark.slug);
  const wins = deals.filter((d) => ["acquired", "active", "deal_closed"].includes(d.current_status)).slice(0, 5);
  const rest = deals.filter((d) => !wins.includes(d));

  return (
    <>
      <p className="muted"><Link href="/sharks">Sharks</Link> · {shark.seasons}</p>

      <section className="profile">
        {photo && (
          <div className="profile-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={shark.name} />
          </div>
        )}
        <div className="profile-text">
          <h1>{shark.name}</h1>
          {shark.style && <p className="profile-style">{shark.style}</p>}
          {shark.about.map((para, i) => <p key={i} className="profile-para">{para}</p>)}
          {!shark.about.length && shark.bio && <p className="profile-para">{shark.bio}</p>}
        </div>
      </section>

      <dl className="facts">
        <dt>On-air deals tracked</dt><dd>{st?.deals ?? 0}</dd>
        <dt>Invested on air</dt><dd><strong>{money(st?.invested ?? 0)}</strong></dd>
        <dt>Verified outcomes</dt>
        <dd>{st ? <>{st.active} still going · {st.closed} closed or fell through · {st.unknown} not yet verified</> : "None in the seasons loaded so far"}</dd>
      </dl>

      {shark.notable.length > 0 && (
        <>
          <h2>Notable deals</h2>
          <ol className="notable">
            {shark.notable.map((n) => (
              <li key={n.slug}>
                <span className="notable-name">
                  {existing.has(n.slug) ? <Link href={`/company/${n.slug}`}>{n.name}</Link> : n.name}
                  <span className="muted"> · Season {n.season}</span>
                </span>
                <span className="notable-note">{n.note}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      <h2>Tracked deals{st?.deals ? ` (${st.deals})` : ""}</h2>
      {deals.length === 0 ? (
        <p className="muted">None of {shark.name}&apos;s seasons are loaded yet. Deals appear here as seasons are added.</p>
      ) : (
        <>
          {wins.length > 0 && (<><h3>Biggest wins</h3><CompanyGrid companies={wins} /></>)}
          {rest.length > 0 && (<><h3>{wins.length ? "Everything else" : "All deals"}</h3><CompanyGrid companies={rest} /></>)}
        </>
      )}
    </>
  );
}
