// Smoke test de prod. No lee archivos de entorno (el runner pasa --env-file-if-exists):
//   npm run check prod
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... [SUPABASE_SERVICE_ROLE_KEY=...] [WEB_URL=https://....vercel.app] node scripts/smoke-prod.mjs
//
// Criterio (base cerrada a anon desde el 24/10, la web lee server-side con service role tras Clerk):
//   - anon key: resumen_entidad, grafo y registrar_reporte → ≥400; GET alertas → ≥400 o [].
//   - service role (si está): juli.martinez.mp ≥23 reportes y ≥5 provincias, grafo() con nodos y
//     links, select a protegidos → 200 (requiere supabase/auth.sql aplicado).
//   - WEB_URL (si está): / y /entrar → 200; /app y /admin sin sesión → redirect o 404 de Clerk (signed-out); 2xx/3xx, nunca 5xx;
//     /red, /simulador, /verificar, /me-estafaron → 3xx o 404.
// MODO=pre-cierre: los checks de anon imprimen WARN en vez de FAIL (antes de aplicar
//   supabase/cierre-anon.sql). Sin la variable, exige el cierre.
// Exit 3 = omitido (faltan variables).
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, WEB_URL, MODO } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('⏭️ faltan SUPABASE_URL y/o SUPABASE_ANON_KEY en el entorno');
  process.exit(3);
}
const preCierre = MODO === 'pre-cierre';
if (preCierre) console.log('(MODO=pre-cierre: los checks de anon son WARN, no FAIL)');

let fallas = 0;
let warns = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fallas++; };
const okAnon = (cond, msg) => {
  if (cond || !preCierre) return ok(cond, msg);
  console.log(`WARN  ${msg}`); warns++;
};

const base = SUPABASE_URL.replace(/\/$/, '');
const headers = (key) => ({ apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' });
const req = async (url, opts) => {
  try {
    const r = await fetch(url, opts);
    return { status: r.status, data: await r.json().catch(() => null) };
  } catch (e) { return { status: `sin conexión: ${e.cause?.code ?? e.message}`, data: null }; }
};
const rpc = (key, fn, body = {}) => req(`${base}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(key), body: JSON.stringify(body) });
const select = (key, path) => req(`${base}/rest/v1/${path}`, { headers: headers(key) });
const negado = (s) => typeof s === 'number' && s >= 400;

// --- anon: sin acceso a nada ---
const a = SUPABASE_ANON_KEY;
const aJuli = await rpc(a, 'resumen_entidad', { valor: 'juli.martinez.mp' });
okAnon(negado(aJuli.status), `anon NO ejecuta resumen_entidad (dio ${aJuli.status})`);
const aGrafo = await rpc(a, 'grafo');
okAnon(negado(aGrafo.status), `anon NO ejecuta grafo (dio ${aGrafo.status})`);
const aAlertas = await select(a, 'alertas?select=id&limit=1');
okAnon(negado(aAlertas.status) || (aAlertas.status === 200 && Array.isArray(aAlertas.data) && aAlertas.data.length === 0),
  `anon NO lee alertas (dio ${aAlertas.status}${aAlertas.status === 200 ? `, ${aAlertas.data?.length} filas` : ''})`);
const aEscr = await rpc(a, 'registrar_reporte', { payload: { fuente: 'sintetico', texto: 'smoke' } });
ok(negado(aEscr.status), `anon NO puede registrar_reporte (dio ${aEscr.status})`);

// --- service role: los datos siguen ahí ---
if (SUPABASE_SERVICE_ROLE_KEY) {
  const s = SUPABASE_SERVICE_ROLE_KEY;
  const juli = await rpc(s, 'resumen_entidad', { valor: 'juli.martinez.mp' });
  ok(juli.data?.reportes >= 23, `service: juli.martinez.mp ≥23 reportes (dio ${juli.data?.reportes}, status ${juli.status})`);
  ok(juli.data?.provincias?.length >= 5, `service: juli.martinez.mp en ≥5 provincias (dio ${juli.data?.provincias?.length})`);
  const g = await rpc(s, 'grafo');
  ok(g.data?.nodes?.length > 0 && g.data?.links?.length > 0, `service: grafo() con nodos y links (${g.data?.nodes?.length} / ${g.data?.links?.length})`);
  const p = await select(s, 'protegidos?select=id&limit=1');
  ok(p.status === 200, `service: select protegidos → 200 (dio ${p.status})`);
  const col = await select(s, 'alertas?select=protegido_id&limit=1');
  ok(col.status === 200, `service: alertas.protegido_id existe (dio ${col.status})`);
} else console.log('(sin SUPABASE_SERVICE_ROLE_KEY: no pruebo datos con service role)');

// --- web ---
if (WEB_URL) {
  // Devuelve { status, clerk } (clerk = header x-clerk-auth-status, si el proxy de Clerk intervino).
  const get = async (p) => {
    try {
      const r = await fetch(new URL(p, WEB_URL), { redirect: 'manual' });
      return { status: r.status, clerk: r.headers.get('x-clerk-auth-status') };
    } catch (e) { return { status: `sin conexión: ${e.cause?.code ?? e.message}`, clerk: null }; }
  };
  const es = (s, lo, hi) => typeof s === 'number' && s >= lo && s <= hi;
  for (const p of ['/', '/entrar']) { const { status: s } = await get(p); ok(s === 200, `web ${p} → ${s} (esperado 200)`); }
  // Sin sesión, Clerk redirige a /entrar en un navegador; a un cliente sin cookies (curl/fetch)
  // le responde 404 con x-clerk-auth-status: signed-out. Lo que no puede pasar es 200 con datos ni 5xx.
  for (const p of ['/app', '/admin']) {
    const { status: s, clerk } = await get(p);
    ok(es(s, 300, 399) || (s === 404 && clerk === 'signed-out'), `web ${p} sin sesión → ${s} (${clerk ?? 'sin clerk'}; esperado redirect o 404 de Clerk)`);
  }
  // Rutas públicas viejas: redirect del server (3xx), 404, o el shell de Suspense (200) que
  // redirige en el cliente a /app/... (verificar). Nunca 5xx.
  for (const p of ['/red', '/simulador', '/verificar', '/me-estafaron']) {
    const { status: s } = await get(p); ok(es(s, 200, 399) || s === 404, `web ${p} → ${s} (redirect, 404 o shell; nunca 5xx)`);
  }
} else console.log('(sin WEB_URL: no pruebo Vercel)');

console.log(fallas ? `\n${fallas} fallas${warns ? `, ${warns} warn` : ''}` : `\nprod ok${warns ? ` (${warns} warn: falta aplicar cierre-anon.sql)` : ''}`);
process.exit(fallas ? 1 : 0);
