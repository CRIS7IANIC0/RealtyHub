import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { pesosEnLetras } from './numero-letras';

export interface PdfContract {
  id: string;
  price: number;
  type: string;
  operation_type: string;
  status: string;
  signed_at: Date | null;
  created_at: Date;
  city: string | null;
  payment_method: string | null;
  deposit: number | null;
  duration_months: number | null;
  start_date: Date | null;
  special_clauses: string | null;
}

export interface PdfContext {
  contract: PdfContract;
  property?: { title?: string; address?: string; city?: string; property_type?: string; description?: string } | null;
  lead?: { name?: string; email?: string; phone?: string } | null;
  agent?: { name?: string; email?: string } | null;
  /** Firmas electrónicas ya registradas (sólo las firmadas). */
  signatures?: PdfSignature[];
  documentHash?: string;
  /** Enlace público de verificación (se muestra como QR en contratos con firmas). */
  verifyUrl?: string;
}

export interface PdfSignature {
  role: string;
  signer_name: string | null;
  signer_document: string | null;
  signer_email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  signature_image: string | null;
  signature_hash: string | null;
  signed_at: Date | null;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
  'octubre', 'noviembre', 'diciembre'];

const fechaLarga = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const BLANK = '______________________________';

const COLOR = {
  ink: '#1e1c1a',
  muted: '#6b655e',
  line: '#e2dcd2',
  accent: '#b04e42',
  night: '#151922',
  sand: '#f3efe8',
  ok: '#2f7d52',
  okSoft: '#e6f2ea',
  warn: '#a8641c',
  warnSoft: '#fbefdc',
};

const fechaHoraBogota = (d: Date) =>
  d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' (hora Colombia)';

/** Navegador / sistema legibles a partir del user-agent. */
function dispositivo(ua?: string | null): string {
  if (!ua) return 'No registrado';
  const nav = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
  const so = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'otro sistema';
  return `${nav} en ${so}`;
}

