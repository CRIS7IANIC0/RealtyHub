"use client";

/* ─────────────────────────────────────────────────────────────
   HowItWorks — el recorrido real del visitante en 3 pasos, como tarjetas
   que se apilan al hacer scroll (cada una se queda fija y la siguiente la
   cubre). Cada paso trae una foto de propiedad si hay disponibles.
   Escritorio: título fijo a la izquierda. Móvil: tarjetas en columna.
   ───────────────────────────────────────────────────────────── */

import SplitText from "@/components/ui/SplitText";

const STEPS = [
  {
    title: "Explora y compara",
    text: "Filtra por ciudad, tipo de propiedad y si quieres comprar o alquilar. Cada inmueble muestra sus fotos, el precio y su ubicación.",
    tone: "bg-[#ece6dc] text-[#1e1c1a]",
  },
  {
    title: "Agenda tu visita",
    text: "Elige el día y la hora. No necesitas crear una cuenta: dejas tus datos, aceptas la política de tratamiento y tu solicitud entra a la agenda.",
    tone: "bg-[#dfe3ec] text-[#1e1c1a]",
  },
  {
    title: "Un asesor te acompaña",
    text: "Un agente de RealtyHub toma tu visita y te acompaña hasta la firma del contrato, con el documento listo en PDF.",
    tone: "bg-[#2c3445] text-[#faf8f4]",
  },
];

export default function HowItWorks({ images = [] }: { images?: string[] }) {
  return (
    <section id="como-funciona" aria-labelledby="como-title" className="scroll-mt-28">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SplitText
              as="h2"
              id="como-title"
              parts={[{ t: "Del primer vistazo a la" }, { t: "firma,", accent: true }, { t: "sin vueltas." }]}
              className="font-display text-[clamp(32px,4vw,58px)] leading-[1.04] tracking-[-0.045em]"
            />
            <p className="reveal mt-6 text-[16px] text-[#6b655e] max-w-[34ch]">
              Tres pasos y un asesor de tu lado en todo el camino.
            </p>
          </div>
        </div>

        <ol className="lg:col-span-8">
          {STEPS.map((s, i) => {
            const img = images.length ? images[i % images.length] : undefined;
            return (
              <li
                key={s.title}
                className="sticky mb-6 lg:mb-10"
                style={{ top: `calc(104px + ${i * 22}px)` }}
              >
                <article
                  className={`grid md:grid-cols-[1.1fr_0.9fr] min-h-[340px] md:min-h-[400px] rounded-md overflow-hidden shadow-[0_24px_60px_-30px_rgba(30,28,26,0.35)] ${s.tone}`}
                >
                  <div className="flex flex-col justify-between p-7 md:p-10">
                    <span className="font-display font-extralight text-[clamp(56px,7vw,104px)] leading-none tracking-[-0.06em] opacity-35 tabular">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="font-display font-light text-[clamp(24px,2.6vw,38px)] leading-[1.08] tracking-[-0.04em]">
                        {s.title}
                      </h3>
                      <p className="mt-4 text-[16px] leading-relaxed opacity-75 max-w-[38ch]">{s.text}</p>
                    </div>
                  </div>
                  <div
                    className="relative min-h-[200px] md:min-h-0 bg-cover bg-center"
                    style={img ? { backgroundImage: `url(${img})` } : undefined}
                    aria-hidden="true"
                  >
                    {!img && <div className="absolute inset-0 hero-mesh opacity-70" />}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
