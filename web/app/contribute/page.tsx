import type { Metadata } from "next";
import { getCompanyOptions } from "@/lib/companies";
import { ContributeForm } from "./form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contribute an update",
  description: "Know what happened to a Shark Tank company? Send us the update and a source.",
  alternates: { canonical: "/contribute" },
};

export default async function ContributePage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const { company } = await searchParams;
  const companies = await getCompanyOptions();
  return (
    <>
      <h1>Know what happened to one of these companies?</h1>
      <p className="lede">
        Every update on this site is reviewed by a person and linked to a source. Send us what you know and where you
        saw it, and we&apos;ll add it to the company&apos;s timeline.
      </p>
      <ContributeForm companies={companies} initialSlug={company} />
    </>
  );
}
