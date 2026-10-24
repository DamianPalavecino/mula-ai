/**
 * Smoke test sin red: entities + filter + heurística + armado de alertas.
 * Uso: npm run selftest
 */
import { armarAlertas, entidadPrincipal, lineaRed } from './alerts.js';
import { clasificar, clasificarHeuristico, conPresupuesto } from './classify.js';
import { config } from './config.js';
import { DisconnectReason } from '@whiskeysockets/baileys';
import { decidirReconexion } from './reconnect.js';
import { clave, completarCbu, cuitValido, detectarEntidades, validarCbu } from './entities.js';
import { debeAnalizar, esMensajePrevio } from './filter.js';
import { normalizarTelefono } from './phone.js';
import type { AddressInfo } from 'node:net';
import { crearServidorHttp, ipCliente, RateLimiter, validarAnalizar } from './http.js';
import type { AlertaPayload, ResumenEntidad } from './network.js';
import { procesarMensaje, type DepsPipeline } from './pipeline.js';
import { enviadorWhatsapp } from './alerts.js';
import { GestorSesiones, jidDeTelefono, rutaSesion, type EventosSesion } from './sesiones.js';

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

// cuit (titular de la cuenta) y link
check('cuitValido: dígito verificador', cuitValido('20123456786') && !cuitValido('20123456785') && !cuitValido('99123456786'));
check('CUIT con guiones se detecta', tiene('titular Juan Pérez CUIT 20-12345678-6', 'cuit', '20123456786'), detectarEntidades('CUIT 20-12345678-6'));
check('CUIT pegado se detecta', tiene('cuil 27280335148', 'cuit', '27280335148'), detectarEntidades('cuil 27280335148'));
check('CUIT no se cuenta también como teléfono', !detectarEntidades('CUIT 20-12345678-6').some((e) => e.tipo === 'telefono'), detectarEntidades('CUIT 20-12345678-6'));
check('11 dígitos con verificador roto no es cuit', !detectarEntidades('20123456785').some((e) => e.tipo === 'cuit'));
check('link con https se detecta', tiene('entrá a https://anses-beneficio.com/cobrar.', 'link', 'https://anses-beneficio.com/cobrar'), detectarEntidades('entrá a https://anses-beneficio.com/cobrar.'));
check('acortador se detecta', tiene('tocá bit.ly/AbC12 ya', 'link', 'bit.ly/AbC12'), detectarEntidades('tocá bit.ly/AbC12 ya'));
check('dominio pelado .com se detecta', tiene('registrate en inversiones-top.com', 'link', 'inversiones-top.com'), detectarEntidades('registrate en inversiones-top.com'));
check('dominio oficial no es link', !detectarEntidades('entrá a anses.gob.ar ya').some((e) => e.tipo === 'link'), detectarEntidades('entrá a anses.gob.ar ya'));
check('mail no es link', !detectarEntidades('escribime a juli.martinez@gmail.com').some((e) => e.tipo === 'link'), detectarEntidades('escribime a juli.martinez@gmail.com'));
check('alias .mp no es link', !detectarEntidades(DEMO).some((e) => e.tipo === 'link'));
check('wa.me → teléfono, no link', tiene('escribime a wa.me/5493415551234', 'telefono', '5493415551234') && !detectarEntidades('wa.me/5493415551234').some((e) => e.tipo === 'link'), detectarEntidades('wa.me/5493415551234'));
check('clave de link ignora esquema/www/barra', clave({ tipo: 'link', valor: 'https://www.Foo.com/' }) === clave({ tipo: 'link', valor: 'foo.com' }));

check('monto $ 150.000', tiene('mandame $ 150.000', 'monto', '150000'), detectarEntidades('mandame $ 150.000'));
check('monto 150 mil', tiene('son 150 mil', 'monto', '150000'), detectarEntidades('son 150 mil'));
check('monto 150k', tiene('necesito 150k', 'monto', '150000'), detectarEntidades('necesito 150k'));
check('monto $2,5 millones', tiene('$2,5 millones', 'monto', '2500000'), detectarEntidades('$2,5 millones'));
check('monto 80.000 pesos', tiene('80.000 pesos', 'monto', '80000'), detectarEntidades('80.000 pesos'));

