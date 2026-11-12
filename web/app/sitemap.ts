import type { MetadataRoute } from "next";
import { getAllSlugs, getSeasons } from "@/lib/companies";
import { SHARKS } from "@/lib/sharks";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [slugs, seasons] = await Promise.all([getAllSlugs(), getSeasons()]);
  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/sharks`, changeFrequency: "weekly", priority: 0.8 },
    ...SHARKS.map((s) => ({ url: `${site}/shark/${s.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...seasons.map((s) => ({ url: `${site}/season/${s.season}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...slugs.map((r) => ({
      url: `${site}/company/${r.slug}`,
      lastModified: new Date(r.latest_update_date ?? r.air_date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
