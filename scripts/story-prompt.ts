// Shared: the shape of a story and the prompt fragment that asks for one.
export type Story = { pitch: string; deal: string; after: string; now: string; sources: { url: string; name: string }[] };

export const STORY_KEYS = ["pitch", "deal", "after", "now"] as const;

export const STORY_SPEC = `"story": {
    "pitch": string,   // 60-120 words: who the founders were, what they pitched, what they asked for. Plain, specific, no hype.
    "deal":  string,   // 50-100 words: what the sharks offered and said, which offer was taken (or why they walked). Name sharks.
    "after": string,   // 80-150 words: what happened in the months/years after airing — did the deal close, retail wins, pivots, press, problems.
    "now":   string,   // 50-100 words: the current state as of the most recent source you found, with the year. If unknown, say what the last sign of life was.
    "sources": [{ "url": string, "name": string }]   // 2-6 sources that back the story; the most authoritative first
  }`;

export const STORY_RULES = `Story writing rules: write for a reader who googled "what happened to <company> after Shark Tank". Third person, past tense for events, present tense for the current state. Every concrete claim (revenue, acquisition, closure, retail deal) must appear in one of your sources. No marketing adjectives, no "incredible journey". Don't invent net-worth figures. If a section has little information, keep it short rather than padding.`;

export function normalizeStory(raw: any): Story | null {
  if (!raw || typeof raw !== "object") return null;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const s: Story = {
    pitch: str(raw.pitch), deal: str(raw.deal), after: str(raw.after), now: str(raw.now),
    sources: Array.isArray(raw.sources)
      ? raw.sources.filter((x: any) => x && typeof x.url === "string" && /^https?:\/\//.test(x.url)).map((x: any) => ({ url: x.url, name: str(x.name) || new URL(x.url).hostname.replace(/^www\./, "") })).slice(0, 6)
      : [],
  };
  if (!s.pitch || !s.now) return null;
  return s;
}