// --- phone ---
check('normalizar 5493415551234', normalizarTelefono('5493415551234') === '3415551234', normalizarTelefono('5493415551234'));
check('normalizar 0341 15 555-1234', normalizarTelefono('0341 15 555-1234') === '3415551234', normalizarTelefono('0341 15 555-1234'));
check('normalizar +54 9 11 5555-1234', normalizarTelefono('+54 9 11 5555-1234') === '1155551234', normalizarTelefono('+54 9 11 5555-1234'));

// --- alertas con cuit/link ---
{
  const r = (tipo: ResumenEntidad['tipo'], valor: string, reportes: number): ResumenEntidad => ({
    entidad_id: 1, tipo, valor_normalizado: valor, encontrada: reportes > 0, reportes, provincias: ['Córdoba'], modalidades: [], ultimo: null, monto_total: 0,
  });
  const ppal = entidadPrincipal([r('link', 'anses-beneficio.com', 9), r('cuit', '20123456786', 3), r('telefono', '3415551234', 12)]);
  check('principal: cuit (cuenta) antes que link y teléfono', ppal?.tipo === 'cuit', ppal);
  check('lineaRed nombra el CUIT', /^El CUIT 20123456786/.test(lineaRed(r('cuit', '20123456786', 3)) ?? ''), lineaRed(r('cuit', '20123456786', 3)));
  check('lineaRed nombra el link', /^El link anses-beneficio\.com/.test(lineaRed(r('link', 'anses-beneficio.com', 2)) ?? ''), lineaRed(r('link', 'anses-beneficio.com', 2)));
  const soloLink = armarAlertas({ ...clasificarHeuristico('Ganaste un premio de ANSES, cobralo urgente en https://anses-beneficio.com'), monto: null }, [r('link', 'anses-beneficio.com', 4)]);
  check('familia: un link no es "pidió plata a"', !/pidió plata a anses/.test(soloLink.familia), soloLink.familia);
}

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
// Solo pasa al LLM lo que tiene señales (palabra clave, monto o entidad): charla común no gasta tokens.
const sinSenales = [
  'nos vemos mañana en el cumple de la tía Rosa',
  'hola, cómo andás? hace mucho que no hablamos',
  'a qué hora llegás a casa hoy a la noche',
];
for (const t of sinSenales) check(`charla sin señales no se analiza: "${t}"`, !debeAnalizar('3410000000', t, confianza));
const conSenales = [
  'hola ma, cambié de número, agendame',
  'necesito 50 mil para mañana',
  'te paso $15.000 ahora',
  'pasame la guita que te debo',
  'me prestás unas lucas hasta el viernes',
  'entrá a este link para reclamar tu beneficio',
  'tu cuenta fue bloqueada, verificá tus datos',
  'tenés un reintegro pendiente',
  'te devuelvo 200 usdt en una semana',
  'mirá esto https://bit.ly/abc123',
  'llamame al 341 555 1234 urgente',
];
for (const t of conSenales) check(`con señales se analiza: "${t}"`, debeAnalizar('3410000000', t, confianza));
const solo = new Set(['3410000000']);
check('ANALIZAR_SOLO: número de la lista se analiza', debeAnalizar('3410000000', DEMO, confianza, solo));
check('ANALIZAR_SOLO: número fuera de la lista no', !debeAnalizar('3419999999', DEMO, confianza, solo));
check('ANALIZAR_SOLO: sin número resuelto no', !debeAnalizar(null, DEMO, confianza, solo));
check('ANALIZAR_SOLO vacío: comportamiento normal', debeAnalizar('3419999999', DEMO, confianza, new Set()));
const arranque = Date.UTC(2026, 9, 24, 15, 0, 0);
check('mensaje anterior al arranque se ignora', esMensajePrevio(arranque / 1000 - 60, arranque));
check('mensaje posterior al arranque se procesa', !esMensajePrevio(arranque / 1000 + 5, arranque));
check('timestamp Long (toNumber) anterior se ignora', esMensajePrevio({ toNumber: () => arranque / 1000 - 1 }, arranque));
check('sin timestamp se procesa', !esMensajePrevio(null, arranque));

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

