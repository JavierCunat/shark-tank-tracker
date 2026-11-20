import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompaniesByStatus, STATUS_LABEL, type CompanyStatus } from "@/lib/companies";
import { CompanyGrid } from "@/app/company-grid";

export const dynamic = "force-dynamic";

const PAGES: Record<CompanyStatus, { title: string; h1: string; intro: string }> = {
  active: { title: "Shark Tank Companies That Are Still in Business", h1: "Shark Tank companies still in business", intro: "Every company we've verified is still operating today, most recently confirmed first." },
  acquired: { title: "Shark Tank Companies That Were Acquired", h1: "Shark Tank companies that got acquired", intro: "Companies that were bought after appearing on the show, with who bought them and for how much where it's public." },
  closed: { title: "Shark Tank Companies That Went Out of Business", h1: "Shark Tank companies that closed", intro: "Companies that have shut down since the show, with the last sign of life we could source." },
  deal_closed: { title: "Shark Tank Deals That Actually Closed", h1: "Deals that closed after the show", intro: "On-air handshakes that survived due diligence and became real investments." },
  deal_fell_through: { title: "Shark Tank Deals That Fell Through", h1: "Deals that fell through", intro: "On-air deals that never closed. It happens to roughly half of them." },
  unknown: { title: "Shark Tank Companies We Haven't Verified Yet", h1: "Not yet verified", intro: "Companies with no sourced update yet. Know something? Send it in." },
};

type Props = { params: Promise<{ status: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { status } = await params;
  const page = PAGES[status as CompanyStatus];
  if (!page) return {};
  return { title: page.title, description: page.intro, alternates: { canonical: `/status/${status}` }, robots: status === "unknown" ? { index: false } : undefined };
}

export default async function StatusPage({ params }: Props) {
  const { status } = await params;
  const page = PAGES[status as CompanyStatus];
  if (!page) notFound();
  const companies = await getCompaniesByStatus(status as CompanyStatus);
  return (
    <>
      <p className="muted">{STATUS_LABEL[status as CompanyStatus]}</p>
      <h1>{page.h1}</h1>
      <p className="lede">{page.intro}</p>
      {companies.length ? <CompanyGrid companies={companies} /> : <p className="muted">None yet.</p>}
    </>
  );
}
