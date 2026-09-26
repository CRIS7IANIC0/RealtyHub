"use client";

/* ─────────────────────────────────────────────────────────────
   CreatePropertyModal — Client Component
   Formulario con subida local de múltiples imágenes (/api/upload)
   y persistencia en el backend a través del API Gateway.
   ───────────────────────────────────────────────────────────── */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

import { GATEWAY } from "@/lib/config";

const STATUSES = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
];

/* ── Inline SVG Icons ─────────────────────────────────────── */

function IconX() {
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
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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

export default function CreatePropertyModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  /* Form state */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("disponible");

  /* Archivos e imágenes */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  /* Submission feedback */
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ── Reset form ──────────────────────────────────────────── */
  function resetForm() {
    setTitle("");
    setDescription("");
    setAddress("");
    setPrice("");
    setStatus("disponible");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
  }

  /* ── Close handler ───────────────────────────────────────── */
  function handleClose() {
    if (submitting) return;
    resetForm();
    setIsOpen(false);
  }

  /* ── Manejo de Archivos ─────────────────────────────────── */
  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  }

  function handleRemoveFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  /* ── Submit handler ──────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    /* Validaciones */
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!address.trim()) {
      setError("La dirección es obligatoria.");
      return;
    }
    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setError("Ingresa un precio válido mayor a 0.");
      return;
    }

    setSubmitting(true);

    try {
      let uploadedImages: string[] = [];

      // 1. Si hay archivos seleccionados, subirlos (Vercel Blob en producción, disco en local)
      const uploadMode = selectedFiles.length > 0
        ? await fetch("/api/upload").then((r) => r.json()).then((d) => d.mode).catch(() => "local")
        : null;

      if (uploadMode === "blob") {
        const blobs = await Promise.all(
          selectedFiles.map((file) =>
            upload(`properties/${file.name}`, file, {
              access: "public",
              handleUploadUrl: "/api/upload",
            })
          )
        );
        uploadedImages = blobs.map((b) => b.url);
      } else if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => null);
          throw new Error(uploadErr?.error || "Error al subir las imágenes.");
        }

        const uploadData = await uploadRes.json();
        uploadedImages = Array.isArray(uploadData)
          ? uploadData
          : uploadData.urls || [];
      }

      // 2. Hacer POST al API Gateway con images: uploadedImages
      const res = await fetch(`${GATEWAY}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          address: address.trim(),
          price: numPrice,
          status,
          images: uploadedImages,
          image_url: uploadedImages[0] || "",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message || `Error del servidor (${res.status})`
        );
      }

      /* Success */
      resetForm();
      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al guardar la propiedad."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Don't render if closed ──────────────────────────────── */
  if (!isOpen) return null;

  /* ── Shared classes ──────────────────────────────────────── */
  const inputClass =
    "w-full rounded-[10px] border border-[#ebebeb] bg-white px-4 py-3 text-[14px] text-[#222222] placeholder:text-[#b0b0b0] outline-none transition-colors focus:border-[#222222]";

  const labelClass = "block text-[13px] font-medium text-[#222222] mb-1.5";

  return (
    /* ── Backdrop ───────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.56)" }}
      onClick={handleClose}
    >
      {/* ── Modal container ──────────────────────────────────── */}
      <div
        className="relative w-full max-w-[560px] rounded-[20px] bg-white max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebebeb] mb-6">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-[#222222]">
              Nueva propiedad
            </h2>
            <p className="text-[13px] text-[#6a6a6a] mt-0.5">
              Registra un nuevo inmueble en el catálogo con fotos locales.
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

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-[10px] bg-rose-50 border border-rose-200 px-4 py-3 text-[13px] font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="prop-title" className={labelClass}>
              Título del inmueble <span className="text-[#ff385c]">*</span>
            </label>
            <input
              id="prop-title"
              type="text"
              required
              placeholder="Ej: Apartamento Exclusivo en El Poblado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="prop-address" className={labelClass}>
              Dirección <span className="text-[#ff385c]">*</span>
            </label>
            <input
              id="prop-address"
              type="text"
              required
              placeholder="Cra 43A #1-50, Medellín"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="prop-desc" className={labelClass}>
              Descripción
            </label>
            <textarea
              id="prop-desc"
              placeholder="Describe las características principales del inmueble, distribución, amenidades y acabados…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Price + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prop-price" className={labelClass}>
                Precio (COP) <span className="text-[#ff385c]">*</span>
              </label>
              <input
                id="prop-price"
                type="number"
                min="0"
                step="any"
                required
                placeholder="350000000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prop-status" className={labelClass}>
                Estado Inicial
              </label>
              <select
                id="prop-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass + " appearance-none cursor-pointer"}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subida de Múltiples Imágenes Locales */}
          <div>
            <label className={labelClass}>
              Fotografías del Inmueble (Múltiples archivos locales)
            </label>
            <label
              htmlFor="prop-files-input"
              className="border-2 border-dashed border-gray-300 hover:border-[#ff385c] rounded-[14px] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-rose-50/20 text-center"
            >
              <IconUpload />
              <p className="text-[13px] font-semibold text-gray-700 mt-2">
                Haz clic para seleccionar fotos locales
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                PNG, JPG o WEBP. Puedes seleccionar múltiples archivos a la vez.
              </p>
              <input
                id="prop-files-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>

            {/* Previsualización en miniaturas */}
            {previewUrls.length > 0 && (
              <div className="mt-3">
                <p className="text-[12px] font-semibold text-gray-600 mb-2">
                  {previewUrls.length} {previewUrls.length === 1 ? "foto seleccionada" : "fotos seleccionadas"}:
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-gray-100 rounded-lg">
                  {previewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border border-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Vista previa ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-[#ff385c] text-white flex items-center justify-center text-xs opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Eliminar foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[#ebebeb] pt-2" />

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
              className="flex items-center gap-2 rounded-full bg-[#ff385c] hover:bg-[#e00b41] px-6 py-2.5 text-[14px] font-semibold text-white transition-all cursor-pointer shadow-sm disabled:opacity-70 active:scale-95"
            >
              {submitting ? (
                <>
                  <IconLoader />
                  <span>Subiendo y guardando…</span>
                </>
              ) : (
                <span>Crear propiedad</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