{
  const a = armarAlertas(
    { ...h, monto: null, alerta_persona: 'No transfieras plata. Llamá a Juli al número que ya tenés agendado.' },
    [],
  );
  check('alerta persona no repite "Llamá a" si el LLM ya lo dijo', (a.persona.match(/Llamá a/g) ?? []).length === 1, a.persona);
}

// --- pipeline (deps falsas, sin red) ---
const RESUMEN_JULI: ResumenEntidad = {
  entidad_id: 12,
  tipo: 'alias',
  valor_normalizado: 'juli.martinez.mp',
  encontrada: true,
  reportes: 24,
  provincias: ['Santa Fe', 'Córdoba'],
  modalidades: ['familiar_numero_nuevo'],
  ultimo: null,
  monto_total: null,
};
function fakeDeps(over: Partial<DepsPipeline> = {}) {
  const llamadas = { reportes: [] as unknown[], alertas: [] as AlertaPayload[] };
  const deps: DepsPipeline = {
    clasificar: async (texto, ctx) => ({ ...clasificarHeuristico(texto, ctx), monto: null }),
    consultarEntidad: async (valor) => ({ ...RESUMEN_JULI, valor_normalizado: valor, encontrada: false, reportes: 0 }),
    registrarReporte: async (c, d) => {
      llamadas.reportes.push({ c, d });
      return { reporte_id: 301, entidades: [RESUMEN_JULI] };
    },
    registrarAlerta: async (p) => {
      llamadas.alertas.push(p);
      return { alerta_id: 55 };
    },
    umbral: 60,
    protegido: 'la abuela',
    ...over,
  };
  return { deps, llamadas };
}

{
  const { deps, llamadas } = fakeDeps({ consultarEntidad: async (valor) => ({ ...RESUMEN_JULI, valor_normalizado: valor, reportes: 23 }) });
  const enviar = async () => [
    { destino: 'propio' as const, jid: '5493410000000@s.whatsapp.net' },
    { destino: 'familia' as const, jid: '120363@g.us' },
  ];
  const r = await procesarMensaje({ texto: DEMO, remitente: '3410000000', enviar }, deps);
  check('pipeline: demo registra reporte', r.reporte_id === 301 && llamadas.reportes.length === 1, r);
  check('pipeline: demo registra alerta', r.alerta_id === 55 && llamadas.alertas.length === 1, r);
  check('pipeline: enviada_a con etiquetas', JSON.stringify(r.enviada_a) === '["propio","familia"]', r.enviada_a);
  check('pipeline: alerta guarda JIDs', llamadas.alertas[0]?.enviada_a.includes('120363@g.us') === true, llamadas.alertas[0]);
  check('pipeline: alerta lleva entidad_ids', llamadas.alertas[0]?.entidad_ids[0] === 12, llamadas.alertas[0]);
  check('pipeline: textos con la red', r.textos.persona.includes('24 reportes'), r.textos);
  check('pipeline: resumenes de registrar_reporte', r.resumenes[0]?.reportes === 24, r.resumenes);
}
{
  const { deps, llamadas } = fakeDeps();
  const r = await procesarMensaje({ texto: DEMO, remitente: null }, deps);
  check('pipeline: sin enviador no manda pero registra', r.enviada_a.length === 0 && r.alerta_id === 55, r);
  check('pipeline: alerta sin enviar guarda enviada_a vacío', llamadas.alertas[0]?.enviada_a.length === 0);
}
{
  const { deps, llamadas } = fakeDeps();
  const r = await procesarMensaje({ texto: 'hola, nos vemos el sábado en lo de la tía para el cumple', remitente: null }, deps);
  check('pipeline: normal no registra', r.reporte_id === null && r.alerta_id === null && llamadas.reportes.length === 0, r);
  check('pipeline: normal no dice estafa', !/estafa/i.test(r.textos.persona) || /sin señales/i.test(r.textos.persona), r.textos);
}
{
  const quemado = { consultarEntidad: async (valor: string) => ({ ...RESUMEN_JULI, valor_normalizado: valor }) };
  const texto = 'hola, te paso el alias juli.martinez.mp';
  const { deps } = fakeDeps({
    ...quemado,
    clasificar: async (t, ctx) => ({ ...clasificarHeuristico(t, ctx), es_sospechoso: false, riesgo: 10, monto: null }),
  });
  const r = await procesarMensaje({ texto, remitente: null }, deps);
  check('pipeline: alias quemado en la red → sospechoso', r.clasificacion.es_sospechoso && r.clasificacion.riesgo >= 75, r.clasificacion);
  check('pipeline: alias quemado registra y alerta', r.reporte_id === 301 && r.alerta_id === 55, r);
  // sospechoso pero bajo el umbral (heurística: 50 < 60): la red lo sube y alerta
  const { deps: d2 } = fakeDeps(quemado);
  const r2 = await procesarMensaje({ texto, remitente: null }, d2);
  check('pipeline: sospechoso bajo umbral + alias quemado → alerta', r2.clasificacion.riesgo >= 75 && r2.alerta_id === 55, r2.clasificacion);
}
{
  const { deps, llamadas } = fakeDeps({
    registrarReporte: async () => {
      throw new Error('supabase caído');
    },
  });
  let enviados = 0;
  const r = await procesarMensaje(
    { texto: DEMO, remitente: null, enviar: async () => (enviados++, [{ destino: 'propio', jid: 'x' }]) },
    deps,
  );
  check('pipeline: sin red igual alerta', enviados === 1 && r.enviada_a[0] === 'propio', r);
  check('pipeline: sin red no registra alerta', r.reporte_id === null && r.alerta_id === null && llamadas.alertas.length === 0, r);
}
{
  const { deps, llamadas } = fakeDeps({ umbral: 101 });
  let enviados = 0;
  const r = await procesarMensaje({ texto: DEMO, remitente: null, enviar: async () => (enviados++, []) }, deps);
  check('pipeline: bajo el umbral registra reporte sin alerta', r.reporte_id === 301 && r.alerta_id === null && enviados === 0 && llamadas.alertas.length === 0, r);
}

