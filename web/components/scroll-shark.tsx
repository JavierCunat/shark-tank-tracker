"use client";

import { useEffect, useRef } from "react";

/* A shark that swims across the page as you scroll.
 * Progress 0..1 (top..bottom of the document) drives its x position; it faces the way it's
 * moving and descends slightly as you go down. The tail and body sway continuously via CSS.
 * Drop a Lottie JSON at public/shark.json and pass `lottie` to swap in a richer animation later. */
export function ScrollShark({ depth = 0.5 }: { depth?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, target = 0, current = 0, lastX = 0, dir = 1;

    const progress = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    };
    const place = (p: number) => {
      const w = innerWidth, h = innerHeight;
      // sweep across the viewport 1.4 times over the page, with a gentle sine bob
      const sweep = (p * 1.4) % 1;
      const leg = Math.floor(p * 1.4) % 2;               // alternate direction each sweep
      const t = leg === 0 ? sweep : 1 - sweep;
      const x = -0.2 * w + t * 1.4 * w;
      const y = h * (0.25 + depth * 0.5 * p) + Math.sin(p * Math.PI * 6) * 24;
      if (Math.abs(x - lastX) > 0.5) dir = x > lastX ? 1 : -1;
      lastX = x;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${dir})`;
    };
    const tick = () => {
      current += (target - current) * 0.08;             // ease toward the scroll position
      place(current);
      if (Math.abs(target - current) > 0.0005) raf = requestAnimationFrame(tick); else raf = 0;
    };
    const onScroll = () => { target = progress(); if (!raf) raf = requestAnimationFrame(tick); };

    target = current = progress(); place(current);
    if (reduced) { return; }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [depth]);

  return (
    <div className="shark-layer" aria-hidden="true">
      <div ref={ref} className="shark">
        <svg viewBox="0 0 420 180" width="420" height="180">
          <defs>
            {/* countershading: steel back -> pale belly */}
            <linearGradient id="sk-skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f4256" /><stop offset="0.42" stopColor="#56718a" />
              <stop offset="0.62" stopColor="#8aa3b5" /><stop offset="0.8" stopColor="#d6e3ec" /><stop offset="1" stopColor="#eef5f9" />
            </linearGradient>
            <linearGradient id="sk-fin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f4256" /><stop offset="1" stopColor="#56718a" />
            </linearGradient>
            {/* a band of light drifting along the body */}
            <linearGradient id="sk-light" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.28" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="sk-clip">
              <path d="M408 92 C 384 76, 342 62, 292 58 C 262 56, 236 57, 212 60 C 170 64, 128 72, 98 82 C 88 85, 80 88, 74 90 C 80 94, 88 97, 98 100 C 140 112, 200 122, 256 122 C 310 122, 362 110, 408 92 Z" />
            </clipPath>
          </defs>

          {/* tail: upper lobe long, lower lobe short */}
          <g className="shark-tail">
            <path d="M76 86 C 62 70, 42 42, 18 12 C 24 42, 32 66, 42 88 C 34 104, 28 120, 30 142 C 42 126, 56 110, 76 96 Z" fill="url(#sk-fin)" />
            <path d="M42 88 C 50 90, 60 92, 76 92" stroke="#1f2f3f" strokeWidth="1.2" opacity="0.5" fill="none" />
          </g>

          {/* rear third: second dorsal, anal fin, tail stem */}
          <g className="shark-rear">
            <path d="M74 90 C 80 86, 88 84, 98 82 C 128 72, 170 64, 212 60 L 212 122 C 200 122, 140 112, 98 100 C 88 97, 80 94, 74 90 Z" fill="url(#sk-skin)" />
            <path d="M132 70 C 128 60, 120 56, 112 60 L 104 72 Z" fill="url(#sk-fin)" />
            <path d="M138 110 C 134 120, 126 124, 118 122 L 112 108 Z" fill="#56718a" />
          </g>

          {/* front two thirds */}
          <g className="shark-body">
            <path d="M408 92 C 384 76, 342 62, 292 58 C 262 56, 236 57, 212 60 L 212 122 C 256 122, 310 122, 362 110 C 384 104, 398 98, 408 92 Z" fill="url(#sk-skin)" />
            {/* dorsal fin: swept back */}
            <path d="M248 60 C 232 40, 212 18, 196 8 C 196 30, 192 48, 186 62 Z" fill="url(#sk-fin)" />
            {/* pelvic fin */}
            <path d="M206 118 C 200 128, 190 134, 180 134 L 176 120 Z" fill="#56718a" />
            {/* pectoral fin */}
            <path className="shark-fin" d="M318 112 C 296 132, 272 150, 246 160 C 270 152, 296 138, 326 118 Z" fill="url(#sk-fin)" />
            {/* mouth */}
            <path d="M392 100 C 378 108, 360 112, 344 112" stroke="#1f2f3f" strokeWidth="1.6" fill="none" opacity="0.7" strokeLinecap="round" />
            {/* gill slits */}
            <g stroke="#1f2f3f" strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round">
              <path d="M304 74 q 5 14 0 30" /><path d="M312 72 q 5 16 0 34" /><path d="M320 71 q 5 17 0 36" /><path d="M328 71 q 5 17 0 36" /><path d="M336 72 q 5 16 0 34" />
            </g>
            {/* eye */}
            <circle cx="368" cy="80" r="4.2" fill="#0b1620" /><circle cx="369.4" cy="78.6" r="1.3" fill="#eef6fa" />
            {/* nostril */}
            <path d="M390 88 q 3 1 4 3" stroke="#1f2f3f" strokeWidth="1.2" fill="none" opacity="0.6" />
          </g>

          {/* drifting light, clipped to the body */}
          <g clipPath="url(#sk-clip)"><rect className="shark-light" x="-200" y="40" width="200" height="100" fill="url(#sk-light)" /></g>
        </svg>
      </div>
    </div>
  );
}
