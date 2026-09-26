/**
 * Configuración global del cliente HTTP.
 *
 * En Vercel: define NEXT_PUBLIC_GATEWAY_URL en las variables de entorno del proyecto
 *            apuntando al dominio público del api-gateway en Railway, ej:
 *            https://api-gateway-production.up.railway.app
 *            (sin /api/v1 y sin "/" al final; el prefijo se agrega aquí).
 *
 * En local:  el fallback usa localhost:3000 automáticamente.
 */
const GATEWAY_BASE = (
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

// El api-gateway expone todas sus rutas bajo el prefijo global "api/v1"
// (ver api-gateway/src/main.ts). Si la variable ya lo incluye, no se duplica.
export const GATEWAY = GATEWAY_BASE.endsWith("/api/v1")
  ? GATEWAY_BASE
  : `${GATEWAY_BASE}/api/v1`;
