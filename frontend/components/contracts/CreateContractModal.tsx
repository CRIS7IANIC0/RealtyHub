"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   CreateContractModal — Client Component
   Strict Airbnb Design System · RealtyHub Contract Service
   Formulario con inputs para property_id, lead_id, agent_id,
   price, select de type y select de status.
   ───────────────────────────────────────────────────────────── */

import { GATEWAY } from "@/lib/config";

export const OPERATION_TYPE_OPTIONS = [
  { value: "Venta", label: "Venta" },
  { value: "Alquiler", label: "Alquiler" },
];

export const TYPE_OPTIONS = OPERATION_TYPE_OPTIONS;

export const STATUS_OPTIONS = [
  { value: "Borrador", label: "Borrador" },
  { value: "Firmado", label: "Firmado" },
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

function IconCheckCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

export interface AgentOption {
  id: string;
  name?: string;
  role?: string;
}

export default function CreateContractModal({
  isOpen,
  setIsOpen,
  properties = [],
  leads = [],
  agents = [],
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  properties?: PropertyOption[];
  leads?: LeadOption[];
  agents?: AgentOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  /* Form state */
  const [propertyId, setPropertyId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [price, setPrice] = useState("");
  const [operationType, setOperationType] = useState("Venta");
  const [status, setStatus] = useState("Borrador");

  /* Feedback */
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setPropertyId("");
    setLeadId("");
    setAgentId("");
    setPrice("");
    setOperationType("Venta");
    setStatus("Borrador");
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

    const trimmedProp = propertyId.trim();
    const trimmedLead = leadId.trim();
    const trimmedAgent = agentId.trim();
    const parsedPrice = parseFloat(price);

    if (!trimmedProp) {
      setError("El ID de la propiedad (property_id) es obligatorio.");
      return;
    }
    if (!trimmedLead) {
      setError("El ID del prospecto/cliente (lead_id) es obligatorio.");
      return;
    }
    if (!trimmedAgent) {
      setError("El ID del agente inmobiliario (agent_id) es obligatorio.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Ingresa un precio válido mayor a 0.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${GATEWAY}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: trimmedProp,
          lead_id: trimmedLead,
          agent_id: trimmedAgent,
          price: parsedPrice,
          operation_type: operationType,
          type: operationType,
          status,
          ...(status === "Firmado" ? { signed_at: new Date().toISOString() } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Error del servidor (${res.status})`);
      }

      resetForm();
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado al registrar el contrato.");
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
        className="relative w-full max-w-[540px] mx-4 rounded-[16px] bg-white max-h-[90vh] overflow-y-auto"
        style={{ padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebebeb] mb-6">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.44px] text-[#222222]">
              Nuevo Contrato
            </h2>
            <p className="text-[13px] text-[#6a6a6a] mt-0.5">
              Registra el cierre de venta o alquiler con emisión de eventos
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222] transition-colors cursor-pointer"
          >
            <IconX />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 rounded-[8px] bg-[#ff385c]/10 border border-[#ff385c]/20 px-4 py-3 text-[13px] font-medium text-[#ff385c]">
            {error}
          </div>
        )}

        {/* Info Banner when Firmado */}
        {status === "Firmado" && (
          <div className="mb-5 rounded-[8px] bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5">
            <IconCheckCircle />
            <div className="text-[12px] text-emerald-900 leading-snug">
              <strong className="font-semibold block">Evento RabbitMQ automático</strong>
              Al registrar este contrato con estado <strong>Firmado</strong>, se emitirá automáticamente el evento <code className="bg-emerald-100 px-1 py-0.5 rounded text-[11px]">contract.signed</code> para liquidar comisiones, notificar al equipo y actualizar métricas.
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property ID Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="contract-property-id" className="text-[13px] font-medium text-[#222222]">
                ID de Propiedad (property_id) <span className="text-[#ff385c]">*</span>
              </label>
              {properties.length > 0 && (
                <span className="text-[11px] text-[#6a6a6a]">
                  {properties.length} disponibles
                </span>
              )}
            </div>
            <input
              id="contract-property-id"
              type="text"
              list="properties-list"
              placeholder="Ej: prop-101 o selecciona una del listado"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className={inputClass}
              autoFocus
            />
            {properties.length > 0 && (
              <datalist id="properties-list">
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.address || p.id}
                  </option>
                ))}
              </datalist>
            )}
          </div>

          {/* Lead ID + Agent ID grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="contract-lead-id" className="text-[13px] font-medium text-[#222222]">
                  ID del Lead (lead_id) <span className="text-[#ff385c]">*</span>
                </label>
              </div>
              <input
                id="contract-lead-id"
                type="text"
                list="leads-list"
                placeholder="Ej: lead-202"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className={inputClass}
              />
              {leads.length > 0 && (
                <datalist id="leads-list">
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name ? `${l.name} (${l.email || l.id})` : l.id}
                    </option>
                  ))}
                </datalist>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="contract-agent-id" className="text-[13px] font-medium text-[#222222]">
                  ID del Agente (agent_id) <span className="text-[#ff385c]">*</span>
                </label>
              </div>
              <input
                id="contract-agent-id"
                type="text"
                list="agents-list"
                placeholder="Ej: agent-303"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className={inputClass}
              />
              {agents.length > 0 && (
                <datalist id="agents-list">
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name ? `${a.name} (${a.role || "Agente"})` : a.id}
                    </option>
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label htmlFor="contract-price" className={labelClass}>
              Precio Pactado (price en COP) <span className="text-[#ff385c]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[#6a6a6a]">
                $
              </span>
              <input
                id="contract-price"
                type="number"
                step="any"
                min="0"
                placeholder="250000000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${inputClass} pl-8 font-medium`}
              />
            </div>
          </div>

          {/* Type and Status selects */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label htmlFor="contract-operation-type" className={labelClass}>
                Tipo de Operación
              </label>
              <select
                id="contract-operation-type"
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {OPERATION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contract-status" className={labelClass}>
                Estado del Contrato
              </label>
              <select
                id="contract-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${inputClass} cursor-pointer font-medium ${
                  status === "Firmado" ? "text-emerald-700 font-semibold" : "text-[#222222]"
                }`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#ebebeb] mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-full text-[14px] font-medium text-[#222222] hover:bg-[#f7f7f7] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ff385c] hover:bg-[#d90b3e] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-none"
            >
              {submitting ? (
                <>
                  <IconLoader />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Contrato</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
