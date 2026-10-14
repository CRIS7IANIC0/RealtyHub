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
  {
    name: "Julián Pérez",
    role: "Propietario en Cartagena",
    comment:
      "Publiqué mi casa y en dos semanas ya tenía varios interesados reales. El equipo gestionó todo con mucha profesionalidad.",
    rating: 5,
    gradient: "from-[#444444] to-[#111111]",
  },
  {
    name: "Valentina Ortiz",
    role: "Inquilina en Barranquilla",
    comment:
      "Excelente experiencia alquilando. Me ayudaron a comparar opciones y conseguí un lugar perfecto dentro de mi presupuesto.",
    rating: 5,
    gradient: "from-[#e31c5f] to-[#ff7a8f]",
  },
  {
    name: "Sebastián Torres",
    role: "Comprador en Montería",
    comment:
      "Compré mi primera casa gracias a RealtyHub. Resolvieron todas mis dudas y nunca me sentí presionado.",
    rating: 5,
    gradient: "from-[#ff385c] to-[#222222]",
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
      className="space-y-6"
    >
      <div>
        <h2
          id="testimonios-title"
          className="text-[22px] md:text-[26px] font-semibold tracking-[-0.44px] text-[#222222]"
        >
          Lo que dicen nuestros clientes
        </h2>
        <p className="text-[14px] text-[#6a6a6a] mt-1">
          Historias reales de personas que encontraron su lugar con RealtyHub.
        </p>
      </div>

      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 hide-scrollbar">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="snap-start shrink-0 w-[85%] sm:w-[60%] md:w-auto flex flex-col justify-between rounded-[20px] bg-white border border-[#ebebeb] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
          >
            <div>
              <Stars rating={t.rating} />
              <blockquote className="mt-4 text-[15px] leading-relaxed text-[#222222]">
                “{t.comment}”
              </blockquote>
            </div>
            <figcaption className="mt-6 flex items-center gap-3">
              <div
                aria-hidden="true"
                className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-gradient-to-br ${t.gradient} text-white text-[14px] font-semibold`}
              >
                {initials(t.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#222222] truncate">
                  {t.name}
                </p>
                <p className="text-[13px] text-[#6a6a6a] truncate">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
