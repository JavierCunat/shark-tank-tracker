"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, mountWater } from "./water";

const KEY = "stt.water.theme";

export function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<ReturnType<typeof mountWater> | null>(null);
  const [theme, setTheme] = useState("ocean");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let initial = "ocean";
    try { initial = localStorage.getItem(KEY) || "ocean"; } catch {}
    if (!THEMES[initial]) initial = "ocean";
    setTheme(initial);
    if (canvasRef.current) apiRef.current = mountWater(canvasRef.current, initial);
    return () => apiRef.current?.destroy();
  }, []);

  function choose(k: string) {
    setTheme(k); setOpen(false);
    apiRef.current?.setTheme(k);
    try { localStorage.setItem(KEY, k); } catch {}
  }

  return (
    <>
      <canvas ref={canvasRef} className="water" aria-hidden="true" />
      <div className="water-picker">
        <button type="button" className="water-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)} title="Background">
          <span className="swatch" style={{ background: THEMES[theme].swatch }} />
          {THEMES[theme].label}
        </button>
        {open && (
          <div className="water-pop" role="menu">
            {Object.entries(THEMES).map(([k, t]) => (
              <button type="button" role="menuitem" key={k} className={k === theme ? "on" : ""} onClick={() => choose(k)}>
                <span className="swatch" style={{ background: t.swatch }} />{t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
