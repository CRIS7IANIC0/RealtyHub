"use client";

/* ─────────────────────────────────────────────────────────────
   SplitText — titular que entra palabra por palabra desde una máscara
   al llegar a pantalla (stagger). Visible por defecto: solo se oculta si
   el script marcó `reveal-ready` en <html> (ver useReveal).
   ───────────────────────────────────────────────────────────── */

import { Fragment, useEffect, useRef, type CSSProperties, type ElementType } from "react";

export interface Part {
  t: string;
  /** Resalta la palabra con el color de acento del bloque. */
  accent?: boolean;
}

interface Props {
  parts: Part[] | string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  accentClassName?: string;
  id?: string;
  /** Retardo base en ms. */
  delay?: number;
}

export default function SplitText({
  parts,
  as = "h2",
  className = "",
  accentClassName = "text-[#a64739]",
  id,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const list: Part[] = typeof parts === "string" ? [{ t: parts }] : parts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = list.flatMap((p) =>
    p.t.split(" ").filter(Boolean).map((w) => ({ w, accent: p.accent }))
  );

  const Tag = as as ElementType;
  return (
    <Tag ref={ref} id={id} className={`split ${className}`}>
      {words.map(({ w, accent }, idx) => {
        const style = { ["--i" as string]: idx, ["--sd" as string]: `${delay}ms` } as CSSProperties;
        return (
          <Fragment key={idx}>
            <span className="split-w" style={style}>
              <span className={accent ? accentClassName : undefined}>{w}</span>
            </span>{" "}
          </Fragment>
        );
      })}
    </Tag>
  );
}
