/**
 * Configuración global del cliente HTTP.
 *
 * En Vercel: define NEXT_PUBLIC_GATEWAY_URL en las variables de entorno del proyecto
 *            apuntando a tu servicio de Railway, ej:
 *            https://realtyhub-production.up.railway.app
 *
 * En local:  el fallback usa localhost:3000 automáticamente.
 */
export const GATEWAY =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";