export async function buildContractPdf(ctx: PdfContext): Promise<Buffer> {
  const { contract: c, property, lead, agent } = ctx;
  const signatures = ctx.signatures ?? [];
  const sigOf = (role: string) => signatures.find((x) => x.role === role);
  const esVenta = (c.operation_type || c.type).toLowerCase() !== 'alquiler';
  const firmado = c.status === 'Firmado';
  const ciudad = c.city || property?.city || BLANK;
  const fechaDoc = c.signed_at ?? c.created_at;
  const numero = `RH-${c.created_at.getFullYear()}-${c.id.slice(0, 8).toUpperCase()}`;
  const titulo = esVenta
    ? 'CONTRATO DE COMPRAVENTA DE BIEN INMUEBLE'
    : 'CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA';
  const parteA = esVenta ? 'EL VENDEDOR' : 'EL ARRENDADOR';
  const parteB = esVenta ? 'EL COMPRADOR' : 'EL ARRENDATARIO';
  const qr = ctx.verifyUrl && signatures.length ? await QRCode.toBuffer(ctx.verifyUrl, { margin: 1, width: 240 }) : null;

  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 92, bottom: 66, left: 66, right: 66 }, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (b: Buffer) => chunks.push(b));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const ensure = (h: number) => {
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage();
  };

  const section = (text: string) => {
    ensure(50);
    doc.moveDown(0.8).font('Helvetica-Bold').fontSize(10.5).fillColor(COLOR.ink).text(text.toUpperCase());
    const y = doc.y + 2;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + width, y).strokeColor(COLOR.line).lineWidth(0.7).stroke();
    doc.moveDown(0.5);
  };

  const field = (label: string, value: string) => {
    ensure(18);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR.muted).text(`${label}: `, { continued: true })
      .font('Helvetica').fillColor(COLOR.ink).text(value || BLANK);
  };

  const clause = (n: number, name: string, body: string) => {
    ensure(60);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.ink).text(`CLÁUSULA ${n}. ${name}. `, { continued: true, align: 'justify' })
      .font('Helvetica').text(body, { align: 'justify' });
    doc.moveDown(0.5);
  };

  // ── Título y resumen (el membrete se dibuja en todas las páginas al final) ──
  doc.font('Helvetica-Bold').fontSize(15).fillColor(COLOR.ink).text(titulo, { align: 'center' });
  doc.moveDown(0.25).font('Helvetica').fontSize(9.5).fillColor(COLOR.muted)
    .text(`Contrato No. ${numero}  ·  ${ciudad}, ${fechaLarga(fechaDoc)}`, { align: 'center' });

  // Insignia de estado
  const badgeText = firmado ? (signatures.length ? 'FIRMADO ELECTRÓNICAMENTE' : 'FIRMADO') : 'PENDIENTE DE FIRMA';
  doc.moveDown(0.6);
  const badgeW = 170;
  const badgeX = doc.page.margins.left + (width - badgeW) / 2;
  const badgeY = doc.y;
  doc.roundedRect(badgeX, badgeY, badgeW, 20, 10).fill(firmado ? COLOR.okSoft : COLOR.warnSoft);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(firmado ? COLOR.ok : COLOR.warn)
    .text(badgeText, badgeX, badgeY + 6, { width: badgeW, align: 'center' });
  doc.x = doc.page.margins.left;
  doc.y = badgeY + 34;

  // Tarjeta de resumen (con QR de verificación si hay firmas)
  const cardY = doc.y;
  const cardH = 92;
  doc.roundedRect(doc.page.margins.left, cardY, width, cardH, 8).lineWidth(0.8).fillAndStroke(COLOR.sand, COLOR.line);
  const textW = qr ? width - 110 : width - 28;
  const row = (label: string, value: string, y: number) => {
    doc.font('Helvetica').fontSize(8).fillColor(COLOR.muted).text(label.toUpperCase(), doc.page.margins.left + 14, y, { width: textW });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.ink).text(value || BLANK, doc.page.margins.left + 14, y + 10, { width: textW, lineBreak: false, ellipsis: true });
  };
  row('Inmueble', property?.title || property?.address || '', cardY + 12);
  row(esVenta ? 'Precio de venta' : 'Canon mensual', cop(c.price), cardY + 40);
  row('Intermediario', agent?.name ? `${agent.name} · RealtyHub` : 'RealtyHub', cardY + 66);
  if (qr) {
    const qx = doc.page.margins.left + width - 88;
    doc.image(qr, qx, cardY + 8, { width: 68 });
    doc.font('Helvetica').fontSize(6.5).fillColor(COLOR.muted).text('Escanea para verificar', qx - 6, cardY + 78, { width: 80, align: 'center' });
  }
  doc.x = doc.page.margins.left;
  doc.y = cardY + cardH + 8;

  // ── Partes ───────────────────────────────────────────────
  section('I. Identificación de las partes');
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.ink).text(parteA);
  field('Nombre o razón social', BLANK);
  field('Documento de identidad / NIT', BLANK);
  field('Domicilio y teléfono', BLANK);
  doc.moveDown(0.5).font('Helvetica-Bold').fontSize(10).fillColor(COLOR.ink).text(parteB);
  field('Nombre o razón social', lead?.name || '');
  field('Documento de identidad / NIT', BLANK);
  field('Correo electrónico', lead?.email || '');
  field('Teléfono', lead?.phone || '');
  doc.moveDown(0.5).font('Helvetica-Bold').fontSize(10).fillColor(COLOR.ink).text('INTERMEDIARIO INMOBILIARIO');
  field('Agente responsable', agent?.name || '');
  field('Correo electrónico', agent?.email || '');
  field('Intermediado por', 'RealtyHub');

  // ── Inmueble ─────────────────────────────────────────────
  section('II. Identificación del inmueble');
  field('Inmueble', property?.title || '');
  field('Tipo de inmueble', property?.property_type || '');
  field('Dirección', property?.address || '');
  field('Ciudad', property?.city || c.city || '');
  field('Matrícula inmobiliaria No.', BLANK);
  field('Cédula catastral No.', BLANK);
  field('Código de referencia interno', c.id);

  // ── Condiciones económicas ───────────────────────────────
  section('III. Condiciones económicas');
  field(esVenta ? 'Precio de venta' : 'Canon mensual de arrendamiento', `${cop(c.price)} (${pesosEnLetras(c.price)})`);
  if (c.deposit != null && c.deposit > 0) {
    field(esVenta ? 'Arras / anticipo' : 'Depósito en garantía', `${cop(c.deposit)} (${pesosEnLetras(c.deposit)})`);
  }
  field('Forma de pago', c.payment_method || 'Según lo acordado entre las partes');
  if (!esVenta) {
    field('Duración', c.duration_months ? `${c.duration_months} meses` : BLANK);
    field('Fecha de inicio', c.start_date ? fechaLarga(c.start_date) : BLANK);
  }

  // ── Cláusulas ────────────────────────────────────────────
  section('IV. Cláusulas');
  doc.font('Helvetica').fontSize(10).fillColor(COLOR.ink).text(
    `Entre ${parteA} y ${parteB}, identificados como aparece al pie de sus firmas, quienes obran en nombre propio, se celebra el presente contrato, que se regirá por las siguientes cláusulas:`,
    { align: 'justify' },
  );
  doc.moveDown(0.6);

  let n = 1;
  if (esVenta) {
    clause(n++, 'OBJETO', `${parteA} transfiere a título de venta a ${parteB}, quien lo adquiere, el derecho de dominio y la posesión sobre el inmueble descrito en la sección II, con todas sus mejoras, anexidades, usos y servidumbres.`);
    clause(n++, 'PRECIO Y FORMA DE PAGO', `El precio de la venta es de ${pesosEnLetras(c.price)} (${cop(c.price)}), que ${parteB} pagará a ${parteA} en la forma indicada en la sección III. ${c.deposit ? `La suma de ${cop(c.deposit)} se entrega a título de arras y se imputará al precio total.` : ''}`);
    clause(n++, 'TRADICIÓN Y ESCRITURACIÓN', `Las partes se obligan a otorgar la escritura pública de compraventa ante la notaría que de común acuerdo designen y a realizar su registro en la Oficina de Registro de Instrumentos Públicos competente. Los gastos notariales se repartirán conforme a la ley, y los de registro y beneficencia correrán por cuenta de ${parteB}, salvo pacto en contrario.`);
    clause(n++, 'ENTREGA', `${parteA} entregará materialmente el inmueble a ${parteB} en la fecha de otorgamiento de la escritura pública, libre de ocupantes y en el estado en que se encuentra, al día en el pago de impuestos, servicios públicos y cuotas de administración.`);
    clause(n++, 'SANEAMIENTO', `${parteA} garantiza que el inmueble es de su exclusiva propiedad, que no ha sido enajenado por acto anterior, y que se encuentra libre de gravámenes, embargos, demandas civiles, condiciones resolutorias, patrimonio de familia y limitaciones de dominio, y se obliga al saneamiento por evicción y por vicios redhibitorios conforme a la ley.`);
    clause(n++, 'CLÁUSULA PENAL', `El incumplimiento injustificado de cualquiera de las partes dará derecho a la parte cumplida a exigir el pago del diez por ciento (10%) del precio de la venta a título de pena, sin perjuicio de la facultad de exigir el cumplimiento del contrato.`);
  } else {
    clause(n++, 'OBJETO', `${parteA} entrega a título de arrendamiento a ${parteB}, quien lo recibe, el inmueble descrito en la sección II, destinado exclusivamente a vivienda. ${parteB} no podrá cambiar su destinación ni subarrendarlo, total o parcialmente, sin autorización escrita de ${parteA}.`);
    clause(n++, 'CANON Y FORMA DE PAGO', `El canon mensual de arrendamiento es de ${pesosEnLetras(c.price)} (${cop(c.price)}), pagadero por anticipado dentro de los primeros cinco (5) días de cada período, en la forma indicada en la sección III. Vencido el primer año, el canon se reajustará anualmente según el Índice de Precios al Consumidor (IPC), conforme a la Ley 820 de 2003.`);
    if (c.deposit) clause(n++, 'DEPÓSITO EN GARANTÍA', `${parteB} entrega la suma de ${cop(c.deposit)} como depósito, que será devuelto al finalizar el contrato, previa verificación del estado del inmueble y del pago de los servicios públicos, descontando los daños imputables a ${parteB}.`);
    clause(n++, 'DURACIÓN', `El término de duración del contrato es de ${c.duration_months ? `${c.duration_months} meses` : BLANK}, contados a partir del ${c.start_date ? fechaLarga(c.start_date) : BLANK}, prorrogable por períodos iguales salvo aviso escrito de terminación con la antelación prevista en la Ley 820 de 2003.`);
    clause(n++, 'OBLIGACIONES', `${parteB} se obliga a pagar oportunamente el canon y los servicios públicos, conservar el inmueble en buen estado y restituirlo al terminar el contrato. ${parteA} se obliga a entregar el inmueble en estado de servir para el fin convenido y a efectuar las reparaciones necesarias que no sean locativas.`);
    clause(n++, 'CLÁUSULA PENAL', `El incumplimiento de las obligaciones del contrato por cualquiera de las partes causará a su cargo una sanción equivalente a tres (3) cánones mensuales vigentes, sin perjuicio de las demás acciones legales.`);
  }
  clause(n++, 'INTERMEDIACIÓN', `Las partes declaran que el presente negocio fue intermediado por RealtyHub, a través del agente ${agent?.name || BLANK}, y reconocen que este actúa como intermediario sin asumir responsabilidad por las obligaciones que aquí surgen entre ${parteA} y ${parteB}.`);
  if (c.special_clauses?.trim()) clause(n++, 'CLÁUSULAS ESPECIALES', c.special_clauses.trim());
  clause(n++, 'PROTECCIÓN DE DATOS', `Las partes autorizan el tratamiento de sus datos personales para la ejecución de este contrato, de conformidad con la Ley 1581 de 2012 y su normativa reglamentaria.`);
  clause(n++, 'SOLUCIÓN DE CONTROVERSIAS', `Las diferencias que surjan del presente contrato se intentarán resolver mediante arreglo directo y, de no lograrse, mediante conciliación ante un centro de conciliación legalmente reconocido en ${ciudad}, antes de acudir a la jurisdicción ordinaria.`);
  clause(n++, 'LEY APLICABLE Y DOMICILIO', `El contrato se rige por las leyes de la República de Colombia. Para todos los efectos las partes fijan como domicilio contractual la ciudad de ${ciudad}.`);
  clause(n++, 'MÉRITO EJECUTIVO', `El presente documento presta mérito ejecutivo por contener obligaciones claras, expresas y exigibles a cargo de las partes.`);

  doc.font('Helvetica').fontSize(10).fillColor(COLOR.ink).text(
    `Para constancia se firma en ${ciudad}, el ${fechaLarga(fechaDoc)}, en dos (2) ejemplares del mismo tenor.`,
    { align: 'justify' },
  );

  // ── Firmas ───────────────────────────────────────────────
  ensure(190);
  doc.moveDown(1.2);
  const colGap = 18;
  const colW = (width - colGap) / 2;
  const boxH = 128;
  const yBox = doc.y;
  const x1 = doc.page.margins.left;
  const x2 = x1 + colW + colGap;
  ([[x1, parteA, 'PARTE_A', ''], [x2, parteB, 'PARTE_B', lead?.name || '']] as [number, string, string, string][]).forEach(([x, rol, role, nombre]) => {
    const sig = sigOf(role);
    doc.roundedRect(x, yBox, colW, boxH, 8).lineWidth(0.8).fillAndStroke(sig ? '#ffffff' : '#fbfaf7', sig ? COLOR.ok : COLOR.line);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR.muted).text(rol, x + 12, yBox + 10, { width: colW - 24 });
    if (sig?.signature_image) {
      try {
        const png = Buffer.from(sig.signature_image.split(',')[1] ?? '', 'base64');
        doc.image(png, x + 12, yBox + 22, { fit: [colW - 24, 46], align: 'center', valign: 'center' });
      } catch {
        // Imagen corrupta: el certificado de firma al final sigue dejando evidencia
      }
    } else {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#a39d94').text('Pendiente de firma', x + 12, yBox + 40, { width: colW - 24, align: 'center' });
    }
    doc.moveTo(x + 12, yBox + 74).lineTo(x + colW - 12, yBox + 74).strokeColor(COLOR.ink).lineWidth(0.7).stroke();
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR.ink)
      .text(sig?.signer_name || nombre || 'Nombre: ______________________', x + 12, yBox + 80, { width: colW - 24, lineBreak: false, ellipsis: true });
    doc.font('Helvetica').fontSize(8.5).fillColor(COLOR.muted)
      .text(sig?.signer_document ? `C.C. / NIT ${sig.signer_document}` : 'C.C. / NIT: ___________________', x + 12, yBox + 94, { width: colW - 24 });
    if (sig?.signed_at) {
      doc.fontSize(7.5).fillColor(COLOR.ok)
        .text(`Firmado ${sig.signed_at.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })} · sello ${(sig.signature_hash ?? '').slice(0, 10).toUpperCase()}`,
          x + 12, yBox + 108, { width: colW - 24, lineBreak: false, ellipsis: true });
    }
  });
  doc.x = doc.page.margins.left;
  doc.y = yBox + boxH + 14;
  doc.font('Helvetica').fontSize(8.5).fillColor(COLOR.muted).text(
    firmado
      ? `Contrato registrado como FIRMADO en RealtyHub el ${fechaLarga(c.signed_at ?? new Date())}.`
      : 'Contrato PENDIENTE DE FIRMA: este documento no tiene validez hasta ser suscrito por las partes.',
    doc.page.margins.left, doc.y, { width, align: 'center' },
  );

  // ── Certificado de firma electrónica (página propia) ─────
  if (signatures.length) {
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLOR.ink).text('Certificado de firma electrónica');
    doc.moveDown(0.2).font('Helvetica').fontSize(9).fillColor(COLOR.muted)
      .text(`Contrato No. ${numero}`);
    doc.moveDown(0.8).font('Helvetica').fontSize(9).fillColor(COLOR.ink).text(
      'Este certificado deja constancia de que las partes suscribieron el contrato mediante firma electrónica, con el mismo valor jurídico que la firma manuscrita conforme a la Ley 527 de 1999 y el Decreto 2364 de 2012. Cada firma queda sellada con una huella criptográfica ligada al contenido del contrato, a la identidad declarada del firmante y al momento de la firma: si cualquiera de esos datos cambia, el sello deja de verificar.',
      { align: 'justify' },
    );

    section('Integridad del documento');
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR.muted).text('Huella SHA-256 del contrato:');
    doc.font('Courier').fontSize(8.5).fillColor(COLOR.ink).text(ctx.documentHash ?? '—', { width });
    doc.moveDown(0.3);
    if (ctx.verifyUrl) field('Verificación en línea', ctx.verifyUrl);

    section('Firmantes');
    [['PARTE_A', parteA], ['PARTE_B', parteB]].forEach(([role, label]) => {
      const sg = sigOf(role);
      ensure(110);
      const y0 = doc.y;
      doc.roundedRect(doc.page.margins.left, y0, width, 98, 6).lineWidth(0.7).fillAndStroke(sg ? '#ffffff' : '#fbfaf7', COLOR.line);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(sg ? COLOR.ok : COLOR.warn)
        .text(`${label} · ${sg ? 'FIRMÓ' : 'SIN FIRMAR'}`, doc.page.margins.left + 12, y0 + 9, { width: width - 24 });
      const line = (k: string, v: string, y: number) => {
        doc.font('Helvetica').fontSize(8).fillColor(COLOR.muted).text(k, doc.page.margins.left + 12, y, { width: 96, lineBreak: false });
        doc.font('Helvetica').fontSize(8.5).fillColor(COLOR.ink).text(v, doc.page.margins.left + 110, y, { width: width - 124, lineBreak: false, ellipsis: true });
      };
      if (sg) {
        line('Nombre', sg.signer_name ?? '—', y0 + 25);
        line('Documento', sg.signer_document ?? '—', y0 + 37);
        line('Correo', sg.signer_email || 'No registrado', y0 + 49);
        line('Fecha y hora', sg.signed_at ? fechaHoraBogota(sg.signed_at) : '—', y0 + 61);
        line('Origen', `${sg.ip_address || 'IP no registrada'} · ${dispositivo(sg.user_agent)}`, y0 + 73);
        line('Sello', (sg.signature_hash ?? '').slice(0, 48).toUpperCase() + '…', y0 + 85);
      } else {
        doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLOR.muted).text('Esta parte aún no ha firmado.', doc.page.margins.left + 12, y0 + 40);
      }
      doc.x = doc.page.margins.left;
      doc.y = y0 + 108;
    });

    doc.moveDown(0.5).font('Helvetica').fontSize(8).fillColor(COLOR.muted).text(
      'Cómo verificar: escanee el código QR de la primera página o abra el enlace de verificación en línea. El sistema recalcula la huella del contrato y el sello de cada firma y le indica si el documento permanece íntegro.',
      { align: 'justify' },
    );
  }

  // ── Membrete, marca de agua y pie en todas las páginas ───
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const m = doc.page.margins;
    const prev = { top: m.top, bottom: m.bottom };
    m.top = 0;
    m.bottom = 0; // permite escribir en los márgenes sin disparar saltos de página

    // Membrete
    doc.rect(0, 0, doc.page.width, 52).fill(COLOR.night);
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#faf8f4').text('Realty', m.left, 18, { continued: true, lineBreak: false })
      .fillColor('#e7b4a8').text('Hub', { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor('#a8b0c2')
      .text(`Contrato No. ${numero}`, doc.page.width - m.right - 200, 17, { width: 200, align: 'right', lineBreak: false })
      .text(firmado ? 'Documento firmado electrónicamente' : 'Borrador pendiente de firma', doc.page.width - m.right - 200, 29, { width: 200, align: 'right', lineBreak: false });

    // Marca de agua en contratos sin firmar
    if (!firmado) {
      doc.save();
      doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.font('Helvetica-Bold').fontSize(46).fillColor('#000000').fillOpacity(0.045)
        .text('PENDIENTE DE FIRMA', 0, doc.page.height / 2 - 30, { width: doc.page.width, align: 'center', lineBreak: false });
      doc.restore();
    }

    // Pie
    doc.moveTo(m.left, doc.page.height - 48).lineTo(doc.page.width - m.right, doc.page.height - 48).strokeColor(COLOR.line).lineWidth(0.6).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(COLOR.muted).fillOpacity(1)
      .text(
        signatures.length && ctx.documentHash
          ? `${numero}  ·  Huella ${ctx.documentHash.slice(0, 16)}…  ·  Página ${i + 1} de ${range.count}`
          : `${numero}  ·  Página ${i + 1} de ${range.count}`,
        m.left, doc.page.height - 38, { width: doc.page.width - m.left - m.right, align: 'center', lineBreak: false },
      );
    m.top = prev.top;
    m.bottom = prev.bottom;
  }

  doc.end();
  return done;
}
