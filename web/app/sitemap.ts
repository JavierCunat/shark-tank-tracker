import type { MetadataRoute } from "next";
import { getAllSlugs, getSeasons } from "@/lib/companies";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [slugs, seasons] = await Promise.all([getAllSlugs(), getSeasons()]);
  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    ...seasons.map((s) => ({ url: `${site}/season/${s.season}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...slugs.map((r) => ({
      url: `${site}/company/${r.slug}`,
      lastModified: new Date(r.latest_update_date ?? r.air_date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
