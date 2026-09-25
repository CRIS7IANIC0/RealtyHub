"use client";

/* ─────────────────────────────────────────────────────────────
   LoginPage — RealtyHub Authentication
   Strict Airbnb Design System · Modern Corporate Style
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GATEWAY = "http://localhost:3000";

function IconLoader() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performLogin(targetEmail: string, targetPass: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${GATEWAY}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Credenciales incorrectas");
      }

      // Guardar usuario en localStorage
      localStorage.setItem("user", JSON.stringify(data));
      window.dispatchEvent(new Event("realtyhub_auth_changed"));

      // Redirigir al inicio
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al iniciar sesión. Verifica tu conexión y credenciales."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }
    performLogin(email.trim(), password);
  }

  function handleDemoLogin(demoEmail: string, roleName: string) {
    setEmail(demoEmail);
    setPassword("123456");
    performLogin(demoEmail, "123456");
  }

  const inputClass =
    "w-full rounded-[10px] border border-[#ebebeb] bg-white px-10 py-3 text-[14px] text-[#222222] placeholder:text-[#b0b0b0] outline-none transition-colors focus:border-[#222222]";

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col justify-between">
      {/* ── Header Simple ── */}
      <header className="px-6 md:px-10 py-6">
        <Link
          href="/"
          className="text-[24px] font-bold tracking-[-0.5px] text-[#ff385c] no-underline"
        >
          RealtyHub
        </Link>
      </header>

      {/* ── Contenedor Central ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[460px] bg-white rounded-[16px] border border-[#ebebeb] p-8 md:p-10 shadow-none">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-[#222222]">
              Iniciar Sesión
            </h1>
            <p className="text-[14px] text-[#6a6a6a] mt-1.5">
              Ingresa con tus credenciales corporativas para gestionar la red inmobiliaria.
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-6 rounded-[8px] bg-rose-50 border border-rose-200 px-4 py-3 text-[13px] text-rose-700 font-medium leading-snug">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[13px] font-medium text-[#222222] mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <IconMail />
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="ej. admin@realtyhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[13px] font-medium text-[#222222] mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <IconLock />
                </span>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#ff385c] hover:bg-[#d90b3e] text-white py-3.5 text-[15px] font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-none"
            >
              {loading ? (
                <>
                  <IconLoader />
                  <span>Ingresando...</span>
                </>
              ) : (
                <span>Continuar</span>
              )}
            </button>
          </form>

          {/* ── Demo Credentials (1-Clic) ── */}
          <div className="mt-8 pt-6 border-t border-[#ebebeb]">
            <p className="text-[12px] uppercase font-semibold tracking-wider text-[#6a6a6a] mb-3 text-center">
              Acceso Rápido de Prueba (Roles)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("admin@realtyhub.com", "Admin")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-[10px] border border-[#ebebeb] bg-[#f7f7f7] hover:border-[#222222] hover:bg-white transition-all text-center cursor-pointer disabled:opacity-50"
              >
                <span className="text-[12px] font-semibold text-[#222222]">Admin</span>
                <span className="text-[10px] text-[#6a6a6a] mt-0.5">Todos los módulos</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("gerente@realtyhub.com", "Gerente")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-[10px] border border-[#ebebeb] bg-[#f7f7f7] hover:border-[#222222] hover:bg-white transition-all text-center cursor-pointer disabled:opacity-50"
              >
                <span className="text-[12px] font-semibold text-[#222222]">Gerente</span>
                <span className="text-[10px] text-[#6a6a6a] mt-0.5">Todos los módulos</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("agente@realtyhub.com", "Agente")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-[10px] border border-[#ebebeb] bg-[#f7f7f7] hover:border-[#222222] hover:bg-white transition-all text-center cursor-pointer disabled:opacity-50"
              >
                <span className="text-[12px] font-semibold text-[#222222]">Agente</span>
                <span className="text-[10px] text-[#6a6a6a] mt-0.5">Sin analíticas</span>
              </button>
            </div>
            <p className="text-[11px] text-center text-[#999999] mt-3">
              Contraseña por defecto para todas las cuentas: <code className="bg-[#f0f0f0] px-1 py-0.5 rounded">123456</code>
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-[12px] text-[#6a6a6a]">
        © {new Date().getFullYear()} RealtyHub. Sistema de Gestión Inmobiliaria y Event-Driven Analytics.
      </footer>
    </div>
  );
}
