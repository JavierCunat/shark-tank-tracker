import type { Metadata } from "next";
import { searchCompanies } from "@/lib/companies";
import { CompanyGrid } from "@/app/company-grid";
import { SearchBox } from "@/app/search-box";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Shark Tank companies",
  robots: { index: false },   // search result pages shouldn't compete with company pages in Google
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = q.trim().length >= 2 ? await searchCompanies(q) : [];
  return (
    <>
      <h1>Search</h1>
      <SearchBox initial={q} autoFocus />
      {q.trim().length >= 2 && (
        <p className="muted" style={{ marginTop: 14 }}>
          {results.length === 0 ? `Nothing matching "${q}".` : `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`}
        </p>
      )}
      {results.length > 0 && <div style={{ marginTop: 18 }}><CompanyGrid companies={results} /></div>}
    </>
  );
}
