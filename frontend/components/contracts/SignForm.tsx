"use client";

/* ─────────────────────────────────────────────────────────────
   SignForm — formulario de firma electrónica de UNA parte del contrato.
   Lo usan la página pública /sign/[token] y el modal de firmas del panel.
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { GATEWAY } from "@/lib/config";
import SignaturePad from "./SignaturePad";

export interface SigningInfo {
  contract_number: string;
  operation_type: string;
  price: number;
  property_title: string | null;
  property_address: string | null;
  city: string | null;
  role: string;
  party_label: string;
  suggested_name: string;
  suggested_email: string;
  signed: boolean;
  signed_at: string | null;
  signer_name: string | null;
  contract_status: string;
  parties: { party_label: string; signed: boolean; signed_at: string | null }[];
}

export function fmtCop(n: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

const inputClass =
  "w-full rounded-[8px] border border-[#cfc7ba] bg-white px-3.5 py-2.5 text-[14px] text-[#1e1c1a] outline-none focus:border-[#1e1c1a] transition-colors";

export default function SignForm({
  token,
  info,
  onSigned,
}: {
  token: string;
  info: SigningInfo;
  onSigned: (result: { fully_signed: boolean; seal: string }) => void;
}) {
  const [name, setName] = useState(info.suggested_name);
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState(info.suggested_email);
  const [accept, setAccept] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 3) return setError("Escribe tu nombre completo.");
    if (document.trim().length < 5) return setError("Escribe tu número de documento.");
    if (!image) return setError("Dibuja tu firma en el recuadro.");
    if (!accept) return setError("Debes aceptar firmar electrónicamente.");

    setBusy(true);
    try {
      const res = await fetch(`${GATEWAY}/contracts/sign/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_name: name.trim(),
          signer_document: document.trim(),
          signer_email: email.trim(),
          signature_image: image,
          accept: true,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || `No se pudo registrar la firma (${res.status})`);
      onSigned(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la firma.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[12px] font-medium text-[#6b655e] mb-1">Nombre completo</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="block">
          <span className="block text-[12px] font-medium text-[#6b655e] mb-1">Documento (C.C. / NIT)</span>
          <input
            className={inputClass}
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            inputMode="numeric"
            placeholder="Ej. 1.045.123.456"
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-[12px] font-medium text-[#6b655e] mb-1">Correo electrónico (opcional)</span>
        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>

      <div>
        <span className="block text-[12px] font-medium text-[#6b655e] mb-1">Firma manuscrita</span>
        <SignaturePad onChange={setImage} disabled={busy} />
      </div>

      <label className="flex items-start gap-2.5 text-[13px] text-[#444] leading-snug cursor-pointer">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 accent-[#c4584c]" />
        <span>
          Declaro que he leído el contrato y acepto sus términos. Reconozco que esta firma electrónica tiene el mismo valor que mi
          firma manuscrita (Ley 527 de 1999 y Decreto 2364 de 2012).
        </span>
      </label>

      {error && <p className="text-[13px] text-[#a64739]">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-[#c4584c] hover:bg-[#a64739] text-white text-[14px] font-semibold py-3 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? "Registrando firma…" : `Firmar como ${info.party_label.toLowerCase()}`}
      </button>
    </form>
  );
}
