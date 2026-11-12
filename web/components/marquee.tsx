import type { CSSProperties, ReactNode } from "react";

/* Infinite horizontal scroller. Children are rendered twice so the loop is seamless. */
export function Marquee({ children, duration = 40, gap = 24, pauseOnHover = true, className = "" }:
  { children: ReactNode; duration?: number; gap?: number; pauseOnHover?: boolean; className?: string }) {
  const style = { "--duration": `${duration}s`, "--gap": `${gap}px` } as CSSProperties;
  return (
    <div className={`marquee ${pauseOnHover ? "pause" : ""} ${className}`} style={style}>
      <div className="marquee-track">{children}</div>
      <div className="marquee-track" aria-hidden="true">{children}</div>
    </div>
  );
}