// --- latencia ---
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
{
  const orden: string[] = [];
  const { deps } = fakeDeps({
    clasificar: async (texto, ctx) => {
      await esperar(30);
      orden.push('llm:fin');
      return { ...clasificarHeuristico(texto, ctx), monto: null };
    },
    consultarEntidad: async (valor) => {
      orden.push('red:inicio');
      return { ...RESUMEN_JULI, valor_normalizado: valor, reportes: 23 };
    },
    registrarReporte: async () => {
      await esperar(40);
      orden.push('reporte:fin');
      return { reporte_id: 301, entidades: [RESUMEN_JULI] };
    },
  });
  let enviado = '';
  const r = await procesarMensaje(
    { texto: DEMO, remitente: '3410000000', enviar: async (t) => (orden.push('enviar'), (enviado = t.persona), [{ destino: 'propio', jid: 'x' }]) },
    deps,
  );
  check('latencia: la red se consulta en paralelo con el LLM', orden.indexOf('red:inicio') < orden.indexOf('llm:fin'), orden);
  check('latencia: la alerta sale antes de que termine registrar_reporte', orden.indexOf('enviar') < orden.indexOf('reporte:fin'), orden);
  check('latencia: la alerta ya cuenta este reporte (23 → 24)', enviado.includes('24 reportes'), enviado);
  check('latencia: igual registra reporte y alerta', r.reporte_id === 301 && r.alerta_id === 55 && r.resumenes[0]?.reportes === 24, r);
}
{
  const lento = <T>(v: T, ms: number) => esperar(ms).then(() => v);
  const llm = { riesgo: 90, origen: 'llm' };
  const t1 = Date.now();
  const a = await conPresupuesto(lento(llm, 200), { riesgo: 80, origen: 'heuristica' }, { presupuestoMs: 20, umbral: 60 });
  check('carrera: LLM lento + heurística alta → heurística a tiempo', a.origen === 'heuristica' && Date.now() - t1 < 150, a);
  const b = await conPresupuesto(lento(llm, 60), { riesgo: 10, origen: 'heuristica' }, { presupuestoMs: 20, umbral: 60 });
  check('carrera: LLM lento + heurística baja → espera al LLM', b.origen === 'llm', b);
  const c2 = await conPresupuesto(lento(llm, 5), { riesgo: 80, origen: 'heuristica' }, { presupuestoMs: 100, umbral: 60 });
  check('carrera: LLM a tiempo → LLM', c2.origen === 'llm', c2);
}

