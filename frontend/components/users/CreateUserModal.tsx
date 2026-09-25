"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   CreateUserModal — Client Component
   Formulario interactivo para registrar nuevos miembros.
   ───────────────────────────────────────────────────────────── */

const GATEWAY = "http://localhost:3000";

/* Oficinas disponibles (hardcoded para esta fase) */
const OFFICES = [
  { value: "oficina-central", label: "Oficina Central" },
  { value: "oficina-norte", label: "Oficina Norte" },
  { value: "oficina-sur", label: "Oficina Sur" },
];

/* Roles disponibles */
const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "agente", label: "Agente" },
];

/* ── Inline SVG Icons ─────────────────────────────────────── */

function IconX() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/* ── Component ────────────────────────────────────────────── */

export default function CreateUserModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /* Form state */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agente");
  const [officeId, setOfficeId] = useState("oficina-central");

  /* Submission feedback */
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ── Reset form ──────────────────────────────────────────── */
  function resetForm() {
    setName("");
    setEmail("");
    setRole("agente");
    setOfficeId("oficina-central");
    setError(null);
  }

  /* ── Close handler ───────────────────────────────────────── */
  function handleClose() {
    if (submitting) return; // prevent close while submitting
    resetForm();
    setIsOpen(false);
  }

  /* ── Submit handler ──────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    /* Basic validation */
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${GATEWAY}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          office_id: officeId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message || `Error del servidor (${res.status})`
        );
      }

      /* Success → close modal, reset form, refresh server data */
      resetForm();
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Don't render anything if closed ─────────────────────── */
  if (!isOpen) return null;

  /* ── Input class helper ──────────────────────────────────── */
  const inputClass =
    "w-full rounded-[8px] border border-[#ebebeb] bg-white px-4 py-3 text-[14px] text-[#222222] placeholder:text-[#b0b0b0] outline-none transition-colors focus:border-[#222222]";

  const labelClass =
    "block text-[13px] font-medium text-[#222222] mb-1.5";

  return (
    /* ── Backdrop ───────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.56)" }}
      onClick={handleClose}
    >
      {/* ── Modal container ──────────────────────────────────── */}
      <div
        className="relative w-full max-w-[480px] mx-4 rounded-[16px] bg-white"
        style={{ padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] font-medium tracking-[-0.44px] text-[#222222]">
            Nuevo miembro
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222] transition-colors cursor-pointer"
          >
            <IconX />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-[8px] bg-[#ff385c]/10 px-4 py-3 text-[13px] font-medium text-[#ff385c]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="user-name" className={labelClass}>
              Nombre completo
            </label>
            <input
              id="user-name"
              type="text"
              placeholder="Ej: Carlos Méndez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="user-email" className={labelClass}>
              Correo electrónico
            </label>
            <input
              id="user-email"
              type="email"
              placeholder="carlos@realtyhub.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="user-role" className={labelClass}>
              Rol
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass + " appearance-none cursor-pointer"}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Office */}
          <div>
            <label htmlFor="user-office" className={labelClass}>
              Oficina
            </label>
            <select
              id="user-office"
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              className={inputClass + " appearance-none cursor-pointer"}
            >
              {OFFICES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
                "Crear miembro"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
