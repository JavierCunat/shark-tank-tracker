import type { Metadata } from "next";
import Link from "next/link";
import { searchCompanies } from "@/lib/companies";
import { searchSharks } from "@/lib/sharks";
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
  const sharks = searchSharks(q);
  return (
    <>
      <h1>Search</h1>
      <SearchBox initial={q} autoFocus />
      {sharks.length > 0 && (
        <>
          <h2>Sharks</h2>
          <div className="grid">
            {sharks.map((s) => (
              <Link href={`/shark/${s.slug}`} className="card" key={s.slug}>
                <span className="name">{s.name}</span>
                <span className="meta">{s.seasons}</span>
                <span className="meta">{s.bio}</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {q.trim().length >= 2 && (
        <p className="muted" style={{ marginTop: 14 }}>
          {results.length === 0
            ? (sharks.length ? "No companies match." : `Nothing matching "${q}".`)
            : `${results.length} compan${results.length === 1 ? "y" : "ies"} for "${q}"`}
        </p>
      )}
      {results.length > 0 && <div style={{ marginTop: 18 }}><CompanyGrid companies={results} /></div>}
    </>
  );
}
