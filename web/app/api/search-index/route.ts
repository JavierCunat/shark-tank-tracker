import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { SHARKS } from "@/lib/sharks";

// The whole search index in one small payload. Cached at the CDN for an hour and
// served stale while it refreshes, so the search box downloads it once per visitor at most.
export const dynamic = "force-dynamic";

export type IndexEntry = { t: "c" | "s"; n: string; s: string; m: string; st?: string };

export async function GET() {
  const rows = await query<{ name: string; slug: string; season: number; episode_in_season: number; current_status: string; description: string | null }>(
    `select name, slug, season, episode_in_season, current_status, description from company_cards order by season, episode_in_season, name`,
  );
  const entries: IndexEntry[] = [
    ...SHARKS.map((s) => ({ t: "s" as const, n: s.name, s: s.slug, m: s.seasons })),
    ...rows.map((r) => ({ t: "c" as const, n: r.name, s: r.slug, m: `S${r.season}E${r.episode_in_season}${r.description ? " · " + r.description : ""}`, st: r.current_status })),
  ];
  return NextResponse.json(entries, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400, max-age=300" },
  });
}
