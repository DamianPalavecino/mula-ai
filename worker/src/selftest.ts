/**
 * Smoke test sin red: entities + filter + heurística + armado de alertas.
 * Uso: npm run selftest
 */
import { armarAlertas } from './alerts.js';
import { clasificarHeuristico } from './classify.js';
import { completarCbu, detectarEntidades, validarCbu } from './entities.js';
import { debeAnalizar } from './filter.js';
import { normalizarTelefono } from './phone.js';

let ok = 0;
let fail = 0;
function check(nombre: string, cond: boolean, detalle?: unknown): void {
  if (cond) ok++;
  else fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${nombre}${!cond && detalle !== undefined ? `  → ${JSON.stringify(detalle)}` : ''}`);
}
const tiene = (texto: string, tipo: string, valor: string) =>
  detectarEntidades(texto).some((e) => e.tipo === tipo && e.valor === valor);

const DEMO = 'hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá a juli.martinez.mp';

// --- entities ---
check('demo extrae juli.martinez.mp', tiene(DEMO, 'alias', 'juli.martinez.mp'), detectarEntidades(DEMO));
check('demo no inventa otras entidades', detectarEntidades(DEMO).length === 1, detectarEntidades(DEMO));

const cbu = completarCbu('28505909' .slice(0, 7) + '4009041813520');
check('completarCbu genera CBU válido', validarCbu(cbu), cbu);
check('CBU de ejemplo conocido valida', validarCbu('2850590940090418135201'));
check('CBU válido se detecta', tiene(`Transferí al CBU ${cbu} porfa`, 'cbu', cbu), detectarEntidades(`CBU ${cbu}`));
const cbuEspacios = `${cbu.slice(0, 4)} ${cbu.slice(4, 8)} ${cbu.slice(8, 12)}-${cbu.slice(12)}`;
check('CBU con espacios/guiones se detecta', tiene(`cbu: ${cbuEspacios}`, 'cbu', cbu), detectarEntidades(cbuEspacios));
const malo = cbu.slice(0, 21) + String((Number(cbu[21]) + 1) % 10);
check('CBU con verificador inválido NO se detecta', !detectarEntidades(`CBU ${malo}`).some((e) => e.tipo === 'cbu'), detectarEntidades(malo));
const cvu = completarCbu('0000003' + '1000012345678');
check('CVU (000...) se detecta como cvu', tiene(`mi cvu es ${cvu}`, 'cvu', cvu), detectarEntidades(cvu));

check('mail no es alias', !detectarEntidades('escribime a juli.martinez@gmail.com').some((e) => e.tipo === 'alias'), detectarEntidades('escribime a juli.martinez@gmail.com'));
check('URL no es alias', !detectarEntidades('mirá https://www.mercadolibre.com.ar/oferta').some((e) => e.tipo === 'alias'));
check('dominio suelto no es alias', !detectarEntidades('entrá a anses.gob.ar ya').some((e) => e.tipo === 'alias'), detectarEntidades('entrá a anses.gob.ar ya'));
check('"150.000" no es alias', !detectarEntidades('son 150.000 nomás').some((e) => e.tipo === 'alias'));
check('"hola...che" no es alias', !detectarEntidades('hola...che como andas').some((e) => e.tipo === 'alias'));
check('alias sin punto precedido de "alias"', tiene('mi alias es gatito2024 mandame', 'alias', 'gatito2024'), detectarEntidades('mi alias es gatito2024'));
check('alias con dos puntos y punto final', tiene('Alias: casa.roja.mp.', 'alias', 'casa.roja.mp'), detectarEntidades('Alias: casa.roja.mp.'));
check('palabra común sin punto no es alias', !detectarEntidades('necesito dinero urgente hermano').some((e) => e.tipo === 'alias'));

check('teléfono +54 9 341 555-1234', tiene('llamame al +54 9 341 555-1234', 'telefono', '+54 9 341 555-1234'), detectarEntidades('llamame al +54 9 341 555-1234'));
check('teléfono 011 15 5555-1234', detectarEntidades('mi nuevo es 011 15 5555-1234').some((e) => e.tipo === 'telefono'), detectarEntidades('mi nuevo es 011 15 5555-1234'));
check('DNI de 8 dígitos no es teléfono', !detectarEntidades('mi dni 30123456').some((e) => e.tipo === 'telefono'));

check('monto $ 150.000', tiene('mandame $ 150.000', 'monto', '150000'), detectarEntidades('mandame $ 150.000'));
check('monto 150 mil', tiene('son 150 mil', 'monto', '150000'), detectarEntidades('son 150 mil'));
check('monto 150k', tiene('necesito 150k', 'monto', '150000'), detectarEntidades('necesito 150k'));
check('monto $2,5 millones', tiene('$2,5 millones', 'monto', '2500000'), detectarEntidades('$2,5 millones'));
check('monto 80.000 pesos', tiene('80.000 pesos', 'monto', '80000'), detectarEntidades('80.000 pesos'));

// --- phone ---
check('normalizar 5493415551234', normalizarTelefono('5493415551234') === '3415551234', normalizarTelefono('5493415551234'));
check('normalizar 0341 15 555-1234', normalizarTelefono('0341 15 555-1234') === '3415551234', normalizarTelefono('0341 15 555-1234'));
check('normalizar +54 9 11 5555-1234', normalizarTelefono('+54 9 11 5555-1234') === '1155551234', normalizarTelefono('+54 9 11 5555-1234'));

// --- filter ---
const confianza = new Set(['3415551234']);
check('"jaja dale" no se analiza', !debeAnalizar('3410000000', 'jaja dale', confianza));
check('"jajajaja" no se analiza', !debeAnalizar('3410000000', 'jajajaja', confianza));
check('emoji solo no se analiza', !debeAnalizar('3410000000', '😂😂', confianza));
check('vacío/sticker no se analiza', !debeAnalizar('3410000000', '', confianza));
check('contacto de confianza nunca', !debeAnalizar('3415551234', DEMO, confianza));
check('desconocido con la demo se analiza', debeAnalizar('3410000000', DEMO, confianza));
check('desconocido sin número resuelto se analiza', debeAnalizar(null, DEMO, confianza));
check('"urgente" corto se analiza', debeAnalizar('3410000000', 'urgente!!', confianza));
check('alias suelto se analiza', debeAnalizar('3410000000', 'juli.martinez.mp', confianza));
check('"hola" suelto no se analiza', !debeAnalizar('3410000000', 'hola', confianza));
const solo = new Set(['3410000000']);
check('ANALIZAR_SOLO: número de la lista se analiza', debeAnalizar('3410000000', DEMO, confianza, solo));
check('ANALIZAR_SOLO: número fuera de la lista no', !debeAnalizar('3419999999', DEMO, confianza, solo));
check('ANALIZAR_SOLO: sin número resuelto no', !debeAnalizar(null, DEMO, confianza, solo));
check('ANALIZAR_SOLO vacío: comportamiento normal', debeAnalizar('3419999999', DEMO, confianza, new Set()));

// --- heurística + alertas ---
const h = clasificarHeuristico(DEMO, { protegido: 'la abuela' });
check('heurística: demo sospechosa', h.es_sospechoso && h.riesgo >= 70, h);
check('heurística: modalidad familiar_numero_nuevo', h.modalidad === 'familiar_numero_nuevo', h.modalidad);
check('heurística: suplanta a Juli', h.suplanta_a === 'Juli', h.suplanta_a);
const hn = clasificarHeuristico('che te paso el alias para la vaquita del asado del sábado: asado.amigos.mp', {});
check('heurística: vaquita del asado no sospechosa', !hn.es_sospechoso, hn);

const alertas = armarAlertas(
  { ...h, monto: null },
  [
    {
      entidad_id: 12,
      tipo: 'alias',
      valor_normalizado: 'juli.martinez.mp',
      encontrada: true,
      reportes: 23,
      provincias: ['Santa Fe', 'Córdoba', 'Buenos Aires', 'Mendoza', 'Tucumán'],
      modalidades: ['familiar_numero_nuevo'],
      ultimo: null,
      monto_total: null,
    },
  ],
);
console.log('\n--- alerta persona ---\n' + alertas.persona + '\n--- alerta familia ---\n' + alertas.familia + '\n');
check('alerta persona menciona 23 reportes en 5 provincias', alertas.persona.includes('23 reportes en 5 provincias'));
check('alerta persona pide llamar a Juli', alertas.persona.includes('Llamá a Juli al número de siempre'), alertas.persona);
check('alerta familia menciona alias y reportes', alertas.familia.includes('juli.martinez.mp (23 reportes)'));

console.log(`\n${ok} ok · ${fail} fallas`);
process.exit(fail ? 1 : 0);
