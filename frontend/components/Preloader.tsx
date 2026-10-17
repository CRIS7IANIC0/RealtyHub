"use client";

/* ─────────────────────────────────────────────────────────────
   Preloader — entrada de marca, una vez por sesión del navegador.
   1. Una casa se dibuja a trazo (techo, muros, puerta, ventanas).
   2. El nombre RealtyHub arranca como contorno y se llena de izquierda a
      derecha con el contador de carga.
   3. Al 100 % la pantalla se parte en dos mitades que se abren hacia
      arriba y abajo, revelando la página.
   Contenido visible por defecto: si el script falla, una animación CSS
   retira la cortina sola. Con prefers-reduced-motion hace solo un fundido.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";

const SEEN_KEY = "rh_preloader_seen";

// Antes de pintar: si ya se vio en esta sesión, ni se muestra.
const EARLY = `try{if(sessionStorage.getItem("${SEEN_KEY}"))document.documentElement.classList.add("rh-seen")}catch(e){}`;

function Scene({ progress, hidden }: { progress: number; hidden?: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-[clamp(20px,4vw,52px)] text-[#faf8f4]"
      aria-hidden={hidden || undefined}
    >
      <div className="flex items-center justify-between text-[12px] tracking-[0.14em] uppercase text-[#faf8f4]/55 rh-fade">
        <span>Inmobiliaria</span>
        <span>Colombia</span>
      </div>

      <div className="flex flex-col items-center">
        {/* Casa dibujada a trazo */}
        <svg
          viewBox="0 0 120 100"
          className="w-[clamp(84px,11vw,150px)] mb-[clamp(18px,3vw,40px)] overflow-visible"
          fill="none"
          stroke="#d98a7e"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="rh-draw" style={{ ["--d" as string]: "0ms" }} pathLength={1} d="M8 52 60 10l52 42" />
          <path className="rh-draw" style={{ ["--d" as string]: "260ms" }} pathLength={1} d="M22 44v48h76V44" />
          <path className="rh-draw" style={{ ["--d" as string]: "560ms" }} pathLength={1} d="M50 92V64h20v28" />
          <path className="rh-draw" style={{ ["--d" as string]: "760ms" }} pathLength={1} d="M30 58h12v12H30zM78 58h12v12H78z" />
          <path className="rh-draw" style={{ ["--d" as string]: "900ms" }} pathLength={1} d="M4 92h112" />
        </svg>

        {/* Nombre: contorno + relleno que avanza con el progreso */}
        <div className="relative font-display font-extralight leading-none tracking-[-0.045em] text-[clamp(44px,15vw,260px)] select-none whitespace-nowrap">
          <span className="block rh-outline">
            Realty<span>Hub</span>
          </span>
          <span
            className="absolute inset-0 block"
            style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
          >
            Realty<span className="text-[#d98a7e]">Hub</span>
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-[13px] text-[#faf8f4]/55 rh-fade">Preparando tu búsqueda</span>
        <span className="font-display font-extralight leading-none tabular text-[clamp(44px,9vw,140px)] tracking-[-0.04em]">
          {String(progress).padStart(2, "0")}
          <span className="text-[#faf8f4]/35 text-[0.35em] align-top ml-1">%</span>
        </span>
      </div>
    </div>
  );
}

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Ya vista en esta sesión: el CSS la oculta antes de pintar (ver EARLY)
    if (document.documentElement.classList.contains("rh-seen")) return;

    // Vista previa fija para revisar el diseño: /?rhfreeze=62
    const freeze = new URLSearchParams(window.location.search).get("rhfreeze");
    if (freeze) {
      const t = window.setTimeout(() => setProgress(Math.min(100, Number(freeze) || 0)), 0);
      return () => window.clearTimeout(t);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seenTimer = window.setTimeout(
      () => document.documentElement.classList.add("rh-seen"),
      6500
    );
    const total = reduced ? 600 : 2900;
    const start = performance.now();
    let raf = 0;
    let leaveTimer = 0;

    // Avance con pausas: arranca rápido, se detiene un poco a la mitad y cierra suave
    const ease = (t: number) =>
      t < 0.5 ? 0.5 * Math.pow(t * 2, 0.8) : 0.5 + 0.5 * (1 - Math.pow(1 - (t - 0.5) * 2, 3));

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      setProgress(Math.round(ease(t) * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        leaveTimer = window.setTimeout(
          () => {
            setLeaving(true);
            try {
              sessionStorage.setItem(SEEN_KEY, "1");
            } catch {}
            window.setTimeout(() => setGone(true), reduced ? 300 : 1100);
          },
          reduced ? 0 : 380
        );
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(seenTimer);
    };
  }, []);

  // Bloquea el scroll mientras la cortina está arriba
  useEffect(() => {
    if (gone || document.documentElement.classList.contains("rh-seen")) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gone]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      <style>{`
        .rh-seen #rh-preloader{display:none}
        #rh-preloader{position:fixed;inset:0;z-index:9999;pointer-events:auto;
          animation:rh-failsafe .01s linear 8s forwards}
        @keyframes rh-failsafe{to{visibility:hidden;pointer-events:none}}
        .rh-half{position:absolute;inset:0;background:var(--rh-night);
          transition:transform 1s cubic-bezier(.76,0,.24,1)}
        .rh-half.top{clip-path:inset(0 0 50% 0)}
        .rh-half.bot{clip-path:inset(50% 0 0 0)}
        #rh-preloader[data-leaving="true"] .rh-half.top{transform:translateY(-100%)}
        #rh-preloader[data-leaving="true"] .rh-half.bot{transform:translateY(100%)}
        .rh-draw{stroke-dasharray:1;stroke-dashoffset:1;
          animation:rh-stroke 1.1s cubic-bezier(.65,0,.35,1) forwards;animation-delay:calc(var(--d) + 200ms)}
        @keyframes rh-stroke{to{stroke-dashoffset:0}}
        .rh-outline{color:transparent;-webkit-text-stroke:1px rgba(250,248,244,.32)}
        .rh-outline span{color:transparent}
        .rh-fade{opacity:0;animation:rh-in .9s var(--ease-out) .6s forwards}
        @keyframes rh-in{to{opacity:1}}
        @media (prefers-reduced-motion: reduce){
          .rh-draw{stroke-dashoffset:0;animation:none}
          .rh-fade{opacity:1;animation:none}
          .rh-half{transition:opacity .3s linear}
          .rh-half.top,.rh-half.bot{clip-path:none}
          #rh-preloader[data-leaving="true"] .rh-half{transform:none;opacity:0}
        }
      `}</style>
      {!gone && (
        <div
          id="rh-preloader"
          role="status"
          aria-live="polite"
          aria-label="Cargando RealtyHub"
          data-leaving={leaving}
        >
          <div className="rh-half top">
            <Scene progress={progress} />
          </div>
          <div className="rh-half bot">
            <Scene progress={progress} hidden />
          </div>
        </div>
      )}
    </>
  );
}
