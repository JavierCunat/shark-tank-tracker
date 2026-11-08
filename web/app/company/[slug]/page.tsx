import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getUpdates, STATUS_LABEL, longDate, money } from "@/lib/companies";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) return {};
  const year = c.latest_update_date ? new Date(c.latest_update_date).getFullYear() : new Date().getFullYear();
  const title = `What Happened to ${c.name} After Shark Tank? (${year} Update)`;
  const description = c.latest_update_summary
    ?? `${c.name} pitched on Shark Tank season ${c.season}, episode ${c.episode_in_season} (${longDate(c.air_date)}). ${c.deal_on_air ? `They got a deal from ${c.deal_sharks?.join(" and ")}.` : "They left without a deal."} Here's what happened next.`;
  return {
    title,
    description,
    alternates: { canonical: `/company/${c.slug}` },
    openGraph: { title, description, type: "article", modifiedTime: c.latest_update_date ?? undefined },
  };
}

function answerParagraph(c: NonNullable<Awaited<ReturnType<typeof getCompany>>>) {
  const aired = `${c.name} appeared on Shark Tank in season ${c.season}, episode ${c.episode_in_season}, which aired ${longDate(c.air_date)}.`;
  const deal = c.deal_on_air
    ? ` On air, ${c.deal_sharks?.join(" and ")} agreed to invest ${money(c.deal_amount_usd)} for ${c.deal_equity_pct}% of the company.`
    : " The sharks passed and the founders left without a deal.";
  const now = c.latest_update_summary
    ? ` ${c.latest_update_summary}`
    : " We haven't verified what happened to them after the show yet; this page will update when we do.";
  return aired + deal + now;
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) notFound();
  const updates = await getUpdates(c.id);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: c.name,
        description: c.description,
        url: c.website_url ?? undefined,
      },
      {
        "@type": "Article",
        headline: `What Happened to ${c.name} After Shark Tank?`,
        mainEntityOfPage: `${site}/company/${c.slug}`,
        datePublished: c.air_date,
        dateModified: c.latest_update_date ?? c.air_date,
        about: { "@type": "Organization", name: c.name },
        publisher: { "@type": "Organization", name: "Shark Tank Tracker" },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="muted">
        <Link href={`/season/${c.season}`}>Season {c.season}</Link> · Episode {c.episode_in_season}
      </p>
      <h1>What happened to {c.name} after Shark Tank?</h1>
      <span className={`badge ${c.current_status}`}>{STATUS_LABEL[c.current_status]}</span>
      <p className="lede" style={{ marginTop: 14 }}>{answerParagraph(c)}</p>

      <dl className="facts">
        <dt>Pitched</dt><dd>{c.description}</dd>
        <dt>Aired</dt><dd>{longDate(c.air_date)} (S{c.season}E{c.episode_in_season})</dd>
        <dt>On-air deal</dt>
        <dd>{c.deal_on_air ? `${money(c.deal_amount_usd)} for ${c.deal_equity_pct}% from ${c.deal_sharks?.join(", ")}` : "None"}</dd>
        {c.deal_notes && (<><dt>Notes</dt><dd>{c.deal_notes}</dd></>)}
        {c.website_url && (<><dt>Website</dt><dd><a href={c.website_url} rel="nofollow noopener">{c.website_url}</a></dd></>)}
        <dt>Last verified</dt><dd>{c.last_verified_at ? longDate(c.last_verified_at) : "Not yet verified"}</dd>
      </dl>

      <h2>Timeline</h2>
      <ol className="timeline">
        {updates.map((u) => (
          <li key={u.id}>
            <time dateTime={u.update_date}>{longDate(u.update_date)} · {STATUS_LABEL[u.status]}</time>
            {u.summary}{" "}
            <a href={u.source_url} rel="nofollow noopener" className="muted">[{u.source_name ?? "source"}]</a>
          </li>
        ))}
        <li>
          <time dateTime={c.air_date}>{longDate(c.air_date)} · Aired</time>
          Pitched on Shark Tank, season {c.season} episode {c.episode_in_season}.{" "}
          {c.deal_on_air ? `Deal with ${c.deal_sharks?.join(" and ")}.` : "No deal."}
        </li>
      </ol>

      <footer>
        Know something we don't? Updates need a source link. Submission form coming soon.
      </footer>
    </>
  );
}
