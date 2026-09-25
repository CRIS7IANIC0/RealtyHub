"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   CreateLeadModal — Client Component
   Formulario para registrar nuevos prospectos (CRM).
   ───────────────────────────────────────────────────────────── */

import { GATEWAY } from "@/lib/config";

const SOURCES = [
  { value: "Web", label: "Web" },
  { value: "Idealista", label: "Idealista" },
  { value: "Referido", label: "Referido" },
  { value: "Redes Sociales", label: "Redes Sociales" },
  { value: "Teléfono", label: "Teléfono" },
  { value: "Otro", label: "Otro" },
];

const STATUSES = [
  { value: "Nuevo", label: "Nuevo" },
  { value: "Contactado", label: "Contactado" },
  { value: "Visita", label: "Visita programada" },
  { value: "Negociacion", label: "En negociación" },
  { value: "Cerrado", label: "Cerrado" },
  { value: "Perdido", label: "Perdido" },
];

/* ── SVG Icons ────────────────────────────────────────────── */

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/* ── Component ────────────────────────────────────────────── */

export default function CreateLeadModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  /* Form state */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [source, setSource] = useState("Web");
  const [status, setStatus] = useState("Nuevo");

  /* Feedback */
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setPropertyId("");
    setSource("Web");
    setStatus("Nuevo");
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    resetForm();
    setIsOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Ingresa un correo electrónico válido."); return; }
    if (!phone.trim()) { setError("El teléfono es obligatorio."); return; }

    setSubmitting(true);

    try {
      const res = await fetch(`${GATEWAY}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          property_id: propertyId.trim() || "sin-asignar",
          source,
          status,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Error del servidor (${res.status})`);
      }

      resetForm();
      setIsOpen(false);
      startTransition(() => { router.refresh(); });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-[8px] border border-[#ebebeb] bg-white px-4 py-3 text-[14px] text-[#222222] placeholder:text-[#b0b0b0] outline-none transition-colors focus:border-[#222222]";
  const labelClass = "block text-[13px] font-medium text-[#222222] mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.56)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[520px] mx-4 rounded-[16px] bg-white max-h-[90vh] overflow-y-auto"
        style={{ padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] font-medium tracking-[-0.44px] text-[#222222]">
            Nuevo lead
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222] transition-colors cursor-pointer"
          >
            <IconX />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-[8px] bg-[#ff385c]/10 px-4 py-3 text-[13px] font-medium text-[#ff385c]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="lead-name" className={labelClass}>Nombre completo</label>
            <input
              id="lead-name"
              type="text"
              placeholder="Ej: Laura García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lead-email" className={labelClass}>Email</label>
              <input
                id="lead-email"
                type="email"
                placeholder="laura@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="lead-phone" className={labelClass}>Teléfono</label>
              <input
                id="lead-phone"
                type="tel"
                placeholder="+57 300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Property ID */}
          <div>
            <label htmlFor="lead-property" className={labelClass}>
              ID de propiedad{" "}
              <span className="text-[#6a6a6a] font-normal">(opcional)</span>
            </label>
            <input
              id="lead-property"
              type="text"
              placeholder="UUID de la propiedad vinculada"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Source + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lead-source" className={labelClass}>Origen</label>
              <select
                id="lead-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputClass + " appearance-none cursor-pointer"}
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-status" className={labelClass}>Estado</label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass + " appearance-none cursor-pointer"}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#ebebeb]" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-full px-5 py-2.5 text-[14px] font-medium text-[#222222] hover:bg-[#f7f7f7] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-[#ff385c] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#e0314f] transition-colors cursor-pointer disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <IconLoader />
                  Guardando…
                </>
              ) : (
                "Crear lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
