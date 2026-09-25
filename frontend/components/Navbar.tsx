"use client";

/* ─────────────────────────────────────────────────────────────
   Navbar — Shared Client Component (Modern SaaS / Airbnb Style)
   - Sticky top con backdrop-blur corporativo
   - Logo tipográfico de alto impacto con isotipo RealtyHub
   - Enlaces con hover interactivo y animación de borde inferior
   - Botón primario estilizado para Iniciar Sesión
   - Soporte RBAC intacto:
     * Invitado: Solo Inicio y Propiedades
     * AGENTE: Inicio, Propiedades, Leads, Agenda, Contratos, Comisiones, Personal
     * GERENTE / ADMIN: Incluye módulo de Analíticas
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: string; // 'AGENTE' | 'GERENTE' | 'ADMIN'
  office_id?: string;
}

export type NavTab =
  | "inicio"
  | "properties"
  | "leads"
  | "viewings"
  | "contracts"
  | "commissions"
  | "analytics"
  | "users"
  | "notifications";

function IconBell() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-700"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconLogOut() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Navbar({ activeTab }: { activeTab?: NavTab }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    function loadUser() {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoaded(true);
      }
    }

    loadUser();

    // Sincronización entre pestañas y eventos locales de auth
    window.addEventListener("storage", loadUser);
    window.addEventListener("realtyhub_auth_changed", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("realtyhub_auth_changed", loadUser);
    };
  }, []);

  // Control de protección de rutas privadas en el cliente
  useEffect(() => {
    if (!isLoaded) return;

    const privateTabs: NavTab[] = [
      "contracts",
      "commissions",
      "analytics",
      "leads",
      "viewings",
      "users",
    ];

    if (!user && activeTab && privateTabs.includes(activeTab)) {
      router.push("/login");
      return;
    }

    const role = user?.role?.toUpperCase();
    if (activeTab === "analytics" && role === "AGENTE") {
      router.push("/");
    }
  }, [user, isLoaded, activeTab, router]);

  function handleLogout() {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("realtyhub_auth_changed"));
    setUser(null);
    router.push("/login");
  }

  const role = user?.role?.toUpperCase();
  const isManagerOrAdmin = role === "GERENTE" || role === "ADMIN";

  // Estilo moderno de enlaces con hover sutil de color y borde inferior animado
  const linkClass = (tab: NavTab) =>
    `relative text-[14px] transition-all duration-200 no-underline py-2 px-3 rounded-lg font-medium group flex items-center ${
      activeTab === tab
        ? "text-gray-900 font-semibold bg-gray-100/80 after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-[2px] after:bg-[#ff385c] after:rounded-full"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-[2px] after:bg-gray-300 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:rounded-full"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 h-20 transition-all">
      <div className="w-full max-w-[1400px] h-full mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* ─── Bloque Izquierdo: Logo Corporativo ─── */}
        <div className="flex-1 flex justify-start">
          <Link
            href="/"
            className="flex items-center gap-2.5 no-underline group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff385c] to-[#ff5a5f] flex items-center justify-center text-white shadow-xs group-hover:shadow-md transition-shadow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-[23px] font-extrabold tracking-[-0.6px] text-[#ff385c]">
              Realty<span className="text-gray-900 font-black">Hub</span>
            </span>
          </Link>
        </div>

        {/* ─── Bloque Central: Enlaces de Navegación ─── */}
        <div className="flex justify-center flex-shrink-0">
          <nav className="hidden md:flex items-center gap-1.5">
            <Link href="/" className={linkClass("inicio")}>
              Inicio
            </Link>

            {/* Propiedades siempre visible (público y privado) */}
            <Link href="/properties" className={linkClass("properties")}>
              Propiedades
            </Link>

            {/* Módulos protegidos para usuarios autenticados */}
            {user && (
              <>
                <Link href="/leads" className={linkClass("leads")}>
                  Leads
                </Link>
                <Link href="/viewings" className={linkClass("viewings")}>
                  Agenda
                </Link>
                <Link href="/contracts" className={linkClass("contracts")}>
                  Contratos
                </Link>
                <Link href="/commissions" className={linkClass("commissions")}>
                  Comisiones
                </Link>

                {/* Analíticas SOLO para GERENTE o ADMIN */}
                {isManagerOrAdmin && (
                  <Link href="/analytics" className={linkClass("analytics")}>
                    Analíticas
                  </Link>
                )}

                <Link href="/users" className={linkClass("users")}>
                  Personal
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* ─── Bloque Derecho: Usuario / Login y Notificaciones ─── */}
        <div className="flex-1 flex justify-end items-center gap-4">
          {user ? (
            <>
              {/* Centro de notificaciones */}
              <Link
                href="/notifications"
                className="relative cursor-pointer hover:bg-gray-100 p-2.5 rounded-full transition-colors flex items-center justify-center w-10 h-10 no-underline text-gray-700"
                aria-label="Centro de notificaciones"
              >
                <IconBell />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff385c] ring-2 ring-white" />
              </Link>

              {/* Píldora de Rol Corporativa */}
              <div className="hidden sm:flex items-center pl-2 border-l border-gray-200">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    role === "ADMIN"
                      ? "bg-gray-900 text-white border-gray-900"
                      : role === "GERENTE"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {role || "AGENTE"}
                </span>
              </div>

              {/* Menú Desplegable de Usuario (Dropdown) */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#ff385c] focus:ring-offset-2 transition-transform active:scale-95 cursor-pointer"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Abrir menú de usuario"
                >
                  <div
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center text-[13px] font-bold shadow-xs ring-2 ring-gray-100 hover:ring-gray-300 transition-all"
                    title={`${user.name} (${user.email})`}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    {/* Contenido Superior: Info de Usuario */}
                    <div className="p-4">
                      <p className="font-semibold text-gray-800 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    {/* Separador */}
                    <hr className="border-gray-100" />

                    {/* Contenido Inferior: Acción Cerrar Sesión */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left p-3 text-rose-600 font-medium hover:bg-gray-50 rounded-b-xl flex items-center gap-2 transition-colors cursor-pointer text-sm"
                    >
                      <IconLogOut />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white text-[14px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 no-underline cursor-pointer active:scale-95"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
