import { readdirSync } from "node:fs";
import path from "node:path";
import type { StreamImage } from "@/components/image-stream-hero";
import { SPOTLIGHT } from "./spotlight";

/* Images for the home hero.
 * 1. Any files in public/hero/ (jpg/png/webp), sorted by name. Drop product photos there.
 * 2. Otherwise, generated typographic tiles for the featured companies (or the first few deals),
 *    so the hero is never empty. */

const PALETTE = [
  ["#365c77", "#0b1620"], ["#3badca", "#0f1d2a"], ["#6ae0ff", "#142634"], ["#b39586", "#0b1620"], ["#738288", "#0f1d2a"],
];

function tile(name: string, sub: string, i: number): string {
  const [a, b] = PALETTE[i % PALETTE.length];
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const words = name.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > 14 && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur);
  const fs = lines.some((l) => l.length > 11) ? 30 : 36;
  const text = lines.slice(0, 3).map((l, k) => `<text x="36" y="${200 + k * (fs + 6)}" font-size="${fs}" font-weight="700" fill="#eef6fa">${esc(l)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="500" viewBox="0 0 360 500">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="360" height="500" rx="18" fill="url(#g)"/>
<circle cx="300" cy="80" r="140" fill="${a}" opacity="0.25"/>
<g font-family="-apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif">
<text x="36" y="60" font-size="13" font-weight="600" letter-spacing="3" fill="#6ae0ff">SHARK TANK</text>
${text}
<text x="36" y="450" font-size="15" fill="#c3d2da">${esc(sub)}</text>
</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function getHeroImages(): Promise<StreamImage[]> {
  // Per-company image if one exists in public/hero/, otherwise a generated tile.
  let files = new Set<string>();
  try { files = new Set(readdirSync(path.join(process.cwd(), "public", "hero"))); } catch { /* no folder yet */ }
  const find = (slug: string) => ["jpg", "jpeg", "png", "webp"].map((e) => `${slug}.${e}`).find((f) => files.has(f));
  return SPOTLIGHT.map((c, i) => {
    const f = find(c.slug);
    return f ? { src: `/hero/${f}`, alt: c.name } : { src: tile(c.name, c.blurb, i), alt: c.name };
  });
}
