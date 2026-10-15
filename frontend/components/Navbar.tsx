"use client";

/* ─────────────────────────────────────────────────────────────
   Navbar — navegación única de RealtyHub.
   - Visitante: barra superior editorial (Inicio · Propiedades · Iniciar sesión)
     con menú a pantalla completa en móvil.
   - Equipo autenticado: barra lateral agrupada por flujo de trabajo en
     escritorio y cajón en móvil. RBAC intacto:
       AGENTE: todo menos Analíticas · GERENTE / ADMIN: incluye Analíticas.
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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

/* ── Iconos (trazo 1.6, una sola familia) ─────────────────── */
type IconProps = React.SVGProps<SVGSVGElement>;
function Icon({ children, ...p }: IconProps) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}
const I = {
  home: (p: IconProps) => (<Icon {...p}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></Icon>),
  building: (p: IconProps) => (<Icon {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></Icon>),
  target: (p: IconProps) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Icon>),
  calendar: (p: IconProps) => (<Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>),
  file: (p: IconProps) => (<Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Icon>),
  coins: (p: IconProps) => (<Icon {...p}><circle cx="9" cy="9" r="6" /><path d="M15.5 9.5a6 6 0 1 1-6 6" /></Icon>),
  chart: (p: IconProps) => (<Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>),
  users: (p: IconProps) => (<Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></Icon>),
  bell: (p: IconProps) => (<Icon {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Icon>),
  logout: (p: IconProps) => (<Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Icon>),
  menu: (p: IconProps) => (<Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>),
  close: (p: IconProps) => (<Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>),
};

/** Marca: casita dibujada + nombre. Es un botón: lleva siempre al inicio
 *  (si ya estás en el inicio, sube suave hasta arriba). Se hunde al presionar. */
export function BrandLogo({
  compactOnMobile = false,
  tone = "dark",
}: {
  compactOnMobile?: boolean;
  tone?: "dark" | "light";
}) {
  const pathname = usePathname();
  const ink = tone === "light" ? "text-[#faf8f4]" : "text-[#1e1c1a]";
  const hover = tone === "light" ? "hover:bg-[#faf8f4]/10" : "hover:bg-[#1e1c1a]/[0.06]";
  return (
    <Link
      href="/"
      data-magnetic
      aria-label="RealtyHub, ir al inicio"
      title="Ir al inicio"
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className={`brand rounded-full inline-flex items-center gap-2 no-underline pl-2 pr-3 py-1.5 -ml-2 transition-colors duration-300 ${ink} ${hover}`}
    >
      <svg viewBox="0 0 34 34" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path pathLength={1} d="M3 17 17 4l14 13" />
        <path pathLength={1} d="M7 14.5V29h20V14.5" />
        <path pathLength={1} className="text-[#c4584c]" stroke="#c4584c" d="M14 29v-8h6v8" />
      </svg>
      <span
        className={`font-display text-[24px] font-medium tracking-[-0.04em] leading-none ${
          compactOnMobile ? "hidden lg:inline" : ""
        }`}
      >
        Realty<span className="text-[#c4584c]">Hub</span>
      </span>
      {compactOnMobile && (
        <span className="lg:hidden font-display text-[24px] font-medium tracking-[-0.04em] leading-none">
          R<span className="text-[#c4584c]">H</span>
        </span>
      )}
    </Link>
  );
}

interface NavItem {
  tab: NavTab;
  href: string;
  label: string;
  icon: (p: IconProps) => React.JSX.Element;
  managerOnly?: boolean;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const TEAM_GROUPS: NavGroup[] = [
  { title: "General", items: [{ tab: "inicio", href: "/", label: "Resumen", icon: I.home }] },
  {
    title: "Captación",
    items: [
      { tab: "properties", href: "/properties", label: "Propiedades", icon: I.building },
      { tab: "leads", href: "/leads", label: "Leads", icon: I.target },
      { tab: "viewings", href: "/viewings", label: "Agenda de visitas", icon: I.calendar },
    ],
  },
  {
    title: "Cierre",
    items: [
      { tab: "contracts", href: "/contracts", label: "Contratos", icon: I.file },
      { tab: "commissions", href: "/commissions", label: "Comisiones", icon: I.coins },
    ],
  },
  {
    title: "Gestión",
    items: [
      { tab: "analytics", href: "/analytics", label: "Analíticas", icon: I.chart, managerOnly: true },
      { tab: "users", href: "/users", label: "Personal", icon: I.users },
      { tab: "notifications", href: "/notifications", label: "Notificaciones", icon: I.bell },
    ],
  },
];

const roleStyle = (role?: string) =>
  role === "ADMIN"
    ? "bg-[#1e1c1a] text-[#faf8f4]"
    : role === "GERENTE"
    ? "bg-[#dfe3ec] text-[#2c3445]"
    : "bg-[#ece6dc] text-[#433e39]";

export default function Navbar({ activeTab, overHero = false }: { activeTab?: NavTab; overHero?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sobre el hero oscuro la barra es transparente con texto claro; al bajar pasa a hueso
  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  useEffect(() => {
    function loadUser() {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      } finally {
        setIsLoaded(true);
      }
    }
    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("realtyhub_auth_changed", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("realtyhub_auth_changed", loadUser);
    };
  }, []);

  // Protección de rutas privadas en el cliente (sin cambios)
  useEffect(() => {
    if (!isLoaded) return;
    const privateTabs: NavTab[] = ["contracts", "commissions", "analytics", "leads", "viewings", "users"];
    if (!user && activeTab && privateTabs.includes(activeTab)) {
      router.push("/login");
      return;
    }
    if (activeTab === "analytics" && user?.role?.toUpperCase() === "AGENTE") router.push("/");
  }, [user, isLoaded, activeTab, router]);

  // La barra lateral reserva espacio en <body> (ver globals.css)
  useEffect(() => {
    if (!user) return;
    document.body.classList.add("has-sidebar");
    return () => document.body.classList.remove("has-sidebar");
  }, [user]);

  // Bloquea el scroll mientras el menú móvil está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("realtyhub_auth_changed"));
    setUser(null);
    router.push("/login");
  }

  const role = user?.role?.toUpperCase();
  const isManagerOrAdmin = role === "GERENTE" || role === "ADMIN";

  /* ═══════════ VISITANTE ═══════════ */
  if (!user) {
    const light = overHero && !scrolled;
    const link = (tab: NavTab, href: string, label: string) => (
      <Link
        href={href}
        data-transition="full"
        className={`relative py-2 text-[15px] no-underline transition-colors after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-300 ${
          light
            ? activeTab === tab
              ? "text-[#faf8f4] after:scale-x-100"
              : "text-[#faf8f4]/70 hover:text-[#faf8f4] after:scale-x-0 hover:after:scale-x-100"
            : activeTab === tab
            ? "text-[#1e1c1a] after:scale-x-100"
            : "text-[#6b655e] hover:text-[#1e1c1a] after:scale-x-0 hover:after:scale-x-100"
        }`}
      >
        <span className="roll-wrap"><span>{label}</span><span aria-hidden="true">{label}</span></span>
      </Link>
    );
    return (
      <>
        <header
          className={`${overHero ? "fixed inset-x-0" : "sticky"} top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
            light ? "bg-transparent border-transparent" : "bg-[#f3efe8]/90 backdrop-blur-md border-[#e2dcd2]"
          }`}
        >
          <div className="w-full max-w-[1440px] mx-auto h-[72px] px-5 md:px-10 flex items-center justify-between">
            <BrandLogo tone={light ? "light" : "dark"} />
            <nav className="hidden md:flex items-center gap-9" aria-label="Principal">
              {link("inicio", "/", "Inicio")}
              {link("properties", "/properties", "Propiedades")}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                data-transition="full"
                data-magnetic
                className={`hidden sm:inline-flex items-center rounded-full text-[14px] font-medium px-5 py-2.5 no-underline transition-colors duration-300 ${
                  light
                    ? "bg-[#faf8f4] text-[#151922] hover:bg-[#b04e42] hover:text-[#faf8f4]"
                    : "bg-[#1e1c1a] hover:bg-[#b04e42] text-[#faf8f4]"
                }`}
              >
                <span className="roll-wrap"><span>Iniciar sesión</span><span aria-hidden="true">Iniciar sesión</span></span>
              </Link>
              <button
                type="button"
                className={`md:hidden p-2 -mr-2 cursor-pointer ${light ? "text-[#faf8f4]" : ""}`}
                aria-label="Abrir menú"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <I.menu width={24} height={24} />
              </button>
            </div>
          </div>
        </header>

        {open && (
          <div className="fixed inset-0 z-[60] bg-[#f3efe8] flex flex-col px-6 py-5" role="dialog" aria-modal="true" aria-label="Menú">
            <div className="flex items-center justify-between h-[52px]">
              <BrandLogo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="p-2 -mr-2 cursor-pointer">
                <I.close width={24} height={24} />
              </button>
            </div>
            <nav className="flex-1 flex flex-col justify-center gap-2" aria-label="Principal">
              {[
                ["/", "Inicio"],
                ["/properties", "Propiedades"],
                ["/login", "Iniciar sesión"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  data-transition="full"
                  onClick={() => setOpen(false)}
                  className="font-display text-[44px] font-light tracking-[-0.03em] leading-[1.15] text-[#1e1c1a] no-underline"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <p className="text-[13px] text-[#6b655e]">soporte@realtyhub.com · +57 (604) 123 4567</p>
          </div>
        )}
      </>
    );
  }

  /* ═══════════ EQUIPO (sidebar + barra móvil) ═══════════ */
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  const itemClass = (tab: NavTab) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] no-underline transition-colors duration-200 ${
      activeTab === tab
        ? "bg-[#1e1c1a] text-[#faf8f4]"
        : "text-[#433e39] hover:bg-[#ece6dc]"
    }`;

  const navList = (
    <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Principal">
      {TEAM_GROUPS.map((g) => {
        const items = g.items.filter((i) => !i.managerOnly || isManagerOrAdmin);
        if (!items.length) return null;
        return (
          <div key={g.title} className="mt-6 first:mt-2">
            <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b655e]">{g.title}</p>
            <ul className="space-y-0.5">
              {items.map((i) => (
                <li key={i.tab}>
                  <Link
                    href={i.href}
                    onClick={() => setOpen(false)}
                    className={itemClass(i.tab)}
                    aria-current={activeTab === i.tab ? "page" : undefined}
                  >
                    <i.icon className="shrink-0" />
                    <span className="flex-1">{i.label}</span>
                    {i.tab === "notifications" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b04e42]" aria-label="Hay avisos" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-[#e2dcd2] p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-[#1e1c1a] text-[#faf8f4] flex items-center justify-center font-display text-[16px]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium truncate" title={user.email}>{user.name}</p>
          <span className={`inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleStyle(role)}`}>
            {role || "AGENTE"}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#6b655e] hover:bg-[#ece6dc] hover:text-[#1e1c1a] transition-colors cursor-pointer"
      >
        <I.logout width={16} height={16} />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[248px] flex-col bg-[#faf8f4] border-r border-[#e2dcd2]">
        <div className="h-[72px] px-6 flex items-center shrink-0">
          <BrandLogo />
        </div>
        {navList}
        {account}
      </aside>

      {/* Móvil / tablet: barra superior + cajón */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#f3efe8]/90 backdrop-blur-md border-b border-[#e2dcd2]">
        <div className="h-[64px] px-5 flex items-center justify-between">
          <BrandLogo />
          <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open} className="p-2 -mr-2 cursor-pointer">
            <I.menu width={24} height={24} />
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#1e1c1a]/40" />
          <div className="absolute inset-y-0 left-0 w-[min(86vw,320px)] bg-[#faf8f4] flex flex-col shadow-[0_0_60px_rgba(30,28,26,0.25)]">
            <div className="h-[64px] px-5 flex items-center justify-between shrink-0">
              <BrandLogo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="p-2 -mr-2 cursor-pointer">
                <I.close width={22} height={22} />
              </button>
            </div>
            {navList}
            {account}
          </div>
        </div>
      )}
    </>
  );
}
