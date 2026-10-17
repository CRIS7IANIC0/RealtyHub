"use client";

/* ─────────────────────────────────────────────────────────────
   SignaturesModal — firma digital de un contrato desde el panel.
   Cada parte (vendedor/arrendador y comprador/arrendatario) puede firmar aquí
   mismo o desde un enlace privado enviado por el agente.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { GATEWAY } from "@/lib/config";
import SignForm, { type SigningInfo } from "./SignForm";

interface PartyState {
  role: string;
  party_label: string;
  token: string;
  signed: boolean;
  signer_name: string | null;
  signer_document: string | null;
  signed_at: string | null;
}

interface SignaturesState {
  contract_id: string;
  status: string;
  document_hash: string;
  property_title: string | null;
  lead_name: string | null;
  signatures: PartyState[];
}

interface Verification {
  valid: boolean;
  signatures: { role: string; signer_name: string | null; valid: boolean }[];
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function authHeader(): Record<string, string> {
  try {
    const token = JSON.parse(localStorage.getItem("user") ?? "null")?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export default function SignaturesModal({
  contractId,
  onClose,
  onChanged,
}: {
  contractId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [state, setState] = useState<SignaturesState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState<{ party: PartyState; info: SigningInfo } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Cambiar `reload` vuelve a pedir el estado de las firmas
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${GATEWAY}/contracts/${contractId}/signatures`, { headers: authHeader(), cache: "no-store" });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || `No se pudo cargar las firmas (${res.status})`);
        if (!cancelled) setState(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar las firmas.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [contractId, reload]);

  async function startSigning(party: PartyState) {
    setError(null);
    try {
      const res = await fetch(`${GATEWAY}/contracts/sign/${party.token}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "No se pudo abrir la firma.");
      setSigning({ party, info: body });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la firma.");
    }
  }

  async function copyLink(party: PartyState) {
    const url = `${window.location.origin}/sign/${party.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(party.role);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt("Copia el enlace de firma:", url);
    }
  }

  async function verify() {
    setVerifying(true);
    try {
      const res = await fetch(`${GATEWAY}/contracts/${contractId}/verify`, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "No se pudo verificar.");
      setVerification(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0, 0, 0, 0.56)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-[16px] bg-white p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Firma digital del contrato"
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="text-[18px] font-semibold text-[#1e1c1a]">Firma digital</h2>
          <button type="button" onClick={onClose} className="text-[#6b655e] hover:text-[#1e1c1a] text-[20px] leading-none cursor-pointer" aria-label="Cerrar">
            ×
          </button>
        </div>
        <p className="text-[13px] text-[#6b655e] mb-5">
          {state?.property_title || "Contrato"}
          {state?.lead_name ? ` · ${state.lead_name}` : ""}. Cuando ambas partes firmen, el contrato pasa a Firmado y se generan comisiones, notificaciones y métricas.
        </p>

        {error && <p className="mb-4 rounded-[8px] border border-[#e2dcd2] px-3 py-2 text-[13px] text-[#a64739]">{error}</p>}
        {!state && !error && <p className="text-[14px] text-[#6b655e]">Cargando…</p>}

        {state && !signing && (
          <>
            <ul className="space-y-3">
              {state.signatures.map((p) => (
                <li key={p.role} className="rounded-[12px] border border-[#e2dcd2] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#1e1c1a]">{p.party_label}</p>
                      {p.signed ? (
                        <p className="text-[12px] text-emerald-700 mt-0.5">
                          Firmó {p.signer_name} (doc. {p.signer_document}) · {fmtDate(p.signed_at)}
                        </p>
                      ) : (
                        <p className="text-[12px] text-amber-700 mt-0.5">
                          {state.status === "Firmado" ? "Sin firma digital (contrato registrado manualmente)" : "Pendiente de firma"}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        p.signed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.signed ? "Firmado" : "Pendiente"}
                    </span>
                  </div>
                  {!p.signed && state.status !== "Firmado" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startSigning(p)}
                        className="rounded-full bg-[#c4584c] hover:bg-[#a64739] text-white text-[13px] font-medium px-4 py-2 transition-colors cursor-pointer"
                      >
                        Firmar ahora
                      </button>
                      <button
                        type="button"
                        onClick={() => copyLink(p)}
                        className="rounded-full border border-[#e2dcd2] hover:border-[#1e1c1a] text-[#1e1c1a] text-[13px] font-medium px-4 py-2 transition-colors cursor-pointer"
                      >
                        {copied === p.role ? "¡Enlace copiado!" : "Copiar enlace de firma"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-[12px] bg-[#f3efe8] p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#6b655e] mb-1">Huella SHA-256 del contrato</p>
              <p className="font-mono text-[11px] text-[#1e1c1a] break-all">{state.document_hash}</p>
              {state.signatures.some((s) => s.signed) && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={verify}
                    disabled={verifying}
                    className="rounded-full border border-[#1e1c1a] text-[#1e1c1a] text-[12px] font-semibold px-4 py-1.5 hover:bg-[#1e1c1a] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? "Verificando…" : "Verificar integridad"}
                  </button>
                  {verification && (
                    <span className={`text-[12px] font-medium ${verification.valid ? "text-emerald-700" : "text-[#a64739]"}`}>
                      {verification.valid ? "✔ Firmas íntegras: el contrato no fue alterado" : "✖ Las firmas no coinciden con el contrato"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {signing && (
          <>
            <button
              type="button"
              onClick={() => setSigning(null)}
              className="mb-3 text-[13px] text-[#6b655e] hover:text-[#1e1c1a] cursor-pointer"
            >
              ← Volver a las firmas
            </button>
            <SignForm
              token={signing.party.token}
              info={signing.info}
              onSigned={() => {
                setSigning(null);
                setVerification(null);
                setReload((n) => n + 1);
                onChanged();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
