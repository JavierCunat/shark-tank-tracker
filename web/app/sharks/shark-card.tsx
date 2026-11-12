"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";

type Props = {
  slug: string; name: string; seasons: string; art: string | null;
  deals: number; invested: string | null; going: string;
};

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

export function SharkCard({ slug, name, seasons, art, deals, invested, going }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [style, setStyle] = useState<Record<string, string>>({});

  function onMove(e: PointerEvent<HTMLAnchorElement>) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;   // 0..1
    const y = (e.clientY - r.top) / r.height;
    setStyle({
      "--rx": `${(0.5 - y) * 14}deg`,
      "--ry": `${(x - 0.5) * 18}deg`,
      "--mx": `${x * 100}%`,
      "--my": `${y * 100}%`,
      "--lift": "1",
    });
  }
  function onLeave() { setStyle({}); }

  return (
    <Link
      ref={ref} href={`/shark/${slug}`} className="shark3d" style={style as React.CSSProperties}
      onPointerMove={onMove} onPointerLeave={onLeave}
    >
      <div className="shark3d-inner">
        <div className="shark3d-glow" aria-hidden="true" />
        <div className="shark3d-portrait">
          {art ? (
            <pre className="shark3d-ascii" aria-label={`ASCII portrait of ${name}`}>{art}</pre>
          ) : (
            <span className="shark3d-initials" aria-hidden="true">{initials(name)}</span>
          )}
        </div>
        <div className="shark3d-sheen" aria-hidden="true" />
        <div className="shark3d-body">
          <span className="shark3d-name">{name}</span>
          <span className="shark3d-seasons">{seasons}</span>
          <div className="shark3d-stats">
            <div><strong>{deals}</strong><span>deals</span></div>
            <div><strong className="money">{invested ?? "–"}</strong><span>invested</span></div>
            <div><strong>{going}</strong><span>still going</span></div>
          </div>
        </div>
      </div>
    </Link>
  );
}
