import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About and how we verify",
  description: "How Shark Tank Tracker finds and verifies what happened to every company after the show.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <h1>How this site works</h1>
      <p className="lede">Every status on this site comes from a dated, sourced update that a person has checked. Nothing is published on a guess.</p>

      <h2>Where the data comes from</h2>
      <p className="profile-para">Episode and deal information (who pitched, when it aired, what the sharks offered on air) is seeded from each season&apos;s public episode listings. On-air terms are the handshake numbers; many deals change or fall through in due diligence afterward, which is exactly what the timeline on each company page tracks.</p>

      <h2>How updates are found</h2>
      <p className="profile-para">An automated research pass searches the web for news about each company: the company&apos;s own site and social accounts, news coverage, the show&apos;s own update segments. It proposes a status, a short summary and a source link. A person reviews every proposal and approves, edits or rejects it. Visitors can <Link href="/contribute">submit updates</Link> too; those go through the same review.</p>

      <h2>What the statuses mean</h2>
      <p className="profile-para"><strong>Still in business</strong> means we found recent evidence the company is operating. <strong>Acquired</strong> means it was bought. <strong>Out of business</strong> means we found evidence it stopped, such as a closed website or a founder saying so. <strong>Deal closed</strong> and <strong>Deal fell through</strong> describe what happened to the on-air handshake. <strong>Not yet verified</strong> means we don&apos;t have a sourced update yet, and we say so rather than guess.</p>

      <h2>Corrections</h2>
      <p className="profile-para">If something is wrong, <Link href="/contribute">send a correction with a source</Link> and it will be reviewed. Every company page shows when it was last verified.</p>

      <p className="muted">Unofficial fan project. Not affiliated with ABC, Sony Pictures Television, or Shark Tank.</p>
    </>
  );
}