// --- http ---
check('http: valida texto ok', validarAnalizar({ texto: 'hola' }).ok);
check('http: texto vacío → error', !validarAnalizar({ texto: '   ' }).ok);
check('http: texto > 2000 → error', !validarAnalizar({ texto: 'a'.repeat(2001) }).ok);
check('http: sin texto → error', !validarAnalizar({}).ok);
check('http: body no objeto → error', !validarAnalizar('hola').ok);
check('http: remitente no string → error', !validarAnalizar({ texto: 'hola', remitente: 123 }).ok);
check('http: enviar_whatsapp no boolean → error', !validarAnalizar({ texto: 'hola', enviar_whatsapp: 'si' }).ok);
{
  const v = validarAnalizar({ texto: ' hola ', remitente: '+54 9 341 555-1234', enviar_whatsapp: true });
  check('http: normaliza remitente y trimea texto', v.ok && v.remitente === '3415551234' && v.texto === 'hola' && v.enviar_whatsapp, v);
}
{
  let t = 0;
  const rl = new RateLimiter(2, 60_000, () => t);
  const r1 = rl.permitir('a'), r2 = rl.permitir('a'), r3 = rl.permitir('a'), rb = rl.permitir('b');
  t = 60_001;
  check('http: rate limit 2/min por IP', r1 && r2 && !r3 && rb && rl.permitir('a'));
}
check('http: IP detrás del proxy local = último X-Forwarded-For', ipCliente('1.1.1.1, 9.9.9.9', '127.0.0.1') === '9.9.9.9');
check('http: IP directa ignora X-Forwarded-For', ipCliente('1.1.1.1', '203.0.113.5') === '203.0.113.5');
check('http: IP sin X-Forwarded-For', ipCliente(undefined, '::ffff:127.0.0.1') === '::ffff:127.0.0.1');
{
  let enviarPedido: boolean | null = null;
  const server = crearServidorHttp({
    analizar: async ({ texto, enviar_whatsapp }) => {
      enviarPedido = enviar_whatsapp;
      if (texto === 'explota') throw new Error('boom');
      const { deps } = fakeDeps();
      return procesarMensaje({ texto, remitente: null }, deps);
    },
    estadoWhatsapp: () => 'qr',
    limiter: new RateLimiter(9, 60_000),
    token: 'secreto',
    origenWeb: 'https://mula-ai.vercel.app',
  });
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (body: string, token: string | null = 'secreto') =>
    fetch(`${base}/analizar`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { 'x-mula-token': token } : {}) }, body });
  try {
    const h = await fetch(`${base}/health`);
    const hj = (await h.json()) as any;
    check('http: GET /health', h.status === 200 && hj.ok === true && hj.whatsapp === 'qr', hj);
    check('http: CORS ya no es * (sin Origin → sin Allow-Origin)', h.headers.get('access-control-allow-origin') === null, h.headers.get('access-control-allow-origin'));
    const hOtro = await fetch(`${base}/health`, { headers: { origin: 'https://evil.example' } });
    check('http: CORS origen ajeno → sin Allow-Origin', hOtro.headers.get('access-control-allow-origin') === null);
    const o = await fetch(`${base}/analizar`, { method: 'OPTIONS', headers: { origin: 'https://mula-ai.vercel.app' } });
    check(
      'http: OPTIONS 204 con CORS solo para WEB_ORIGIN',
      o.status === 204 && o.headers.get('access-control-allow-origin') === 'https://mula-ai.vercel.app' && !!o.headers.get('access-control-allow-methods'),
      o.status,
    );
    const sinToken = await post(JSON.stringify({ texto: DEMO }), null);
    check('http: /analizar sin X-Mula-Token → 401', sinToken.status === 401 && enviarPedido === null, sinToken.status);
    const malToken = await post(JSON.stringify({ texto: DEMO, enviar_whatsapp: true }), 'otro');
    check('http: /analizar con token equivocado → 401', malToken.status === 401 && enviarPedido === null, malToken.status);
    const a = await post(JSON.stringify({ texto: DEMO, enviar_whatsapp: true }), 'secreto');
    const aj = (await a.json()) as any;
    const claves = ['es_sospechoso', 'riesgo', 'modalidad', 'senales', 'suplanta_a', 'entidades', 'alerta_persona', 'alerta_familia', 'reporte_id', 'alerta_id', 'enviada_a', 'fuente_clasificacion'];
    check('http: POST /analizar 200 con el contrato', a.status === 200 && claves.every((k) => k in aj), aj);
    check('http: contrato valores', aj.reporte_id === 301 && aj.alerta_id === 55 && aj.fuente_clasificacion === 'heuristica' && aj.entidades[0]?.valor_normalizado === 'juli.martinez.mp', aj);
    check('http: pasa enviar_whatsapp', enviarPedido === true);
    check('http: JSON inválido → 400', (await post('{no')).status === 400);
    check('http: texto vacío → 400', (await post(JSON.stringify({ texto: '' }))).status === 400);
    check('http: body > 20KB → 400', (await post(JSON.stringify({ texto: 'a'.repeat(21_000) }))).status === 400);
    const e = await post(JSON.stringify({ texto: 'explota' }));
    check('http: error interno → 500 con {error}', e.status === 500 && typeof ((await e.json()) as any).error === 'string');
    check('http: ruta desconocida → 404', (await fetch(`${base}/nada`)).status === 404);
    // ya van 8 POST de 9 permitidos
    await post(JSON.stringify({ texto: 'hola' }));
    await post(JSON.stringify({ texto: 'hola' }));
    const lim = await post(JSON.stringify({ texto: 'hola' }));
    check('http: rate limit → 429', lim.status === 429 && typeof ((await lim.json()) as any).error === 'string', lim.status);
  } finally {
    server.close();
  }
}
{
  // sin MULA_TOKEN configurado el worker no analiza nada por HTTP (pero /health sigue)
  const server = crearServidorHttp({
    analizar: async () => {
      throw new Error('no debería llamarse');
    },
    estadoWhatsapp: () => 'conectado',
  });
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const r = await fetch(`${base}/analizar`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-mula-token': '' }, body: JSON.stringify({ texto: DEMO }) });
    check('http: sin MULA_TOKEN configurado → 401 siempre', r.status === 401, r.status);
    check('http: sin MULA_TOKEN /health sigue público', (await fetch(`${base}/health`)).status === 200);
  } finally {
    server.close();
  }
}

