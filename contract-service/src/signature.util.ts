import { createHash, createHmac, randomBytes } from 'crypto';

export const SIGNATURE_ROLES = ['PARTE_A', 'PARTE_B'] as const;
export type SignatureRole = (typeof SIGNATURE_ROLES)[number];

/** Etiqueta de cada parte según el tipo de operación. */
export function partyLabel(role: string, esVenta: boolean): string {
  if (role === 'PARTE_A') return esVenta ? 'EL VENDEDOR' : 'EL ARRENDADOR';
  return esVenta ? 'EL COMPRADOR' : 'EL ARRENDATARIO';
}

function secret(): string {
  return process.env.SIGNATURE_SECRET || process.env.JWT_SECRET || 'realtyhub-dev-signature-secret';
}

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export const newSignToken = () => randomBytes(24).toString('hex');

interface HashableContract {
  id: string;
  property_id: string;
  lead_id: string;
  agent_id: string;
  price: number;
  operation_type: string;
  city: string | null;
  payment_method: string | null;
  deposit: number | null;
  duration_months: number | null;
  start_date: Date | null;
  special_clauses: string | null;
}

/** Huella SHA-256 de los términos del contrato: si cambian, las firmas dejan de verificar. */
export function contractHash(c: HashableContract): string {
  return sha256(
    JSON.stringify([
      c.id,
      c.property_id,
      c.lead_id,
      c.agent_id,
      c.price,
      c.operation_type,
      c.city,
      c.payment_method,
      c.deposit,
      c.duration_months,
      c.start_date ? c.start_date.toISOString() : null,
      c.special_clauses,
    ]),
  );
}

export interface SignatureFields {
  document_hash: string;
  role: string;
  signer_name: string;
  signer_document: string;
  signer_email: string | null;
  signed_at: Date;
  signature_image: string;
}

/** HMAC que sella la firma: liga al firmante, la imagen, la fecha y el contenido del contrato. */
export function signatureSeal(f: SignatureFields): string {
  return createHmac('sha256', secret())
    .update(
      [
        f.document_hash,
        f.role,
        f.signer_name,
        f.signer_document,
        f.signer_email ?? '',
        f.signed_at.toISOString(),
        sha256(f.signature_image),
      ].join('|'),
    )
    .digest('hex');
}

const PNG_DATA_URL = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/;
export const MAX_SIGNATURE_BYTES = 300 * 1024;

/** Devuelve el buffer del PNG o null si el data URL no es válido / es demasiado grande. */
export function decodeSignatureImage(dataUrl: unknown): Buffer | null {
  if (typeof dataUrl !== 'string') return null;
  const m = PNG_DATA_URL.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length === 0 || buf.length > MAX_SIGNATURE_BYTES) return null;
  // Firma PNG: 89 50 4E 47
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  return buf;
}
