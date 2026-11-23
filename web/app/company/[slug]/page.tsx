import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getUpdates, getRelatedCompanies, STATUS_LABEL, longDate, money } from "@/lib/companies";
import { CompanyGrid } from "@/app/company-grid";
import { sharkSlug } from "@/lib/sharks";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) return {};
  const year = c.latest_update_date ? new Date(c.latest_update_date).getFullYear() : new Date().getFullYear();
  const title = `What Happened to ${c.name} After Shark Tank? (${year} Update)`;
  const description = c.story?.now
    ?? c.latest_update_summary
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

type C = NonNullable<Awaited<ReturnType<typeof getCompany>>>;

// The questions people actually google, answered from the data. Shown on the page AND emitted as FAQPage JSON-LD.
function buildFaq(c: C, updates: Awaited<ReturnType<typeof getUpdates>>) {
  const sharks = c.deal_sharks?.join(" and ");
  const verified = c.last_verified_at ? `, verified ${longDate(c.last_verified_at)}` : "";
  const latest = updates[0];
  const faq: { q: string; a: string }[] = [];

  faq.push({
    q: `Is ${c.name} still in business?`,
    a: c.current_status === "active" ? `Yes. As of our latest update${verified}, ${c.name} is still operating. ${latest?.summary ?? ""}`.trim()
     : c.current_status === "acquired" ? `${c.name} was acquired. ${latest?.summary ?? ""}`.trim()
     : c.current_status === "closed" ? `No. ${c.name} is no longer operating. ${latest?.summary ?? ""}`.trim()
     : `We haven't verified ${c.name}'s current status yet. This page updates as soon as a sourced update is confirmed.`,
  });
  faq.push({
    q: `Did ${c.name} get a deal on Shark Tank?`,
    a: c.deal_on_air
      ? `Yes. On air, ${sharks} agreed to invest ${money(c.deal_amount_usd)} for ${c.deal_equity_pct}% of ${c.name}${c.deal_notes ? ` (${c.deal_notes})` : ""}.` +
        (c.current_status === "deal_fell_through" ? " The deal later fell through after the show." : c.current_status === "deal_closed" ? " The deal closed after the show." : "")
      : `No. ${c.name} pitched in season ${c.season}, episode ${c.episode_in_season}, and left without a deal.`,
  });
  faq.push({
    q: `When was ${c.name} on Shark Tank?`,
    a: `${c.name} appeared in season ${c.season}, episode ${c.episode_in_season}, which first aired on ${longDate(c.air_date)}.`,
  });
  if (c.deal_on_air) faq.push({ q: `Which shark invested in ${c.name}?`, a: `${sharks} made the on-air deal with ${c.name}.` });
  if (c.website_url) faq.push({ q: `Where can I buy ${c.name}?`, a: `${c.name}'s website is ${c.website_url}.` });
  return faq;
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) notFound();
  const [updates, related] = await Promise.all([getUpdates(c.id), getRelatedCompanies(c)]);
  const site = SITE_URL;
  const faq = buildFaq(c, updates);

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
        dateModified: [c.story_updated_at?.slice(0, 10), c.latest_update_date].filter(Boolean).sort().pop() ?? c.air_date,
        about: { "@type": "Organization", name: c.name },
        publisher: { "@type": "Organization", name: "Shark Tank Tracker" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Shark Tank Tracker", item: site },
          { "@type": "ListItem", position: 2, name: `Season ${c.season}`, item: `${site}/season/${c.season}` },
          { "@type": "ListItem", position: 3, name: c.name, item: `${site}/company/${c.slug}` },
        ],
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

      {c.story && (
        <section className="story">
          <h2>The story</h2>
          <h3>The pitch</h3><p>{c.story.pitch}</p>
          <h3>The deal</h3><p>{c.story.deal}</p>
          <h3>After the show</h3><p>{c.story.after}</p>
          <h3>Where they are now</h3><p>{c.story.now}</p>
          {c.story.sources?.length > 0 && (
            <p className="story-sources">Sources: {c.story.sources.map((x, i) => <span key={x.url}>{i > 0 && " · "}<a href={x.url} rel="nofollow noopener">{x.name}</a></span>)}</p>
          )}
          {c.story_updated_at && <p className="muted story-date">Written {longDate(c.story_updated_at.slice(0, 10))}</p>}
        </section>
      )}

      <dl className="facts">
        <dt>Pitched</dt><dd>{c.description}</dd>
        <dt>Aired</dt><dd>{longDate(c.air_date)} (S{c.season}E{c.episode_in_season})</dd>
        <dt>On-air deal</dt>
        <dd>{c.deal_on_air ? <>{money(c.deal_amount_usd)} for {c.deal_equity_pct}% from {c.deal_sharks?.map((n, i) => <span key={n}>{i > 0 && ", "}<Link href={`/shark/${sharkSlug(n)}`}>{n}</Link></span>)}</> : "None"}</dd>
        <dt>Status</dt><dd><Link href={`/status/${c.current_status}`}>{STATUS_LABEL[c.current_status]}</Link></dd>
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

      <h2>Frequently asked</h2>
      <div className="faq">
        {faq.map((f) => (
          <details key={f.q} open>
            <summary><h3>{f.q}</h3></summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>

      {related.length > 0 && (
        <>
          <h2>More from {related.some((r) => r.season === c.season && r.episode_in_season === c.episode_in_season) ? "this episode" : "these sharks"}</h2>
          <CompanyGrid companies={related} />
        </>
      )}

      <footer>
        Know something we don&apos;t? <Link href={`/contribute?company=${c.slug}`}>Send an update</Link>
      </footer>
    </>
  );
}