// --- reconexión de Baileys ---
{
  const lo = decidirReconexion(DisconnectReason.loggedOut, 3);
  check('reconexión: logged out → borrar sesión y QR nuevo', lo.accion === 'relogin' && lo.esperaMs === 0 && /QR/.test(lo.motivo), lo);
  const rr = decidirReconexion(DisconnectReason.restartRequired, 1);
  check('reconexión: 515 restart → reconecta ya', rr.accion === 'reconectar' && rr.esperaMs === 0, rr);
  const cr = decidirReconexion(DisconnectReason.connectionReplaced, 1);
  check('reconexión: 440 → espera larga y avisa de otra instancia', cr.accion === 'reconectar' && cr.esperaMs >= 60_000 && /otra instancia/.test(cr.motivo), cr);
  const b1 = decidirReconexion(DisconnectReason.connectionLost, 1).esperaMs;
  const b5 = decidirReconexion(DisconnectReason.connectionLost, 5).esperaMs;
  const b9 = decidirReconexion(undefined, 9).esperaMs;
  check('reconexión: backoff crece y topea en 30 s', b1 < b5 && b5 <= 30_000 && b9 === 30_000, { b1, b5, b9 });
}

// --- classify: presupuesto de tiempo del LLM (fetch falso, sin red) ---
{
  const fetchOrig = globalThis.fetch;
  const keyOrig = config.openrouterApiKey;
  const timeoutOrig = config.classifierTimeoutMs;
  config.openrouterApiKey = 'test';
  config.classifierTimeoutMs = 400;
  const vivo = setInterval(() => {}, 1000); // AbortSignal.timeout no mantiene vivo el proceso
  const { origen: _o, ...salidaLlm } = clasificarHeuristico(DEMO);
  const respuestaLlm = JSON.stringify({
    choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ ...salidaLlm, riesgo: 91 }) } }],
  });
  try {
    let llamadas = 0;
    // cuelga hasta que lo aborten
    globalThis.fetch = ((_u: unknown, init?: { signal?: AbortSignal }) => {
      llamadas++;
      return new Promise((_res, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('abort'))));
    }) as typeof fetch;
    const t0 = Date.now();
    const r = await clasificar(DEMO);
    const ms = Date.now() - t0;
    check('classify: LLM colgado → heurística dentro del presupuesto total', r.origen === 'heuristica' && ms < 550, { ms, llamadas, origen: r.origen });
    const t1 = Date.now();
    const rc = await clasificar(DEMO, {}, { presupuestoMs: 50 });
    check('classify: LLM lento + heurística alta → alerta con la heurística a los ~50 ms', rc.origen === 'heuristica' && Date.now() - t1 < 200, { ms: Date.now() - t1 });

    llamadas = 0;
    globalThis.fetch = (async () => {
      llamadas++;
      if (llamadas === 1) return new Response('boom', { status: 502 });
      return new Response(respuestaLlm, { status: 200 });
    }) as typeof fetch;
    const r2 = await clasificar(DEMO);
    check('classify: falla rápida → reintenta y usa el LLM', r2.origen === 'llm' && r2.riesgo === 91 && llamadas === 2, { llamadas, origen: r2.origen });
  } finally {
    globalThis.fetch = fetchOrig;
    config.openrouterApiKey = keyOrig;
    config.classifierTimeoutMs = timeoutOrig;
    clearInterval(vivo);
  }
}

