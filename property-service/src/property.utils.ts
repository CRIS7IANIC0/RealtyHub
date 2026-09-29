/* ─────────────────────────────────────────────────────────────
   Catálogos y normalización de propiedades.
   Las reglas de inferencia replican las del frontend
   (frontend/lib/property.ts) para completar registros antiguos
   que no traen operación, tipo o ciudad.
   ───────────────────────────────────────────────────────────── */

export const STATUSES = ['Disponible', 'Reservada', 'Vendida', 'Alquilada'] as const;
export const OPERATIONS = ['Venta', 'Alquiler'] as const;
export const PROPERTY_TYPES = [
  'Casa',
  'Apartamento',
  'Apartaestudio',
  'Lote',
  'Local',
  'Oficina',
  'Finca',
] as const;

// El orden importa: "apartaestudio" antes que "apartamento".
const TYPE_PATTERNS: [string, RegExp][] = [
  ['Apartaestudio', /apartaestudio|estudio/],
  ['Apartamento', /apartamento|apto\b|penthouse/],
  ['Casa', /\bcasa|chalet|villa/],
  ['Finca', /finca|hacienda|casa campestre/],
  ['Lote', /\blote|terreno/],
  ['Local', /\blocal\b|local comercial|bodega/],
  ['Oficina', /oficina|consultorio/],
];

const RENTAL_PATTERN = /alquil|arriend|arrendamiento|\brenta\b|en renta|por mes|mensual/;

/** Busca `value` en `options` sin distinguir mayúsculas y devuelve la forma canónica. */
function canonical<T extends string>(options: readonly T[], value: unknown): T | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === v);
}

export function normalizeStatus(value: unknown): string | undefined {
  // Compatibilidad con valores en inglés usados en versiones anteriores
  const aliases: Record<string, string> = {
    available: 'Disponible',
    reserved: 'Reservada',
    sold: 'Vendida',
    rented: 'Alquilada',
  };
  if (typeof value === 'string' && aliases[value.trim().toLowerCase()]) {
    return aliases[value.trim().toLowerCase()];
  }
  return canonical(STATUSES, value);
}

export const normalizeOperation = (v: unknown) => canonical(OPERATIONS, v);
export const normalizeType = (v: unknown) => canonical(PROPERTY_TYPES, v);

export function inferOperation(text: string): string {
  return RENTAL_PATTERN.test(text.toLowerCase()) ? 'Alquiler' : 'Venta';
}

export function inferType(text: string): string | null {
  const t = text.toLowerCase();
  for (const [type, re] of TYPE_PATTERNS) {
    if (re.test(t)) return type;
  }
  return null;
}

/** "Cra 5 #10-20, Montería" → "Montería". */
export function inferCity(address: string): string | null {
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

export function cleanImages(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((u): u is string => typeof u === 'string' && u.trim() !== '');
}
