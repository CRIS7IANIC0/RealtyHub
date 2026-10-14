/* ─────────────────────────────────────────────────────────────
   TestimonialsSection — Prueba social estilo Airbnb
   Móvil: carrusel con scroll-snap horizontal.
   Desktop: grid de 3 columnas.
   ───────────────────────────────────────────────────────────── */

interface Testimonial {
  name: string;
  role: string;
  comment: string;
  rating: number;
  gradient: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Laura Martínez",
    role: "Compradora en Montería",
    comment:
      "Encontré mi apartamento en menos de un mes. El agente me acompañó en cada visita y el proceso de escrituración fue claro y sin sorpresas.",
    rating: 5,
    gradient: "from-[#ff385c] to-[#e31c5f]",
  },
  {
    name: "Andrés Gómez",
    role: "Inquilino en Medellín",
    comment:
      "Agendar la visita fue facilitísimo y la propiedad era tal cual las fotos. Firmé mi contrato de arriendo en pocos días.",
    rating: 5,
    gradient: "from-[#222222] to-[#555555]",
  },
  {
    name: "Camila Rodríguez",
    role: "Compradora en Bogotá",
    comment:
      "Me encantó la transparencia: precios reales, información verificada y respuestas rápidas. Recomiendo RealtyHub sin dudarlo.",
    rating: 5,
    gradient: "from-[#ff7a8f] to-[#ff385c]",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Calificación: ${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={i <= rating ? "text-[#ff385c]" : "text-[#dddddd]"}
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

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
    <section
      id="testimonios"
      aria-labelledby="testimonios-title"
      className="relative overflow-hidden rounded-[28px] bg-white border border-[#ebebeb] px-5 sm:px-8 md:px-12 py-10 md:py-14"
    >
      {/* Acento decorativo de marca */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ff385c]/10 blur-3xl"
      />

      <div className="relative text-center max-w-[640px] mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff385c]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-[#ff385c]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Testimonios
        </span>
        <h2
          id="testimonios-title"
          className="mt-4 text-[26px] md:text-[34px] font-semibold tracking-[-0.6px] leading-tight text-[#222222]"
        >
          Familias felices, <span className="text-[#ff385c]">hogares reales</span>
        </h2>
        <p className="text-[15px] text-[#6a6a6a] mt-3">
          Miles de personas ya encontraron su lugar ideal con RealtyHub. Esto es
          lo que cuentan.
        </p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col rounded-[20px] bg-[#f7f7f7] border border-[#ebebeb] p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
          >
            {/* 1. Perfil */}
            <figcaption className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className={`flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-gradient-to-br ${t.gradient} text-white text-[15px] font-semibold ring-4 ring-white`}
              >
                {initials(t.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[#222222] truncate">
                  {t.name}
                </p>
                <p className="text-[13px] text-[#6a6a6a] truncate">{t.role}</p>
              </div>
            </figcaption>

            {/* 2. Estrellas */}
            <div className="mt-5">
              <Stars rating={t.rating} />
            </div>

            {/* 3. Comentario */}
            <blockquote className="mt-3 text-[15px] leading-relaxed text-[#222222]">
              “{t.comment}”
            </blockquote>
          </figure>
        ))}
      </div>
    </section>
  );
}
