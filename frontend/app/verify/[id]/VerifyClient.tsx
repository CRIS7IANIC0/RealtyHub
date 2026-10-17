"use client";

/* ─────────────────────────────────────────────────────────────
   Verificación pública de un contrato firmado (destino del QR del PDF).
   Recalcula en el servidor la huella del contrato y el sello de cada firma.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { GATEWAY } from "@/lib/config";

interface Verification {
  contract_id: string;
  document_hash: string;
  valid: boolean;
  signatures: { role: string; signer_name: string | null; signed_at: string | null; valid: boolean }[];
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });
}

export default function VerifyClient({ contractId }: { contractId: string }) {
  const [data, setData] = useState<Verification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`${GATEWAY}/contracts/${encodeURIComponent(contractId)}/verify`, { cache: "no-store" });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "No encontramos este contrato.");
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo verificar.");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  const hasSignatures = !!data && data.signatures.length > 0;

  return (
    <div className="min-h-screen bg-[#f3efe8] px-4 py-10">
      <div className="mx-auto w-full max-w-[560px]">
        <p className="text-[22px] font-bold text-[#1e1c1a] tracking-tight mb-6">
          Realty<span className="text-[#b04e42]">Hub</span>
        </p>
        <div className="rounded-[16px] border border-[#e2dcd2] bg-white p-6 sm:p-8">
          <h1 className="text-[22px] font-semibold text-[#1e1c1a] mb-4">Verificación de contrato</h1>
          {!data && !error && <p className="text-[14px] text-[#6b655e]">Verificando…</p>}
          {error && <p className="text-[14px] text-[#a64739]">{error}</p>}

          {data && !hasSignatures && (
            <p className="rounded-[12px] bg-amber-50 border border-amber-200 p-4 text-[14px] text-amber-800">
              Este contrato todavía no tiene firmas electrónicas registradas.
            </p>
          )}

          {data && hasSignatures && (
            <>
              <div
                className={`rounded-[12px] border p-4 mb-5 ${
                  data.valid ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <p className="text-[16px] font-semibold">
                  {data.valid ? "✔ Documento íntegro" : "✖ Las firmas no coinciden con el contrato"}
                </p>
                <p className="text-[13px] mt-1">
                  {data.valid
                    ? "El contenido del contrato no ha sido alterado desde que se firmó."
                    : "El contrato fue modificado después de firmarse o una firma fue alterada."}
                </p>
              </div>
              <ul className="divide-y divide-[#ece6dc] rounded-[12px] border border-[#e2dcd2] mb-5">
                {data.signatures.map((s) => (
                  <li key={s.role} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                    <div className="min-w-0">
                      <p className="font-medium text-[#1e1c1a] truncate">{s.signer_name}</p>
                      <p className="text-[#6b655e]">{fmtDate(s.signed_at)}</p>
                    </div>
                    <span className={`shrink-0 font-semibold ${s.valid ? "text-emerald-700" : "text-red-700"}`}>
                      {s.valid ? "Firma válida" : "Firma alterada"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[#6b655e] break-all">
                Huella SHA-256: <span className="font-mono">{data.document_hash}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
