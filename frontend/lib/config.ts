/**
 * Configuración global del cliente HTTP.
 *
 * El API Gateway expone todas sus rutas bajo el prefijo /api/v1.
 *
 * En Vercel: define NEXT_PUBLIC_GATEWAY_URL en las variables de entorno del proyecto
 *            apuntando a tu servicio de Railway, ej:
 *            https://realtyhub-production.up.railway.app
 *            (el prefijo /api/v1 se añade automáticamente si falta).
 *
 * En local:  el fallback usa localhost:3000 automáticamente.
 */
const API_PREFIX = "/api/v1";

function normalizeGatewayUrl(raw: string | undefined): string {
  let url = (raw ?? "").trim().replace(/\/+$/, "");
  if (!url) url = "http://localhost:3000";
  if (!/^https?:\/\//.test(url)) url = `https://${url}`;
  return url.endsWith(API_PREFIX) ? url : `${url}${API_PREFIX}`;
}

export const GATEWAY = normalizeGatewayUrl(process.env.NEXT_PUBLIC_GATEWAY_URL);
