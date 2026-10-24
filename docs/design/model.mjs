export const entities = [
  { id: 'alias-juli', type: 'alias', value: 'juli.martinez.mp', x: 445, y: 245 },
  { id: 'phone', type: 'telefono', value: '3415551234', x: 235, y: 160 },
  { id: 'cvu', type: 'cvu', value: '0000003100012345678901', x: 610, y: 105 },
  { id: 'cbu', type: 'cbu', value: '0720000720001234567890', x: 660, y: 355 },
  { id: 'cuit', type: 'cuit', value: '20123456786', x: 185, y: 365 },
  { id: 'link', type: 'link', value: 'anses-bono.com', x: 415, y: 430 },
];
const provinces = ['Santa Fe', 'Buenos Aires', 'Córdoba', 'Mendoza', 'Entre Ríos'];
export const reports = Array.from({ length: 30 }, (_, i) => ({
  id: 180 + i,
  province: provinces[i % 5],
  ageDays: i === 0 ? 0 : i % 19,
  label: i % 4 === 0 ? 'Falso organismo' : 'Familiar con número nuevo',
  risk: i % 4 === 0 ? 88 : 95,
  entities: i < 23 ? ['alias-juli', ...(i % 3 === 0 ? [entities[1 + i % 5].id] : [])] : [entities[1 + i % 5].id],
}));
export function filterReports({ province = '', days = 90 } = {}) {
  return reports.filter(r => (!province || r.province === province) && r.ageDays < days);
}
export function entitySummary(id, source = reports) {
  const entity = entities.find(e => e.id === id);
  if (!entity) return null;
  const matches = source.filter(r => r.entities.includes(id));
  return { ...entity, reports: matches.length, provinces: [...new Set(matches.map(r => r.province))], matches };
}
export function searchEntities(query) {
  const q = query.trim().toLocaleLowerCase('es-AR');
  return entities.filter(e => e.value.toLocaleLowerCase('es-AR').includes(q));
}
export function validatePerson(name, phone) {
  const cleanName = name.trim();
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('549') && digits.length === 13) digits = digits.slice(3);
  else if (digits.startsWith('54') && digits.length === 12) digits = digits.slice(2);
  if (!cleanName || cleanName.length > 60) return { ok: false, error: 'Ingresá un nombre de hasta 60 caracteres.' };
  if (digits.length !== 10) return { ok: false, error: 'Ingresá un teléfono argentino con código de área y 10 dígitos.' };
  return { ok: true, name: cleanName, phone: digits };
}
export function toCSV(rows) {
  const cell = v => `"${String(v).replaceAll('"', '""')}"`;
  return [['Reporte', 'Provincia', 'Modalidad', 'Riesgo'], ...rows.map(r => [r.id, r.province, r.label, r.risk])].map(row => row.map(cell).join(',')).join('\r\n');
}

// Guiones y riesgos precalculados de web/lib/demo.ts, sin requests ni inferencia.
export const demoScenarios = [
  { id: 'familiar', label: 'El número nuevo', sender: 'Juli', detail: 'Número desconocido', messages: ['Hola abu, soy Juli. Cambié de número, agendame este.', 'Choqué el auto. Necesito plata urgente, no le digas a mamá.', 'Mandame $180.000 a juli.martinez.mp. Mañana te lo devuelvo.'], risk: 94, entity: 'juli.martinez.mp', alert: 'No transfieras. Llamá a Juli a su número de siempre.', familyAlert: 'Marta recibió un pedido de plata de alguien que dice ser Juli. Llamala antes de que transfiera.', signals: ['Número nuevo', 'Urgencia y secreto', 'Pedido de plata'] },
  { id: 'anses', label: 'El falso ANSES', sender: 'ANSES', detail: 'Número desconocido', messages: ['Buenas tardes. Tiene un refuerzo de $85.000 pendiente de cobro.', 'Para liberarlo debe transferir $5.000 de validación antes de las 18 hs.'], risk: 88, entity: '0000003100012345678901', alert: 'No transfieras. ANSES no pide plata para cobrar un beneficio.', familyAlert: 'Un falso ANSES le pidió un pago a Marta para cobrar un beneficio. Avisale que no transfiera.', signals: ['Suplanta a ANSES', 'Pago para cobrar', 'Plazo urgente'] },
  { id: 'normal', label: 'Una charla normal', sender: 'Carla, vecina', detail: 'Contacto de confianza', messages: ['Hola, ¿tenés el número del plomero? Se me rompió la canilla.'], risk: 4, entity: null, alert: null, familyAlert: null, signals: [] },
];
export function demoResult(id) { return demoScenarios.find(s => s.id === id) || null; }
