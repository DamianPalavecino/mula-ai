/**
 * Smoke test sin red: entities + filter + heurística + armado de alertas.
 * Uso: npm run selftest
 */
import { armarAlertas } from './alerts.js';
import { clasificar, clasificarHeuristico } from './classify.js';
import { config } from './config.js';
import { completarCbu, detectarEntidades, validarCbu } from './entities.js';
import { debeAnalizar, esMensajePrevio } from './filter.js';
import { normalizarTelefono } from './phone.js';
import type { AddressInfo } from 'node:net';
import { crearServidorHttp, RateLimiter, validarAnalizar } from './http.js';
import type { AlertaPayload, ResumenEntidad } from './network.js';
import { procesarMensaje, type DepsPipeline } from './pipeline.js';

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
  const { deps, llamadas } = fakeDeps();
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
    limiter: new RateLimiter(6, 60_000),
  });
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (body: string) => fetch(`${base}/analizar`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  try {
    const h = await fetch(`${base}/health`);
    const hj = (await h.json()) as any;
    check('http: GET /health', h.status === 200 && hj.ok === true && hj.whatsapp === 'qr', hj);
    check('http: CORS *', h.headers.get('access-control-allow-origin') === '*');
    const o = await fetch(`${base}/analizar`, { method: 'OPTIONS' });
    check('http: OPTIONS 204 con CORS', o.status === 204 && !!o.headers.get('access-control-allow-methods'), o.status);
    const a = await post(JSON.stringify({ texto: DEMO, enviar_whatsapp: true }));
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
    // ya van 5 POST de 6 permitidos
    await post(JSON.stringify({ texto: 'hola' }));
    await post(JSON.stringify({ texto: 'hola' }));
    const lim = await post(JSON.stringify({ texto: 'hola' }));
    check('http: rate limit → 429', lim.status === 429 && typeof ((await lim.json()) as any).error === 'string', lim.status);
  } finally {
    server.close();
  }
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

console.log(`\n${ok} ok · ${fail} fallas`);
process.exit(fail ? 1 : 0);
