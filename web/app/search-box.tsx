"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IndexEntry } from "@/app/api/search-index/route";

let indexPromise: Promise<IndexEntry[]> | null = null;   // shared across every search box on the page
function loadIndex() {
  if (!indexPromise) indexPromise = fetch("/api/search-index").then((r) => r.json()).catch(() => { indexPromise = null; return []; });
  return indexPromise;
}

const STATUS: Record<string, string> = { active: "Still in business", acquired: "Acquired", closed: "Out of business", deal_closed: "Deal closed", deal_fell_through: "Deal fell through", unknown: "" };

// Rank: whole-name prefix > word prefix > substring in name > substring in description. Lower is better.
function score(e: IndexEntry, q: string): number {
  const n = e.n.toLowerCase();
  if (n.startsWith(q)) return 0;
  if (n.split(/\s+/).some((w) => w.startsWith(q))) return 1;
  if (n.includes(q)) return 2;
  if (e.m.toLowerCase().includes(q)) return 3;
  return Infinity;
}

export function SearchBox({ initial = "", autoFocus = false, compact = false }: { initial?: string; autoFocus?: boolean; compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLFormElement>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!index || needle.length < 1) return [];
    return index
      .map((e) => ({ e, s: score(e, needle) }))
      .filter((x) => x.s !== Infinity)
      .sort((a, b) => a.s - b.s || (a.e.t === "s" ? -1 : 1) - (b.e.t === "s" ? -1 : 1) || a.e.n.localeCompare(b.e.n))
      .slice(0, 8)
      .map((x) => x.e);
  }, [index, q]);

  useEffect(() => { setActive(-1); }, [q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc); return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const warm = () => { if (!index) loadIndex().then(setIndex); };
  const go = (e: IndexEntry) => { setOpen(false); router.push(e.t === "s" ? `/shark/${e.s}` : `/company/${e.s}`); };

  function onKey(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (ev.key === "ArrowDown") { ev.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (ev.key === "Enter" && active >= 0) { ev.preventDefault(); go(results[active]); }
    else if (ev.key === "Escape") setOpen(false);
  }

  const showList = open && q.trim().length > 0;
  return (
    <form ref={wrap} action="/search" role="search" className={`search ${compact ? "compact" : ""} ${showList ? "open" : ""}`} autoComplete="off">
      <div className="search-field">
        <input
          type="search" name="q" value={q} autoFocus={autoFocus}
          placeholder="Search a company, product, or shark…" aria-label="Search companies"
          aria-autocomplete="list" aria-expanded={showList} aria-controls="search-suggest"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { warm(); setOpen(true); }} onMouseEnter={warm} onKeyDown={onKey}
          minLength={2}
        />
        {showList && (
          <ul id="search-suggest" className="suggest" role="listbox">
            {results.length === 0 && <li className="suggest-empty">{index ? "No matches" : "Loading…"}</li>}
            {results.map((e, i) => (
              <li key={`${e.t}-${e.s}`} role="option" aria-selected={i === active}
                  className={`suggest-item ${i === active ? "active" : ""}`}
                  onMouseEnter={() => setActive(i)} onMouseDown={(ev) => { ev.preventDefault(); go(e); }}>
                <span className="suggest-kind">{e.t === "s" ? "Shark" : "Company"}</span>
                <span className="suggest-main">
                  <span className="suggest-name">{e.n}</span>
                  <span className="suggest-meta">{e.m}</span>
                </span>
                {e.st && STATUS[e.st] && <span className={`badge ${e.st}`}>{STATUS[e.st]}</span>}
              </li>
            ))}
            {results.length > 0 && (
              <li className="suggest-all"><button type="submit">See all results for “{q}”</button></li>
            )}
          </ul>
        )}
      </div>
      <button type="submit">Search</button>
    </form>
  );
}
