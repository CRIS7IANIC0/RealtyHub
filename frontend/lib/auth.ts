/** Utilidades de sesión del cliente (el usuario se guarda en localStorage al iniciar sesión). */
export interface SessionUser {
  id?: string;
  name?: string;
  role?: string;
  token?: string;
}

export function getSession(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "null");
  } catch {
    return null;
  }
}

/** Cabeceras con el JWT para las llamadas protegidas del gateway. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getSession()?.token;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export const isManager = (role?: string) => ["ADMIN", "GERENTE"].includes(String(role).toUpperCase());
