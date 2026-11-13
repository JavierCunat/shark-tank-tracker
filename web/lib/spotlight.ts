/* Hand-picked all-time successes for the home hero, roughly by scale. Edit freely.
 * Put an image at public/hero/<slug>.(jpg|png|webp) and it replaces the generated tile.
 * `slug` should match the company's slug once its season is seeded, so the tile can link to it later. */
export type Spotlight = { slug: string; name: string; season: number; blurb: string };

export const SPOTLIGHT: Spotlight[] = [
  { slug: "bombas", name: "Bombas", season: 6, blurb: "Daymond John · $2B+ lifetime sales" },
  { slug: "scrub-daddy", name: "Scrub Daddy", season: 4, blurb: "Lori Greiner · $1.4B+ lifetime sales" },
  { slug: "everlywell", name: "Everlywell", season: 9, blurb: "Lori Greiner · $1.4B+ in sales" },
  { slug: "cousins-maine-lobster", name: "Cousins Maine Lobster", season: 4, blurb: "Barbara Corcoran · $1B+ systemwide" },
  { slug: "ring", name: "Ring", season: 5, blurb: "No deal · sold to Amazon for ~$1B" },
  { slug: "manscaped", name: "Manscaped", season: 10, blurb: "Deal fell through · ~$300M a year" },
  { slug: "dude-wipes", name: "Dude Wipes", season: 9, blurb: "Mark Cuban · $300M+ a year" },
  { slug: "kodiak-cakes", name: "Kodiak Cakes", season: 5, blurb: "No deal · $200M+ a year" },
  { slug: "the-comfy", name: "The Comfy", season: 9, blurb: "Barbara Corcoran · $550M+ in sales" },
  { slug: "squatty-potty", name: "Squatty Potty", season: 6, blurb: "Lori Greiner · $260M+ lifetime, acquired" },
  { slug: "simply-fit-board", name: "Simply Fit Board", season: 7, blurb: "Lori Greiner · $160M+ retail sales" },
  { slug: "tipsy-elves", name: "Tipsy Elves", season: 5, blurb: "Robert Herjavec · $125M+ lifetime" },
];
