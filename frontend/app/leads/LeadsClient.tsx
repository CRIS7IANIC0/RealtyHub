"use client";

/* ─────────────────────────────────────────────────────────────
   LeadsClient — Client Component
   Full CRM Leads UI + manages CreateLeadModal
   ───────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useState } from "react";
import CreateLeadModal from "@/components/leads/CreateLeadModal";
import Navbar from "@/components/Navbar";

// ─── Types ──────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property_id: string;
  source: string;
  status: string;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────

function statusPill(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "Nuevo":
      return { bg: "bg-sky-50", text: "text-sky-700", label: "Nuevo" };
    case "Contactado":
      return { bg: "bg-violet-50", text: "text-violet-700", label: "Contactado" };
    case "Visita":
      return { bg: "bg-amber-50", text: "text-amber-700", label: "Visita" };
    case "Negociacion":
      return { bg: "bg-indigo-50", text: "text-indigo-700", label: "Negociación" };
    case "Cerrado":
      return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Cerrado" };
    case "Perdido":
      return { bg: "bg-[#f7f7f7]", text: "text-[#6a6a6a]", label: "Perdido" };
    default:
      return { bg: "bg-[#f7f7f7]", text: "text-[#6a6a6a]", label: status || "—" };
  }
}

function sourceIcon(source: string): string {
  switch (source) {
    case "Web": return "🌐";
    case "Idealista": return "🏠";
    case "Referido": return "🤝";
    case "Redes Sociales": return "📱";
    case "Teléfono": return "📞";
    default: return "📋";
  }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Deterministic avatar colour by first letter */
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

// ─── SVG Icons ──────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#222222]">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a]">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a] flex-shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6a6a6a] flex-shrink-0">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function LeadCard({ lead }: { lead: Lead }) {
  const pill = statusPill(lead.status);
  const avatar = avatarBg(lead.name);

  return (
    <div className="rounded-[12px] bg-white p-5 transition-transform duration-200 hover:scale-[1.02] cursor-pointer">
      {/* Top row: avatar + name + status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-semibold uppercase flex-shrink-0 ${avatar}`}>
            {lead.name ? lead.name.charAt(0) : "L"}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-[#222222] truncate">
              {lead.name}
            </p>
            <p className="text-[12px] text-[#6a6a6a] mt-0.5">
              {fmtDate(lead.created_at)}
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 ${pill.bg} ${pill.text}`}>
          {pill.label}
        </span>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <IconMail />
          <span className="text-[13px] text-[#6a6a6a] truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconPhone />
          <span className="text-[13px] text-[#6a6a6a]">{lead.phone}</span>
        </div>
      </div>

      {/* Bottom: source + property */}
      <div className="flex items-center justify-between pt-3 border-t border-[#f7f7f7]">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{sourceIcon(lead.source)}</span>
          <span className="text-[12px] text-[#6a6a6a]">{lead.source}</span>
        </div>
        {lead.property_id && lead.property_id !== "sin-asignar" && (
          <span className="text-[11px] text-[#6a6a6a] bg-[#f7f7f7] rounded-full px-2 py-0.5 truncate max-w-[120px]">
            Prop: {lead.property_id.slice(0, 8)}…
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-[12px] bg-white p-5">
      <p className="text-[13px] text-[#6a6a6a] mb-1">{label}</p>
      <p className={`text-[24px] font-semibold ${accent ? "text-[#ff385c]" : "text-[#222222]"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Main Client Component ──────────────────────────────────

export default function LeadsClient({ leads }: { leads: Lead[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  /* Filter */
  const filtered = leads.filter((l) => {
    const matchesSearch =
      !search.trim() ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search);

    const matchesStatus =
      filterStatus === "all" || l.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  /* KPIs */
  const nuevos = leads.filter((l) => l.status === "Nuevo").length;
  const contactados = leads.filter((l) => l.status === "Contactado").length;
  const enNegociacion = leads.filter((l) => l.status === "Negociacion").length;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* ══════════════════════════════════════════════
          TOP NAV — Airbnb Design System con RBAC
          ══════════════════════════════════════════════ */}
      <Navbar activeTab="leads" />

      {/* ══════════════════════════════════════════════
          CANVAS BODY
          ══════════════════════════════════════════════ */}
      <main
        className="w-full max-w-[1400px] mx-auto px-6 md:px-10"
        style={{ paddingTop: "calc(80px + 40px)" }}
      >
        {/* ── Breadcrumb ─────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          <a href="/" className="flex items-center gap-1 text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors no-underline">
            <IconChevronLeft />
            Inicio
          </a>
          <span className="text-[13px] text-[#ebebeb]">/</span>
          <span className="text-[13px] text-[#222222] font-medium">Leads</span>
        </div>

        {/* ── Page header ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-[#f7f7f7]">
              <IconTarget />
            </div>
            <div>
              <h1 className="text-[22px] font-medium tracking-[-0.44px] text-[#222222]">
                CRM de Leads
              </h1>
              <p className="text-[13px] text-[#6a6a6a] mt-0.5">
                Gestiona prospectos y oportunidades de negocio.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#ff385c] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#e0314f] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <IconPlus />
            Nuevo Lead
          </button>
        </div>

        {/* ── KPI strip ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Stat label="Total leads" value={leads.length} />
          <Stat label="Nuevos" value={nuevos} accent />
          <Stat label="Contactados" value={contactados} />
          <Stat label="En negociación" value={enNegociacion} />
        </div>

        {/* ── Filters bar ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="flex items-center gap-2.5 rounded-full border border-[#ebebeb] bg-white px-4 py-2.5 flex-1 max-w-[400px] focus-within:border-[#222222] transition-colors">
            <IconSearch />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[14px] text-[#222222] placeholder:text-[#b0b0b0] w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#6a6a6a] hover:text-[#222222] cursor-pointer text-sm">
                ✕
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: "all", label: "Todos" },
              { value: "Nuevo", label: "Nuevo" },
              { value: "Contactado", label: "Contactado" },
              { value: "Visita", label: "Visita" },
              { value: "Negociacion", label: "Negociación" },
              { value: "Cerrado", label: "Cerrado" },
              { value: "Perdido", label: "Perdido" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                  filterStatus === f.value
                    ? "bg-[#222222] text-white"
                    : "bg-white text-[#6a6a6a] hover:text-[#222222]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Leads Grid ─────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] bg-white py-20 px-8">
            <div className="w-16 h-16 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-4">
              <IconTarget />
            </div>
            <p className="text-[14px] text-[#6a6a6a] mb-1">
              {search || filterStatus !== "all"
                ? "No se encontraron leads con esos filtros."
                : "No hay leads registrados aún."}
            </p>
            {!search && filterStatus === "all" && (
              <p className="text-[13px] text-[#b0b0b0]">
                Usa el botón{" "}
                <span className="font-medium text-[#ff385c]">+ Nuevo Lead</span>{" "}
                para empezar a captar prospectos.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((l) => (
              <LeadCard key={l.id} lead={l} />
            ))}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────── */}
        <footer className="py-10 border-t border-[#ebebeb] mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#6a6a6a]">
              © {new Date().getFullYear()} RealtyHub. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">Soporte</span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">Privacidad</span>
              <span className="text-[13px] text-[#6a6a6a] hover:text-[#222222] transition-colors cursor-pointer">Términos</span>
            </div>
          </div>
        </footer>
      </main>

      {/* ── Modal ────────────────────────────────────── */}
      <CreateLeadModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </div>
  );
}
