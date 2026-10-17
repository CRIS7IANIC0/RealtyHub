"use client";

/* ─────────────────────────────────────────────────────────────
   Statement — frase grande sobre fondo oscuro que se "enciende" palabra por
   palabra mientras la sección permanece fija y se hace scroll.
   Sin scroll-motion (o reduced-motion) todas las palabras se ven completas.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

// [palabra, cursiva?]
const WORDS: [string, boolean][] = [
  ["Una", false], ["visita,", false], ["un", false], ["asesor", false], ["y", false], ["una", false], ["firma.", true],
  ["Así", false], ["de", false], ["simple", true], ["es", false], ["encontrar", false], ["el", false], ["lugar", false],
  ["donde", false], ["empieza", false], ["lo", false], ["siguiente.", true],
];

export default function Statement() {
  const section = useRef<HTMLElement>(null);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const sec = section.current;
    if (!sec) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Activa el modo animado (las palabras empiezan atenuadas)
    sec.dataset.live = "1";
    let raf = 0;
    const update = () => {
      const rect = sec.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      const n = WORDS.length;
      const lead = p * (n + 2.5);
      refs.current.forEach((el, i) => {
        if (!el) return;
        const o = Math.min(1, Math.max(0.16, lead - i));
        el.style.opacity = String(o);
        el.style.filter = o < 0.5 ? `blur(${(0.5 - o) * 6}px)` : "none";
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={section}
      aria-label="Nuestra promesa"
      className="relative bg-[#151922] text-[#faf8f4] grain"
      style={{ height: "230vh" }}
    >
      <div className="sticky top-0 h-screen flex items-center">
        <p className="w-full max-w-[1440px] mx-auto px-5 md:px-10 font-display font-light text-[clamp(30px,5.4vw,84px)] leading-[1.08] tracking-[-0.045em]">
          {WORDS.map(([w, it], i) => (
            <span
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="inline-block mr-[0.28em] transition-[filter] duration-300"
            >
              {it ? <span className="accent-i text-[#e7b4a8]">{w}</span> : w}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
