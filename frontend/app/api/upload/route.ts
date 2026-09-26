import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/* ─────────────────────────────────────────────────────────────
   Next.js API Route: /api/upload

   - Producción (Vercel): si existe BLOB_READ_WRITE_TOKEN, las fotos se suben
     directamente desde el navegador a Vercel Blob. Esta ruta solo emite el
     token de subida (el filesystem de Vercel es de solo lectura).
   - Desarrollo local: sin token, guarda los archivos en public/uploads/.
   ───────────────────────────────────────────────────────────── */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB por foto

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Indica al cliente qué modo de subida usar
export async function GET() {
  return NextResponse.json({ mode: useBlob() ? "blob" : "local" });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  // ── Modo Vercel Blob: generación del token para la subida desde el cliente ──
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as HandleUploadBody;
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        }),
      });
      return NextResponse.json(result);
    } catch (error) {
      console.error("Error al generar token de Vercel Blob:", error);
      return NextResponse.json(
        { error: (error as Error).message || "No se pudo autorizar la subida" },
        { status: 400 }
      );
    }
  }

  // ── Modo local: guardar en public/uploads/ ──
  if (useBlob() || process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "La subida local no está disponible en Vercel. Conecta un Blob Store al proyecto (BLOB_READ_WRITE_TOKEN).",
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();

    // Obtener todos los archivos del formData (clave 'files' o 'file')
    let files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      files = formData.getAll("file") as File[];
    }
    if (!files || files.length === 0) {
      const allValues = Array.from(formData.values());
      files = allValues.filter(
        (v): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron archivos para subir" },
        { status: 400 }
      );
    }

    // Carpeta destino: frontend/public/uploads/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || typeof file === "string" || !file.name) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sanitizar el nombre del archivo y añadir timestamp para evitar colisiones
      const extension = path.extname(file.name) || ".jpg";
      const baseName = path
        .basename(file.name, extension)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 40);

      const uniqueFilename = `${Date.now()}_${i}_${baseName}${extension}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${uniqueFilename}`);
    }

    // Retorna el array de rutas relativas
    return NextResponse.json(uploadedUrls);
  } catch (error) {
    console.error("Error al procesar la subida en /api/upload:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al guardar los archivos en el servidor" },
      { status: 500 }
    );
  }
}
