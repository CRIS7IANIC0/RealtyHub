"use client";

/* ─────────────────────────────────────────────────────────────
   SignaturePad — lienzo para firma manuscrita (mouse, lápiz o dedo).
   Entrega un PNG en data URL (fondo transparente) o null si está vacío.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";

const W = 600;
const H = 200;

export default function SignaturePad({
  onChange,
  disabled = false,
}: {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const ctx = useCallback(() => {
    const c = canvasRef.current?.getContext("2d");
    if (c) {
      c.lineWidth = 3;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = "#111111";
    }
    return c;
  }, []);

  useEffect(() => {
    ctx();
  }, [ctx]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const c = ctx();
    const p = point(e);
    c?.beginPath();
    c?.moveTo(p.x, p.y);
    // Un toque sin arrastre deja un punto
    c?.lineTo(p.x + 0.01, p.y + 0.01);
    c?.stroke();
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const c = ctx();
    const p = point(e);
    c?.lineTo(p.x, p.y);
    c?.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    setEmpty(false);
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  }

  function clear() {
    ctx()?.clearRect(0, 0, W, H);
    setEmpty(true);
    onChange(null);
  }

  return (
    <div>
      <div className="relative rounded-[12px] border border-dashed border-[#a39d94] bg-white">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className="w-full h-[150px] sm:h-[180px] touch-none cursor-crosshair rounded-[12px]"
          aria-label="Área de firma manuscrita"
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] text-[#a39d94]">
            Firma aquí con el mouse o el dedo
          </span>
        )}
        <span className="pointer-events-none absolute left-6 right-6 bottom-8 border-b border-[#e2dcd2]" />
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={clear}
          disabled={empty || disabled}
          className="text-[12px] font-medium text-[#6b655e] underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
        >
          Borrar firma
        </button>
      </div>
    </div>
  );
}