// --- sesiones por protegido (QR desde la web) ---
check('sesiones: jid de teléfono 10 dígitos', jidDeTelefono('3415551234') === '5493415551234@s.whatsapp.net', jidDeTelefono('3415551234'));
check('sesiones: jid normaliza +54 9', jidDeTelefono('+54 9 341 555-1234') === '5493415551234@s.whatsapp.net');
check('sesiones: jid inválido → null', jidDeTelefono('123') === null && jidDeTelefono(null) === null);
check('sesiones: ruta /sesiones/7', rutaSesion('/sesiones/7') === 7);
check('sesiones: ruta inválida → null', rutaSesion('/sesiones/abc') === null && rutaSesion('/sesiones/') === null && rutaSesion('/analizar') === null && rutaSesion('/sesiones/0') === null);
{
  const conexiones: Array<{ id: number; ev: EventosSesion; cerradas: boolean[] }> = [];
  const g = new GestorSesiones(async (id, ev) => {
    const c = { id, ev, cerradas: [] as boolean[] };
    conexiones.push(c);
    return { cerrar: async (logout: boolean) => void c.cerradas.push(logout) };
  });
  check('gestor: sin iniciar → inactiva', g.estado(7).estado === 'inactiva' && g.estado(7).qr === null);
  const e0 = await g.iniciar(7);
  check('gestor: recién iniciada → desconectado', e0.estado === 'desconectado' && conexiones.length === 1, e0);
  await g.iniciar(7);
  check('gestor: iniciar dos veces no duplica', conexiones.length === 1);
  conexiones[0]!.ev.qr('QR-1');
  check('gestor: QR visible', g.estado(7).estado === 'qr' && g.estado(7).qr === 'QR-1', g.estado(7));
  conexiones[0]!.ev.abierta('3415551234');
  const e1 = g.estado(7);
  check('gestor: conectada con teléfono y sin QR', e1.estado === 'conectado' && e1.telefono === '3415551234' && e1.qr === null, e1);
  check('gestor: lista activas', JSON.stringify(g.activas()) === '[7]');
  conexiones[0]!.ev.cerrada();
  check('gestor: se cayó → desconectado (reconecta sola)', g.estado(7).estado === 'desconectado');
  await g.desvincular(7);
  check('gestor: desvincular hace logout y queda inactiva', conexiones[0]!.cerradas[0] === true && g.estado(7).estado === 'inactiva', conexiones[0]!.cerradas);
  await g.iniciar(8);
  conexiones[1]!.ev.terminada();
  check('gestor: sesión terminada (logout o QR vencido) → inactiva', g.estado(8).estado === 'inactiva' && g.activas().length === 0);
  const lleno = new GestorSesiones(async () => ({ cerrar: async () => {} }), 1);
  await lleno.iniciar(1);
  let error = '';
  await lleno.iniciar(2).catch((e: Error) => (error = e.message));
  check('gestor: tope de sesiones', /máximo/.test(error), error);
}
{
  const g = new GestorSesiones(async (_id, ev) => (setTimeout(() => ev.qr('QR-9'), 0), { cerrar: async () => {} }));
  const server = crearServidorHttp({
    analizar: async () => {
      throw new Error('no');
    },
    estadoWhatsapp: () => 'conectado',
    sesiones: g,
    token: 'secreto',
  });
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const pedir = (method: string, ruta: string, token: string | null = 'secreto') =>
    fetch(`${base}${ruta}`, { method, headers: token ? { 'x-mula-token': token } : {} });
  try {
    check('http: /sesiones sin token → 401', (await pedir('GET', '/sesiones/9', null)).status === 401);
    const g0 = (await (await pedir('GET', '/sesiones/9')).json()) as any;
    check('http: GET sesión no iniciada → inactiva', g0.estado === 'inactiva' && g0.protegido_id === 9, g0);
    const p = await pedir('POST', '/sesiones/9');
    check('http: POST /sesiones/9 inicia', p.status === 200 && g.activas().includes(9), p.status);
    await new Promise((r) => setTimeout(r, 10));
    const g1 = (await (await pedir('GET', '/sesiones/9')).json()) as any;
    check('http: GET devuelve el QR', g1.estado === 'qr' && g1.qr === 'QR-9', g1);
    const d = (await (await pedir('DELETE', '/sesiones/9')).json()) as any;
    check('http: DELETE desvincula', d.estado === 'inactiva' && !g.activas().includes(9), d);
    check('http: /sesiones/abc → 404', (await pedir('GET', '/sesiones/abc')).status === 404);
    check('http: PUT /sesiones/9 → 405', (await pedir('PUT', '/sesiones/9')).status === 405);
  } finally {
    server.close();
  }
}
{
  const mandados: string[] = [];
  const sock = { user: { id: '5493410000000:3@s.whatsapp.net' }, sendMessage: async (jid: string) => void mandados.push(jid) } as any;
  const env = await enviadorWhatsapp(sock, ['5493415551234@s.whatsapp.net', '5491122223333@s.whatsapp.net', '5493410000000@s.whatsapp.net'])({ persona: 'p', familia: 'f' });
  check('alerts: manda a propio + cada familiar (sin repetir el propio)', JSON.stringify(mandados) === JSON.stringify(['5493410000000@s.whatsapp.net', '5493415551234@s.whatsapp.net', '5491122223333@s.whatsapp.net']), mandados);
  check('alerts: destinos etiquetados', env.filter((e) => e.destino === 'familia').length === 2, env);
}
{
  const asociadas: Array<[number, number]> = [];
  const { deps, llamadas } = fakeDeps({ asociarAlerta: async (a, p) => void asociadas.push([a, p]) });
  const enviar = async () => [
    { destino: 'propio' as const, jid: 'a' },
    { destino: 'familia' as const, jid: 'b' },
    { destino: 'familia' as const, jid: 'c' },
  ];
  const r = await procesarMensaje({ texto: DEMO, remitente: null, enviar, protegido: 'Marta', provincia: 'Córdoba', protegidoId: 4 }, deps);
  check('pipeline: protegido de la sesión en la alerta', llamadas.alertas[0]?.protegido === 'Marta' && r.textos.familia.includes('Marta'), r.textos.familia);
  check('pipeline: provincia de la sesión en el reporte', (llamadas.reportes[0] as any)?.d.provincia === 'Córdoba', llamadas.reportes[0]);
  check('pipeline: alerta asociada al protegido_id', JSON.stringify(asociadas) === '[[55,4]]', asociadas);
  check('pipeline: enviada_a sin repetidos', JSON.stringify(r.enviada_a) === '["propio","familia"]', r.enviada_a);
}

console.log(`\n${ok} ok · ${fail} fallas`);
process.exit(fail ? 1 : 0);
