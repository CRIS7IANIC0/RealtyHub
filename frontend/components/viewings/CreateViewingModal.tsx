"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   CreateViewingModal — Client Component
   Formulario simplificado: Propiedad, Lead y Fecha/Hora.
   La visita se crea en estado 'Pendiente' en el Pool de Visitas.
   ───────────────────────────────────────────────────────────── */

import { GATEWAY } from "@/lib/config";

/* ── SVG Icons ────────────────────────────────────────────── */

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 shrink-0 mt-0.5">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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

export interface PropertyOption {
  id: string;
  title?: string;
  address?: string;
}

export interface LeadOption {
  id: string;
  name?: string;
  email?: string;
}

/* ── Component ────────────────────────────────────────────── */

export default function CreateViewingModal({
  isOpen,
  setIsOpen,
  properties = [],
  leads = [],
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  properties?: PropertyOption[];
  leads?: LeadOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  /* Form state: Solo Propiedad, Lead y Fecha */
  const [propertyId, setPropertyId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  /* Feedback */
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setPropertyId("");
    setLeadId("");
    setScheduledAt("");
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

    if (!propertyId.trim()) {
      setError("El ID de la propiedad es obligatorio.");
      return;
    }
    if (!leadId.trim()) {
      setError("El ID del prospecto (lead) es obligatorio.");
      return;
    }
    if (!scheduledAt) {
      setError("Debes seleccionar una fecha y hora para la visita.");
      return;
    }

    setSubmitting(true);

    try {
      // Normalizar la fecha a ISO string para garantizar precisión
      const isoDate = new Date(scheduledAt).toISOString();

      const res = await fetch(`${GATEWAY}/viewings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId.trim(),
          lead_id: leadId.trim(),
          scheduled_at: isoDate,
          status: "Pendiente",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body?.message ||
          (res.status === 400
            ? "La propiedad ya tiene una visita en ese horario"
            : `Error del servidor (${res.status})`);
        throw new Error(message);
      }

      resetForm();
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado al agendar la visita.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-[8px] border border-[#e2dcd2] bg-white px-4 py-3 text-[14px] text-[#1e1c1a] placeholder:text-[#a39d94] outline-none transition-colors focus:border-[#1e1c1a]";
  const labelClass = "block text-[13px] font-medium text-[#1e1c1a] mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.56)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[540px] rounded-[16px] bg-white max-h-[92vh] overflow-y-auto"
        style={{ padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e2dcd2] mb-6">
          <div>
            <h2 className="text-[20px] font-bold text-[#1e1c1a] tracking-tight">
              Agendar Nueva Visita
            </h2>
            <p className="text-[13px] text-[#6b655e] mt-0.5">
              Conecta un prospecto con una propiedad. Ingresará al pool en estado &apos;Pendiente&apos;.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6b655e] hover:bg-[#f3efe8] hover:text-[#1e1c1a] transition-colors cursor-pointer"
          >
            <IconX />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-[10px] bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3">
            <IconAlertTriangle />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-rose-800">
                Conflicto al agendar
              </p>
              <p className="text-[13px] text-rose-700 mt-0.5 leading-snug">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Formulario: Solo Propiedad, Lead y Fecha */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Propiedad (ID o Selector) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-[#1e1c1a]">
                Propiedad <span className="text-[#c4584c]">*</span>
              </label>
              {properties.length > 0 && (
                <span className="text-[11px] text-[#6b655e]">
                  {properties.length} disponibles
                </span>
              )}
            </div>

            {properties.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Seleccionar propiedad --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.address || p.id} ({p.id.slice(0, 8)}…)
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-[#6b655e] flex items-center gap-1">
                  <span>O escribe el UUID exacto:</span>
                  <input
                    type="text"
                    placeholder="Escribir ID manual..."
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="flex-1 bg-[#f3efe8] px-2 py-1 rounded text-[12px] border border-[#e2dcd2] text-[#1e1c1a] outline-none focus:border-[#1e1c1a]"
                  />
                </div>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Ej. e3b0c442-98fc-1c14-9afbf4c8996fb924"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className={inputClass}
                required
              />
            )}
          </div>

          {/* Lead (ID o Selector) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-[#1e1c1a]">
                Prospecto (Lead) <span className="text-[#c4584c]">*</span>
              </label>
              {leads.length > 0 && (
                <span className="text-[11px] text-[#6b655e]">
                  {leads.length} registrados
                </span>
              )}
            </div>

            {leads.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Seleccionar lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name || l.email || l.id} ({l.id.slice(0, 8)}…)
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-[#6b655e] flex items-center gap-1">
                  <span>O escribe el UUID exacto:</span>
                  <input
                    type="text"
                    placeholder="Escribir ID manual..."
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="flex-1 bg-[#f3efe8] px-2 py-1 rounded text-[12px] border border-[#e2dcd2] text-[#1e1c1a] outline-none focus:border-[#1e1c1a]"
                  />
                </div>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Ej. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className={inputClass}
                required
              />
            )}
          </div>

          {/* Fecha y Hora (datetime-local) */}
          <div>
            <label className={labelClass}>
              Fecha y Hora de la Visita <span className="text-[#c4584c]">*</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClass}
              required
            />
            <p className="text-[11px] text-[#6b655e] mt-1">
              El sistema validará automáticamente que la propiedad no tenga otra visita agendada en ese horario.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2dcd2] mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-full border border-[#e2dcd2] px-5 py-2.5 text-[14px] font-medium text-[#1e1c1a] hover:bg-[#f3efe8] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-[#b04e42] hover:bg-[#a64739] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors disabled:opacity-50 shadow-sm cursor-pointer active:scale-95"
            >
              {submitting && <IconLoader />}
              {submitting ? "Agendando..." : "Confirmar Visita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
