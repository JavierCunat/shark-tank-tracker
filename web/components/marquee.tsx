"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/* Infinite horizontal scroller you can also swipe or drag.
 * Children are rendered twice; the track scrolls via scrollLeft and wraps at the halfway point,
 * so the auto-scroll and the user's swipe share one scroll position and never fight. */
export function Marquee({ children, duration = 40, gap = 24, pauseOnHover = true, className = "" }:
  { children: ReactNode; duration?: number; gap?: number; pauseOnHover?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now(), paused = false, resumeAt = 0, dragging = false, startX = 0, startLeft = 0;
    // Keep our own fractional position: Safari rounds scrollLeft to whole pixels, so sub-pixel
    // nudges would otherwise round away to nothing and the row would never move.
    let pos = 0, expected = -1;
    const setLeft = (v: number) => { pos = v; const r = Math.round(v); if (r !== el.scrollLeft) el.scrollLeft = r; expected = el.scrollLeft; };

    // Three copies of the content. We live in the middle one and jump by one copy's width
    // whenever we drift into the first or last, so there's always room to scroll either way.
    const unit = () => el.scrollWidth / 3;
    const wrap = () => {
      const u = unit();
      if (el.scrollLeft < u * 0.5) setLeft(el.scrollLeft + u);
      else if (el.scrollLeft > u * 1.5) setLeft(el.scrollLeft - u);
    };
    setLeft(unit());
    const speed = () => unit() / duration;   // px per second so one full loop takes `duration`

    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      if (!reduced && !paused && !dragging && now > resumeAt) setLeft(pos + speed() * Math.min(dt, 0.1));
      wrap();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const idle = () => { resumeAt = performance.now() + 2500; };   // resume 2.5s after the user lets go
    const onEnter = () => { if (pauseOnHover) paused = true; };
    const onLeave = () => { paused = false; dragging = false; el.classList.remove("dragging"); };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;   // native touch scrolling handles swipes
      dragging = true; startX = e.clientX; startLeft = el.scrollLeft; el.classList.add("dragging"); el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      setLeft(startLeft - (e.clientX - startX)); wrap();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false; el.classList.remove("dragging"); idle();
      // swallow the click if it was really a drag
      if (Math.abs(e.clientX - startX) > 6) { const stop = (ev: Event) => { ev.preventDefault(); ev.stopPropagation(); el.removeEventListener("click", stop, true); }; el.addEventListener("click", stop, true); }
    };
    const onScroll = () => {   // a scroll we didn't cause = the user swiped; adopt it, pause briefly, then resume
      if (dragging) return;
      if (Math.abs(el.scrollLeft - expected) < 1) return;
      pos = el.scrollLeft; expected = el.scrollLeft;
      idle();
    };
    const onDragStart = (e: Event) => e.preventDefault();   // links/images would otherwise start a native drag and cancel ours

    el.addEventListener("pointerenter", onEnter); el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown); el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onUp);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("dragstart", onDragStart);
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter); el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("scroll", onScroll);
    };
  }, [duration, pauseOnHover]);

  const style = { "--gap": `${gap}px` } as CSSProperties;
  return (
    <div ref={ref} className={`marquee ${className}`} style={style}>
      <div className="marquee-track" aria-hidden="true">{children}</div>
      <div className="marquee-track">{children}</div>
      <div className="marquee-track" aria-hidden="true">{children}</div>
    </div>
  );
}
