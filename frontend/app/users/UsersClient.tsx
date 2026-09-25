"use client";

/* ─────────────────────────────────────────────────────────────
   UsersClient — Client Component
   Renders the full Users directory UI + manages CreateUserModal
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import CreateUserModal from "@/components/users/CreateUserModal";
import Navbar from "@/components/Navbar";

// ─── Types ──────────────────────────────────────────────────
interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  office_id: string | number;
}

// ─── Helpers ────────────────────────────────────────────────

/** Role badge — Admin gets brand red, rest are neutral per design system */
function roleBadge(role: string): { bg: string; text: string; label: string } {
  switch (role?.toLowerCase()) {
    case "admin":
      return {
        bg: "bg-[#ff385c]/10",
        text: "text-[#ff385c]",
        label: "Admin",
      };
    case "gerente":
    case "manager":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        label: "Gerente",
      };
    case "agente":
    case "agent":
      return {
        bg: "bg-sky-50",
        text: "text-sky-700",
        label: "Agente",
      };
    default:
      return {
        bg: "bg-[#f7f7f7]",
        text: "text-[#6a6a6a]",
        label: role ? role.charAt(0).toUpperCase() + role.slice(1) : "Agente",
      };
  }
}

/** Avatar background colours (deterministic by first letter) */
function avatarBg(name: string): string {
  const colours = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-orange-100 text-orange-700",
  ];
  const idx = (name?.charCodeAt(0) || 0) % colours.length;
  return colours[idx];
}

/** Map office_id to a human label */
function officeLabel(id: string | number): string {
  const map: Record<string, string> = {
    "oficina-central": "Oficina Central",
    "oficina-norte": "Oficina Norte",
    "oficina-sur": "Oficina Sur",
  };
  return map[String(id)] || `Oficina ${id}`;
}

// ─── SVG Icons ──────────────────────────────────────────────

function IconPlus() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a]"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a] flex-shrink-0"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6a6a6a] flex-shrink-0"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconUsers() {
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
      className="text-[#6a6a6a]"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function UserCard({ user }: { user: User }) {
  const role = roleBadge(user.role);
  const avatar = avatarBg(user.name);

  return (
    <div className="rounded-[12px] bg-white p-5 flex flex-col transition-transform duration-200 hover:scale-[1.02] cursor-pointer">
      {/* Top: Avatar + Name */}
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-semibold uppercase flex-shrink-0 ${avatar}`}
        >
          {user.name ? user.name.charAt(0) : "U"}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#222222] truncate">
            {user.name || "Sin nombre"}
          </p>
          <span
            className={`inline-block mt-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${role.bg} ${role.text}`}
          >
            {role.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mt-auto">
        {user.email && (
          <div className="flex items-center gap-2">
            <IconMail />
            <span className="text-[13px] text-[#6a6a6a] truncate">
              {user.email}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <IconMapPin />
          <span className="text-[13px] text-[#6a6a6a]">
            {officeLabel(user.office_id)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** KPI mini-card */
function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[12px] bg-white p-5">
      <p className="text-[13px] text-[#6a6a6a] mb-1">{label}</p>
      <p
        className={`text-[24px] font-semibold ${
          accent ? "text-[#ff385c]" : "text-[#222222]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main Client Component ──────────────────────────────────

export default function UsersClient({ users }: { users: User[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  /* Filter users by search */
  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.role?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  /* Group by role */
  const admins = filtered.filter((u) => u.role?.toLowerCase() === "admin");
  const gerentes = filtered.filter(
    (u) =>
      u.role?.toLowerCase() === "gerente" ||
      u.role?.toLowerCase() === "manager"
  );
  const agentes = filtered.filter(
    (u) =>
      u.role?.toLowerCase() === "agente" ||
      u.role?.toLowerCase() === "agent" ||
      (!["admin", "gerente", "manager"].includes(u.role?.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════════════════════════════
          TOP NAV — Unified RBAC Navigation
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="users" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY
          ══════════════════════════════════════════════ */}
      <main
        className="w-full max-w-[1400px] mx-auto px-6 md:px-10"
        style={{ paddingTop: "calc(80px + 40px)" }}
      >
        {/* ── Breadcrumb ─────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          <a
            href="/"
            className="flex items-center gap-1 text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors no-underline"
          >
            <IconChevronLeft />
            Inicio
          </a>
          <span className="text-[13px] text-[#ebebeb]">/</span>
          <span className="text-[13px] text-[#222222] font-medium">
            Personal
          </span>
        </div>

        {/* ── Page header ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[#f7f7f7]">
              <IconUsers />
            </div>
            <div>
              <h1 className="text-[22px] font-medium tracking-[-0.44px] text-[#222222]">
                Directorio de Personal
              </h1>
              <p className="text-[13px] text-[#6a6a6a] mt-0.5">
                Administra la jerarquía de tu red inmobiliaria.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#ff385c] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#e0314f] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <IconPlus />
            Nuevo Miembro
          </button>
        </div>

        {/* ── KPI strip ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Stat label="Total" value={users.length} />
          <Stat label="Administradores" value={admins.length} accent />
          <Stat label="Gerentes" value={gerentes.length} />
          <Stat label="Agentes" value={agentes.length} />
        </div>

        {/* ── Search bar ─────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2.5 max-w-[400px] focus-within:border-[#222222] transition-colors">
            <IconSearch />
            <input
              type="text"
              placeholder="Buscar por nombre, email o rol…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[14px] text-[#222222] placeholder:text-[#b0b0b0] w-full"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[#6a6a6a] hover:text-[#222222] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Users grid ─────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] bg-white py-20 px-8">
            <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4">
              <IconUsers />
            </div>
            <p className="text-[14px] text-[#6a6a6a] mb-1">
              {search
                ? "No se encontraron resultados."
                : "No hay personal registrado aún."}
            </p>
            {!search && (
              <p className="text-[13px] text-[#b0b0b0]">
                Usa el botón{" "}
                <span className="font-medium text-[#ff385c]">
                  + Nuevo Miembro
                </span>{" "}
                para empezar.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Admins */}
            {admins.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[16px] font-medium text-[#222222]">
                    Administradores
                  </h2>
                  <span className="text-[12px] font-medium text-[#6a6a6a] bg-[#f7f7f7] rounded-full px-2 py-0.5">
                    {admins.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {admins.map((u) => (
                    <UserCard key={u.id} user={u} />
                  ))}
                </div>
              </section>
            )}

            {/* Gerentes */}
            {gerentes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[16px] font-medium text-[#222222]">
                    Gerentes
                  </h2>
                  <span className="text-[12px] font-medium text-[#6a6a6a] bg-[#f7f7f7] rounded-full px-2 py-0.5">
                    {gerentes.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {gerentes.map((u) => (
                    <UserCard key={u.id} user={u} />
                  ))}
                </div>
              </section>
            )}

            {/* Agentes */}
            {agentes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[16px] font-medium text-[#222222]">
                    Agentes
                  </h2>
                  <span className="text-[12px] font-medium text-[#6a6a6a] bg-[#f7f7f7] rounded-full px-2 py-0.5">
                    {agentes.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {agentes.map((u) => (
                    <UserCard key={u.id} user={u} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────── */}
        <footer className="py-10 border-t border-[#ebebeb] mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6a6a6a]">
              © {new Date().getFullYear()} RealtyHub. Todos los derechos
              reservados.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Soporte
              </span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Privacidad
              </span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">
                Términos
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* ── Modal ────────────────────────────────────── */}
      <CreateUserModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </div>
  );
}
