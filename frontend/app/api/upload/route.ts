import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/* ─────────────────────────────────────────────────────────────
   Next.js API Route: /api/upload
   Manejo de subida local de archivos múltiples en public/uploads/
   ───────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
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
