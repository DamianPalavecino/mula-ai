// Smoke test de prod con la anon key (lo que ve la web). No lee archivos de entorno:
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=... [WEB_URL=https://....vercel.app] npm run check prod
// Exit 3 = omitido (faltan variables).
const { SUPABASE_URL, SUPABASE_ANON_KEY, WEB_URL } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('⏭️ faltan SUPABASE_URL y/o SUPABASE_ANON_KEY en el entorno');
  process.exit(3);
}

let fallas = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fallas++; };
const h = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
const rpc = async (fn, body = {}) => {
  try {
    const r = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, { method: 'POST', headers: h, body: JSON.stringify(body) });
    return { status: r.status, data: await r.json().catch(() => null) };
  } catch (e) { return { status: `sin conexión: ${e.cause?.code ?? e.message}`, data: null }; }
};

const juli = await rpc('resumen_entidad', { valor: 'juli.martinez.mp' });
ok(juli.status === 200, `resumen_entidad responde 200 (dio ${juli.status})`);
ok(juli.data?.reportes >= 23, `juli.martinez.mp tiene ≥23 reportes (dio ${juli.data?.reportes})`);
ok(juli.data?.provincias?.length >= 5, `juli.martinez.mp en ≥5 provincias (dio ${juli.data?.provincias?.length})`);

const g = await rpc('grafo');
ok(g.data?.nodes?.length > 0 && g.data?.links?.length > 0, `grafo() con nodos y links (${g.data?.nodes?.length} / ${g.data?.links?.length})`);

const escritura = await rpc('registrar_reporte', { payload: { fuente: 'sintetico', texto: 'smoke' } });
ok(typeof escritura.status === 'number' && escritura.status >= 400, `anon NO puede registrar_reporte (dio ${escritura.status})`);

const get = (url, opts) => fetch(url, opts).catch((e) => ({ status: `sin conexión: ${e.cause?.code ?? e.message}` }));
const alertas = await get(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/alertas?select=id&limit=1`, { headers: h });
ok(alertas.status === 200, `anon lee alertas (dio ${alertas.status})`);

if (WEB_URL) {
  for (const p of ['/', '/verificar?valor=juli.martinez.mp', '/red']) {
    const r = await get(new URL(p, WEB_URL));
    ok(r.status === 200, `web ${p} → ${r.status}`);
  }
} else console.log('(sin WEB_URL: no pruebo Vercel)');

console.log(fallas ? `\n${fallas} fallas` : '\nprod ok');
process.exit(fallas ? 1 : 0);
