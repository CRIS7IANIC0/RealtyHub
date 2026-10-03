/* Ciudades y municipios principales de Colombia (capitales departamentales
   y municipios de mayor población/actividad inmobiliaria). */
export const COLOMBIA_CITIES: string[] = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Soacha", "Soledad",
  "Bucaramanga", "Bello", "Villavicencio", "Ibagué", "Santa Marta", "Valledupar", "Manizales",
  "Pereira", "Montería", "Neiva", "Pasto", "Armenia", "Popayán", "Sincelejo", "Itagüí", "Floridablanca",
  "Envigado", "Palmira", "Buenaventura", "Tuluá", "Tunja", "Barrancabermeja", "Dosquebradas", "Riohacha",
  "Maicao", "Girón", "Piedecuesta", "Florencia", "Yopal", "Quibdó", "Sogamoso", "Duitama", "Girardot",
  "Facatativá", "Zipaquirá", "Chía", "Cajicá", "Mosquera", "Funza", "Madrid", "Fusagasugá", "Sopó",
  "La Calera", "Tocancipá", "Gachancipá", "Cota", "Tenjo", "Tabio", "Villeta", "Ubaté", "Briceño",
  "Rionegro", "Sabaneta", "La Estrella", "Caldas", "Copacabana", "Girardota", "Barbosa", "Marinilla",
  "El Retiro", "La Ceja", "Guarne", "El Carmen de Viboral", "Santa Fe de Antioquia", "Apartadó",
  "Turbo", "Caucasia", "Carepa", "Chigorodó", "Jericó", "Jardín", "Andes", "Santa Rosa de Osos",
  "Jamundí", "Yumbo", "Cartago", "Buga", "Sevilla", "Candelaria", "Florida", "Pradera", "Zarzal",
  "Roldanillo", "Calima", "Guadalajara de Buga", "Ginebra", "Dagua", "La Cumbre", "Santander de Quilichao",
  "Puerto Tejada", "Tumaco", "Ipiales", "Túquerres", "Tumaco", "Villa del Rosario", "Los Patios", "Ocaña",
  "Pamplona", "Tibú", "San Gil", "Socorro", "Barichara", "Málaga", "Vélez", "Lebrija", "Rionegro (Santander)",
  "Sabana de Torres", "Puerto Wilches", "Aguachica", "Ciénaga", "Fundación", "Aracataca", "El Banco",
  "Zona Bananera", "Taganga", "Santa Ana", "Plato", "Magangué", "Turbaco", "Arjona", "Mompós", "El Carmen de Bolívar",
  "Malambo", "Sabanalarga", "Baranoa", "Puerto Colombia", "Galapa", "Sabanagrande", "Santo Tomás",
  "Corozal", "Sampués", "Tolú", "Coveñas", "Lorica", "Cereté", "Sahagún", "Planeta Rica", "Montelíbano",
  "Tierralta", "Ayapel", "Puerto Libertador", "Ciénaga de Oro", "Montería", "Pueblo Nuevo", "San Pelayo",
  "Uribia", "Manaure", "Fonseca", "San Juan del Cesar", "Villanueva", "Aguazul", "Paz de Ariporo", "Tauramena",
  "Acacías", "Granada", "Puerto López", "Puerto Gaitán", "Arauca", "Saravena", "Tame", "Puerto Carreño",
  "Leticia", "Mocoa", "Puerto Asís", "Orito", "Inírida", "Mitú", "San José del Guaviare", "San Andrés", "Providencia",
  "Chiquinquirá", "Paipa", "Villa de Leyva", "Nobsa", "Moniquirá", "Garagoa", "Puerto Boyacá", "Samacá",
  "Honda", "Mariquita", "Espinal", "Melgar", "Chaparral", "Líbano", "Flandes", "Guamo", "Purificación",
  "La Dorada", "Chinchiná", "Villamaría", "Anserma", "Riosucio", "Santa Rosa de Cabal", "La Virginia",
  "Quimbaya", "Montenegro", "Calarcá", "La Tebaida", "Circasia", "Salento", "Filandia", "Armenia",
  "Pitalito", "Garzón", "La Plata", "Campoalegre", "Rivera", "Aipe", "Timbío", "Santander de Quilichao",
  "El Bordo", "Piendamó", "Silvia", "Tumaco", "La Unión", "Samaniego", "Sandoná", "Chachagüí",
  "Istmina", "Tadó", "Bahía Solano", "Nuquí", "Condoto", "Acandí", "Necoclí", "San Antero", "San Bernardo del Viento",
].filter((c, i, a) => a.indexOf(c) === i).sort((a, b) => a.localeCompare(b, "es"));

/** Minúsculas y sin tildes, para que "bo" encuentre "Bogotá". */
export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Ciudades que coinciden: primero las que empiezan por el texto, luego las que lo contienen. */
export function searchCities(query: string, limit = 8): string[] {
  const q = normalizeText(query);
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const c of COLOMBIA_CITIES) {
    const n = normalizeText(c);
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}
