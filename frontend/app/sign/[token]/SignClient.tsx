"use client";

/* ─────────────────────────────────────────────────────────────
   Página pública de firma electrónica (/sign/[token]).
   El token del enlace identifica a la parte firmante; no requiere sesión.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { GATEWAY } from "@/lib/config";
import SignForm, { fmtCop, type SigningInfo } from "@/components/contracts/SignForm";

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SignClient({ token }: { token: string }) {
  const [info, setInfo] = useState<SigningInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<{ fully_signed: boolean; seal: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${GATEWAY}/contracts/sign/${encodeURIComponent(token)}`, { cache: "no-store" });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || "Enlace de firma inválido o vencido.");
        if (!cancelled) setInfo(body);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "No se pudo cargar el contrato.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const done = result || info?.signed;

  return (
    <div className="min-h-screen bg-[#f3efe8] px-4 py-10">
      <div className="mx-auto w-full max-w-[640px]">
        <p className="text-[22px] font-bold text-[#c4584c] tracking-tight mb-6">RealtyHub</p>

        <div className="rounded-[16px] border border-[#e2dcd2] bg-white p-6 sm:p-8">
          {!info && !loadError && <p className="text-[14px] text-[#6b655e]">Cargando contrato…</p>}

          {loadError && (
            <>
              <h1 className="text-[20px] font-semibold text-[#1e1c1a] mb-2">No pudimos abrir este enlace</h1>
              <p className="text-[14px] text-[#6b655e]">{loadError} Pide a tu asesor un enlace nuevo.</p>
            </>
          )}

          {info && (
            <>
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#c4584c] bg-[#c4584c]/10 px-2.5 py-0.5 rounded-full mb-3">
                Firma electrónica
              </span>
              <h1 className="text-[22px] font-semibold text-[#1e1c1a] mb-1">
                Contrato de {info.operation_type.toLowerCase()} · {info.contract_number}
              </h1>
              <p className="text-[14px] text-[#6b655e] mb-5">
                {info.property_title || info.property_address || "Inmueble"}
                {info.city ? ` · ${info.city}` : ""} · {fmtCop(info.price)}
                {info.operation_type === "Alquiler" ? " / mes" : ""}
              </p>

              <ul className="mb-6 divide-y divide-[#ece6dc] rounded-[12px] border border-[#e2dcd2]">
                {info.parties.map((p) => (
                  <li key={p.party_label} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                    <span className="font-medium text-[#1e1c1a]">{p.party_label}</span>
                    <span className={p.signed ? "text-emerald-700 font-medium" : "text-amber-700"}>
                      {p.signed ? `Firmó · ${fmtDate(p.signed_at)}` : "Pendiente de firma"}
                    </span>
                  </li>
                ))}
              </ul>

              {done ? (
                <div className="rounded-[12px] bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-[15px] font-semibold text-emerald-800 mb-1">
                    {result ? "¡Firma registrada!" : `Ya firmaste como ${info.party_label.toLowerCase()}`}
                  </p>
                  <p className="text-[13px] text-emerald-800/90">
                    {(result?.fully_signed ?? info.contract_status === "Firmado")
                      ? "Todas las partes firmaron: el contrato quedó cerrado."
                      : "Cuando la otra parte firme, el contrato quedará cerrado y te avisaremos."}
                    {result?.seal ? ` Código de sello: ${result.seal}.` : ""}
                  </p>
                </div>
              ) : info.contract_status === "Firmado" ? (
                <p className="text-[14px] text-[#6b655e]">Este contrato ya fue firmado por todas las partes.</p>
              ) : (
                <>
                  <p className="text-[14px] text-[#1e1c1a] mb-4">
                    Vas a firmar como <strong>{info.party_label.toLowerCase()}</strong>. Revisa el contrato con tu asesor antes de firmar.
                  </p>
                  <SignForm token={token} info={info} onSigned={setResult} />
                </>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-[#716b63]">
          Tu firma queda sellada con una huella criptográfica ligada al contenido del contrato, la fecha y tu identificación.
        </p>
      </div>
    </div>
  );
}
