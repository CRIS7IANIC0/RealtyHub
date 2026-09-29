/* ─────────────────────────────────────────────────────────────
   Helpers de propiedades compartidos por el frontend.
   El property-service expone `operation`, `property_type` y `city`;
   si una propiedad antigua no los trae, se infieren del título,
   la descripción y la dirección (mismas reglas que el backend).
   ───────────────────────────────────────────────────────────── */

export interface PublicProperty {
  id: string | number;
  title?: string;
  description?: string;
  address: string;
  price: number;
  status: string;
  images?: string[];
  image_url?: string;
  /** "Venta" | "Alquiler" */
  operation?: string | null;
  property_type?: string | null;
  city?: string | null;
  created_at?: string;
  /** Opcional: el backend aún no lo expone. Sin él la tarjeta muestra "Nuevo". */
  rating?: number;
}

export const OPERATIONS = ["Venta", "Alquiler"] as const;

export const STATUSES = [
  { value: "Disponible", label: "Disponible" },
  { value: "Reservada", label: "Reservada" },
  { value: "Vendida", label: "Vendida" },
  { value: "Alquilada", label: "Alquilada" },
] as const;

export const PROPERTY_TYPES = [
  "Casa",
  "Apartamento",
  "Apartaestudio",
  "Lote",
  "Local",
  "Oficina",
  "Finca",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

// El orden importa: "apartaestudio" antes que "apartamento".
const TYPE_PATTERNS: [PropertyType, RegExp][] = [
  ["Apartaestudio", /apartaestudio|estudio/],
  ["Apartamento", /apartamento|apto\b|penthouse/],
  ["Casa", /\bcasa|chalet|villa/],
  ["Finca", /finca|hacienda|casa campestre/],
  ["Lote", /\blote|terreno/],
  ["Local", /\blocal\b|local comercial|bodega/],
  ["Oficina", /oficina|consultorio/],
];

const RENTAL_PATTERN = /alquil|arriend|arrendamiento|\brenta\b|en renta|por mes|mensual/;

function haystack(p: PublicProperty): string {
  return `${p.title ?? ""} ${p.description ?? ""}`.toLowerCase();
}

/** Todas las fotos de la propiedad (compatibilidad con el antiguo `image_url`). */
export function getPropertyImages(p: PublicProperty): string[] {
  if (p.images && p.images.length > 0) return p.images;
  return p.image_url ? [p.image_url] : [];
}

export function getPropertyImage(p: PublicProperty): string | undefined {
  return getPropertyImages(p)[0];
}

export function isAvailable(p: PublicProperty): boolean {
  const st = p.status?.toLowerCase();
  return st === "disponible" || st === "available";
}

export function isRental(p: PublicProperty): boolean {
  if (p.operation) return p.operation.toLowerCase() === "alquiler";
  return RENTAL_PATTERN.test(haystack(p));
}

export function inferType(p: PublicProperty): PropertyType | null {
  const stored = PROPERTY_TYPES.find(
    (t) => t.toLowerCase() === p.property_type?.toLowerCase()
  );
  if (stored) return stored;
  const text = haystack(p);
  for (const [type, re] of TYPE_PATTERNS) {
    if (re.test(text)) return type;
  }
  return null;
}

/** Ciudad guardada o, si falta, la última parte de la dirección tras la coma. */
export function inferCity(p: PublicProperty): string | null {
  if (p.city) return p.city;
  const parts = p.address?.split(",").map((s) => s.trim()).filter(Boolean);
  return parts && parts.length > 1 ? parts[parts.length - 1] : null;
}

/** Encabezado estilo Airbnb: "Apartamento en Montería", con fallback al título. */
export function cardHeading(p: PublicProperty): string {
  const type = inferType(p);
  const city = inferCity(p);
  if (type && city) return `${type} en ${city}`;
  return p.title || p.address;
}

export function fmtPrice(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}
