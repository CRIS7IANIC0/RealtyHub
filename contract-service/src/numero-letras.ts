const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis',
  'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos',
  'setecientos', 'ochocientos', 'novecientos'];

function menorMil(n: number): string {
  if (n === 100) return 'cien';
  if (n < 30) return UNIDADES[n];
  if (n < 100) {
    const u = n % 10;
    return DECENAS[Math.floor(n / 10)] + (u ? ` y ${UNIDADES[u]}` : '');
  }
  const resto = n % 100;
  return CENTENAS[Math.floor(n / 100)] + (resto ? ` ${menorMil(resto)}` : '');
}

const apocopar = (t: string) => t.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

function enteroALetras(n: number): string {
  if (n === 0) return 'cero';
  const partes: string[] = [];
  const millonesDeMillones = Math.floor(n / 1_000_000_000_000);
  const milesDeMillones = Math.floor((n % 1_000_000_000_000) / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  if (millonesDeMillones) {
    partes.push(millonesDeMillones === 1 ? 'un billón' : `${enteroALetras(millonesDeMillones)} billones`);
  }
  if (milesDeMillones) {
    partes.push(milesDeMillones === 1 ? 'un millón' : `${apocopar(enteroALetras(milesDeMillones))} millones`);
  }
  if (miles) {
    partes.push(miles === 1 ? 'mil' : `${apocopar(menorMil(miles))} mil`);
  }
  if (resto) partes.push(menorMil(resto));
  return partes.join(' ');
}

/** 1500000 → "UN MILLÓN QUINIENTOS MIL PESOS M/CTE" */
export function pesosEnLetras(monto: number): string {
  const n = Math.round(monto);
  const texto = enteroALetras(n);
  const de = n !== 0 && n % 1_000_000 === 0 ? ' de' : '';
  return `${texto}${de} pesos m/cte`.toUpperCase();
}
