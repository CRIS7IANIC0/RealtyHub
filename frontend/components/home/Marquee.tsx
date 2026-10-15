"use client";

/* ─────────────────────────────────────────────────────────────
   Marquee — cinta de texto en bucle infinito con separador dibujado.
   Se pausa al pasar el cursor; con reduced-motion queda quieta.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 opacity-70">
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
    </svg>
  );
}

export default function Marquee({
  items,
  className = "",
  gap = "gap-10",
}: {
  items: string[];
  className?: string;
  gap?: string;
}) {
  const row = (key: string) => (
    <ul key={key} className={`flex items-center ${gap} pr-10 shrink-0`} aria-hidden={key === "b" || undefined}>
      {items.map((t, i) => (
        <li key={i} className={`flex items-center ${gap} whitespace-nowrap`}>
          {t}
          <Star />
        </li>
      ))}
    </ul>
  );
  const track = useRef<HTMLDivElement>(null);

  // La cinta acelera con la velocidad del scroll y vuelve a su ritmo al parar
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let rate = 1;
    const loop = () => {
      const v = Math.abs(window.__lenis?.velocity ?? 0);
      const target = 1 + Math.min(v * 0.6, 10);
      rate += (target - rate) * 0.08;
      const a = track.current?.getAnimations()[0];
      if (a) a.updatePlaybackRate(rate);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`marquee overflow-hidden ${className}`}>
      <div ref={track} className="marquee-track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
