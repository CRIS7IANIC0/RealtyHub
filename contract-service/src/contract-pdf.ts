import PDFDocument from 'pdfkit';
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
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
  'octubre', 'noviembre', 'diciembre'];

const fechaLarga = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const BLANK = '______________________________';

const COLOR = { ink: '#222222', muted: '#6a6a6a', line: '#d9d9d9', accent: '#ff385c' };

export function buildContractPdf(ctx: PdfContext): Promise<Buffer> {
  const { contract: c, property, lead, agent } = ctx;
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

  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 70, bottom: 70, left: 70, right: 70 }, bufferPages: true });
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

  // ── Encabezado ───────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLOR.accent).text('RealtyHub', { continued: true })
    .font('Helvetica').fontSize(9).fillColor(COLOR.muted).text(`    Gestión inmobiliaria`, { align: 'left' });
  doc.moveDown(0.8).font('Helvetica-Bold').fontSize(14).fillColor(COLOR.ink).text(titulo, { align: 'center' });
  doc.moveDown(0.3).font('Helvetica').fontSize(9.5).fillColor(COLOR.muted)
    .text(`Contrato No. ${numero}   ·   Estado: ${firmado ? 'FIRMADO' : 'PENDIENTE DE FIRMA'}`, { align: 'center' });
  doc.text(`${ciudad}, ${fechaLarga(fechaDoc)}`, { align: 'center' });

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
  ensure(150);
  doc.moveDown(3);
  const yFirma = doc.y;
  const colW = (width - 40) / 2;
  const x1 = doc.page.margins.left;
  const x2 = x1 + colW + 40;
  [[x1, parteA, ''], [x2, parteB, lead?.name || '']].forEach(([x, rol, nombre]) => {
    doc.moveTo(x as number, yFirma).lineTo((x as number) + colW, yFirma).strokeColor(COLOR.ink).lineWidth(0.8).stroke();
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR.ink).text(rol as string, x as number, yFirma + 6, { width: colW });
    doc.font('Helvetica').fontSize(9).fillColor(COLOR.muted)
      .text(nombre ? `${nombre}` : 'Nombre: ______________________', x as number, doc.y, { width: colW })
      .text('C.C. / NIT: ___________________', x as number, doc.y, { width: colW });
  });
  doc.x = doc.page.margins.left;
  doc.moveDown(2);
  doc.font('Helvetica').fontSize(9).fillColor(COLOR.muted).text(
    firmado
      ? `Contrato registrado como FIRMADO en RealtyHub el ${fechaLarga(c.signed_at ?? new Date())}.`
      : 'Contrato PENDIENTE DE FIRMA: este documento no tiene validez hasta ser suscrito por las partes.',
    doc.page.margins.left, doc.y, { width, align: 'center' },
  );

  // ── Pie de página con numeración ─────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const prevBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // permite escribir en el margen sin disparar un salto de página
    doc.font('Helvetica').fontSize(8).fillColor(COLOR.muted).text(
      `${numero}  ·  Página ${i + 1} de ${range.count}`,
      doc.page.margins.left, doc.page.height - 45, { width, align: 'center', lineBreak: false },
    );
    doc.page.margins.bottom = prevBottom;
  }

  doc.end();
  return done;
}
