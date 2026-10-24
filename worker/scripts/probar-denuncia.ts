/**
 * Manda el PDF de denuncia de muestra (caso juli.martinez.mp) a un número, por Kapso.
 * Uso (en el VPS, con las vars del worker):
 *   set -a; . ~/.config/mula-ai/worker.conf; set +a; npx tsx scripts/probar-denuncia.ts 549341xxxxxxx
 * Sin número, solo escribe denuncia-muestra.pdf. Kapso solo entrega si ese número le escribió en las últimas 24 h.
 */
import { writeFileSync } from 'node:fs';
import { documentoKapso } from '../src/alerts.js';
import { clasificarHeuristico } from '../src/classify.js';
import { pdfDenuncia } from '../src/denuncia.js';

const numero = process.argv[2];
const DEMO = 'hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá 150 mil a juli.martinez.mp';
const juli = {
  entidad_id: 12, tipo: 'alias' as const, valor_normalizado: 'juli.martinez.mp', encontrada: true, reportes: 24,
  provincias: ['Santa Fe', 'Córdoba', 'Buenos Aires', 'Mendoza', 'Tucumán'], modalidades: ['familiar_numero_nuevo'],
  ultimo: null, monto_total: 2350000,
};
const pdf = await pdfDenuncia({
  c: { ...clasificarHeuristico(DEMO, { protegido: 'Abuela Marta' }), monto: 150000 },
  resumenes: [juli, { ...juli, entidad_id: 13, tipo: 'telefono', valor_normalizado: '3415551234', reportes: 1, provincias: ['Santa Fe'], monto_total: null }],
  texto: DEMO,
  remitente: '3415551234',
  protegido: 'Abuela Marta',
  provincia: 'Santa Fe',
});
writeFileSync('denuncia-muestra.pdf', pdf);
console.log(`denuncia-muestra.pdf (${pdf.length} bytes)`);
if (numero) {
  const { KAPSO_API_KEY: key, KAPSO_PHONE_NUMBER_ID: id } = process.env;
  if (!key || !id) throw new Error('faltan KAPSO_API_KEY / KAPSO_PHONE_NUMBER_ID');
  await documentoKapso(key, id)(numero, pdf, 'denuncia-mula-prueba.pdf', '📄 Prueba: reporte para la denuncia (Mula AI)');
  console.log(`enviado a ${numero} por Kapso`);
}
