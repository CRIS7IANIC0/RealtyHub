"use client";

/* ─────────────────────────────────────────────────────────────
   LoginPage — RealtyHub Authentication
   Strict Airbnb Design System · Modern Corporate Style
   ───────────────────────────────────────────────────────────── */

import ArrowIcon from "@/components/ui/ArrowIcon";
import Link from "next/link";
import { BrandLogo } from "@/components/Navbar";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { GATEWAY } from "@/lib/config";

const HouseScene = dynamic(() => import("@/components/login/HouseScene"), { ssr: false });

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
      className="text-[#6b655e]"
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
      className="text-[#6b655e]"
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
  const [showPwd, setShowPwd] = useState(false);

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
      window.dispatchEvent(new CustomEvent("rh:navigate", { detail: "/" }));
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
    "w-full rounded-md border border-[#cfc7ba] bg-[#faf8f4] pl-11 pr-4 py-3.5 text-[15px] text-[#1e1c1a] placeholder:text-[#716b63] outline-none transition-colors hover:border-[#716b63] focus:border-[#1e1c1a]";

  const DEMOS = [
    { email: "admin@realtyhub.com", role: "Admin", hint: "Todos los módulos" },
    { email: "gerente@realtyhub.com", role: "Gerente", hint: "Todos los módulos" },
    { email: "agente@realtyhub.com", role: "Agente", hint: "Sin analíticas" },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Panel con escena 3D (solo escritorio) ── */}
      <aside className="hidden lg:flex relative flex-col overflow-hidden bg-[#151922] text-[#faf8f4] p-12 xl:p-16 grain">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 55% 62%, rgba(176,78,66,0.35), transparent 70%), radial-gradient(50% 50% at 15% 10%, rgba(142,154,179,0.25), transparent 70%)",
          }}
        />
        <HouseScene />

        <div className="relative z-10 flex items-center justify-between">
          <BrandLogo tone="light" />
          <span className="text-[13px] text-[#faf8f4]/55">Acceso del equipo</span>
        </div>

        <div className="relative z-10 pointer-events-none mt-10 xl:mt-14">
          <p className="login-rise font-display text-[clamp(34px,3.8vw,58px)] leading-[1.04] tracking-[-0.04em] max-w-[14ch]" style={{ ["--d" as string]: "200ms" }}>
            Cada visita, contrato y comisión en un <span className="text-[#e7b4a8]">solo lugar.</span>
          </p>
        </div>
        <div className="relative z-10 pointer-events-none mt-auto">
          <ul className="flex flex-wrap gap-2.5">
            {["Visita asignada", "Contrato firmado", "Comisión generada"].map((t, i) => (
              <li
                key={t}
                className="login-rise login-float rounded-full border border-[#faf8f4]/25 bg-[#faf8f4]/[0.06] px-4 py-2 text-[13px] text-[#faf8f4]/85 backdrop-blur-sm"
                style={{ ["--d" as string]: `${500 + i * 140}ms`, ["--f" as string]: `${i * 0.7}s` }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d98a7e] mr-2 align-middle" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Formulario ── */}
      <div className="flex flex-col min-h-screen bg-[#f3efe8]">
        <header className="px-6 md:px-12 py-6 flex items-center justify-between">
          <span className="lg:hidden"><BrandLogo /></span>
          <Link
            href="/"
            className="ml-auto text-[14px] text-[#6b655e] hover:text-[#1e1c1a] no-underline transition-colors"
          >
            <ArrowIcon dir="left" /> Volver al inicio
          </Link>
        </header>

        <main className="flex-1 flex items-center px-6 md:px-12 pb-10">
          <div className="w-full max-w-[440px] mx-auto">
            <h1 className="font-display text-[clamp(36px,4vw,52px)] font-light leading-[1.05] tracking-[-0.035em] text-[#1e1c1a]">
              Iniciar sesión
            </h1>
            <p className="login-rise text-[16px] text-[#6b655e] mt-3" style={{ ["--d" as string]: "260ms" }}>
              Usa las credenciales que te dio tu inmobiliaria.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-md bg-[#f3e2de] border border-[#e3b8b0] px-4 py-3 text-[14px] text-[#7a2f25] leading-snug"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-rise mt-8 space-y-5" style={{ ["--d" as string]: "380ms" }}>
              <div>
                <label htmlFor="login-email" className="block text-[14px] font-medium text-[#1e1c1a] mb-2">
                  Correo electrónico
                </label>
                <div className="relative field-wrap">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <IconMail />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="nombre@realtyhub.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[14px] font-medium text-[#1e1c1a] mb-2">
                  Contraseña
                </label>
                <div className="relative field-wrap">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <IconLock />
                  </span>
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-20`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-pressed={showPwd}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-[13px] font-medium text-[#6b655e] hover:text-[#1e1c1a] cursor-pointer"
                  >
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-magnetic className="btn-shine w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#b04e42] hover:bg-[#a64739] text-[#faf8f4] py-4 text-[16px] font-medium transition-colors duration-300 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <IconLoader />
                    <span>Ingresando…</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </form>

            {/* ── Cuentas de demostración (1 clic) ── */}
            <div className="login-rise mt-10 pt-8 border-t border-[#e2dcd2]" style={{ ["--d" as string]: "560ms" }}>
              <p className="text-[14px] font-medium text-[#1e1c1a]">Probar con una cuenta de demostración</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {DEMOS.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => handleDemoLogin(d.email, d.role)}
                    disabled={loading}
                    className="text-left rounded-md border border-[#cfc7ba] bg-[#faf8f4] hover:border-[#1e1c1a] px-3.5 py-3 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span className="block text-[14px] font-medium text-[#1e1c1a]">{d.role}</span>
                    <span className="block text-[12px] text-[#6b655e] mt-0.5">{d.hint}</span>
                  </button>
                ))}
              </div>
              <p className="text-[13px] text-[#6b655e] mt-4">
                Contraseña de todas las cuentas de demostración:{" "}
                <code className="bg-[#ece6dc] px-1.5 py-0.5 rounded text-[#1e1c1a]">123456</code>
              </p>
            </div>
          </div>
        </main>

        <footer className="px-6 md:px-12 py-6 text-[13px] text-[#6b655e]">
          © {new Date().getFullYear()} RealtyHub. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
