/* ─────────────────────────────────────────────────────────────
   TestimonialsSection — voces de clientes, a la manera editorial:
   cita grande en display, filete fino arriba y firma abajo.
   NOTA: los testimonios son de ejemplo (heredados del proyecto); reemplazar
   por reales antes de publicar.
   ───────────────────────────────────────────────────────────── */

interface Testimonial {
  name: string;
  role: string;
  comment: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Laura Martínez",
    role: "Compradora en Montería",
    comment:
      "Encontré mi apartamento en menos de un mes. El agente me acompañó en cada visita y el proceso de escrituración fue claro y sin sorpresas.",
  },
  {
    name: "Andrés Gómez",
    role: "Inquilino en Medellín",
    comment:
      "Agendar la visita fue facilitísimo y la propiedad era tal cual las fotos. Firmé mi contrato de arriendo en pocos días.",
  },
  {
    name: "Camila Rodríguez",
    role: "Compradora en Bogotá",
    comment:
      "Me encantó la transparencia: precios reales, información verificada y respuestas rápidas. Recomiendo RealtyHub sin dudarlo.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();
}

export default function TestimonialsSection() {
  return (
    <section id="testimonios" aria-labelledby="testimonios-title">
      <h2
        id="testimonios-title"
        className="reveal font-display text-[clamp(32px,5vw,56px)] font-light leading-[1.05] tracking-[-0.03em] max-w-[18ch]"
      >
        Familias felices, hogares reales.
      </h2>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
        {TESTIMONIALS.map((t, i) => (
          <figure
            key={t.name}
            className="reveal flex flex-col pt-6 border-t border-[#1e1c1a]"
            style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}
          >
            <blockquote className="font-display text-[22px] font-light leading-[1.35] tracking-[-0.01em] text-[#1e1c1a]">
              “{t.comment}”
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-[#dfe3ec] text-[#2c3445] text-[14px] font-medium"
              >
                {initials(t.name)}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-medium text-[#1e1c1a] truncate">{t.name}</span>
                <span className="block text-[13px] text-[#6b655e] truncate">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
