// Chequeo end-to-end contra el Supabase del entorno, con la anon key (lo mismo que ve la web).
//   npm run e2e                         → base + último caso de WhatsApp + Realtime suscripto
//   npm run e2e -- --base               → solo la base (antes de la primera detección real)
//   npm run e2e -- --reciente 10        → exige reporte whatsapp y alerta de los últimos 10 min
//   npm run e2e -- --watch [segundos]   → además queda escuchando INSERT en alertas (sin número: hasta Ctrl+C)
//   npm run e2e -- --web https://…      → además pide <url>/red y <url>/verificar
// Sale con 1 si algo falla. Lee SUPABASE_URL/SUPABASE_ANON_KEY del .env raíz (o NEXT_PUBLIC_*).
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
dotenv.config({ path: resolve(ROOT, '.env'), quiet: true });

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const valor = (name: string) => {
  const i = args.indexOf(`--${name}`);
  const v = i >= 0 ? args[i + 1] : undefined;
  return v && !v.startsWith('--') ? v : undefined;
};
const SOLO_BASE = flag('base');
const RECIENTE_MIN = valor('reciente') ? Number(valor('reciente')) : null;
const WATCH = flag('watch');
const WATCH_S = valor('watch') ? Number(valor('watch')) : Infinity;
const WEB = valor('web')?.replace(/\/$/, '');
const ALIAS_DEMO = 'juli.martinez.mp';

const URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Res = { ok: boolean; nombre: string; detalle: string };
const res: Res[] = [];
const check = (ok: boolean, nombre: string, detalle = '') => {
  res.push({ ok, nombre, detalle });
  console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  return ok;
};
const hace = (iso: string) => {
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  return min < 60 ? `hace ${Math.round(min)} min` : `hace ${(min / 60).toFixed(1)} h`;
};
const recienteOk = (iso: string) => RECIENTE_MIN == null || Date.now() - new Date(iso).getTime() <= RECIENTE_MIN * 60000;

if (!check(!!URL && !!ANON, 'env', URL && ANON ? 'SUPABASE_URL + anon key' : 'falta SUPABASE_URL o SUPABASE_ANON_KEY en .env raíz')) {
  process.exit(1);
}
const sb = createClient(URL!, ANON!);

// 1. Tablas con datos (anon puede leer las 4 por RLS)
for (const tabla of ['reportes', 'entidades', 'reporte_entidad', 'alertas'] as const) {
  const { count, error } = await sb.from(tabla).select('*', { count: 'exact', head: true });
  const opcional = tabla === 'alertas' && SOLO_BASE;
  if (error || count == null) check(false, `tabla ${tabla}`, error?.message || 'no existe o anon no la puede leer (¿schema.sql aplicado?)');
  else check((count ?? 0) > 0 || opcional, `tabla ${tabla}`, `${count} filas${opcional && !count ? ' (ok con --base)' : ''}`);
}

// 2. Alias de la demo (el seed planta 23 reportes en 5 provincias; cada detección real suma)
const { data: juli, error: eJuli } = await sb.rpc('resumen_entidad', { valor: ALIAS_DEMO, tipo: null });
if (eJuli) check(false, `resumen_entidad('${ALIAS_DEMO}')`, eJuli.message);
else
  check(
    juli?.encontrada && juli.reportes >= 23 && (juli.provincias?.length ?? 0) >= 5,
    `resumen_entidad('${ALIAS_DEMO}')`,
    `e_${juli?.entidad_id} · ${juli?.reportes} reportes · ${juli?.provincias?.length ?? 0} provincias · último ${juli?.ultimo ? hace(juli.ultimo) : '—'}`,
  );

// 3. Grafo no vacío y con el alias de la demo adentro
const { data: grafo, error: eGrafo } = await sb.rpc('grafo');
const nodos = new Set<string>((grafo?.nodes ?? []).map((n: { id: string }) => n.id));
if (eGrafo) check(false, 'grafo()', eGrafo.message);
else {
  check(nodos.size > 0 && (grafo?.links?.length ?? 0) > 0, 'grafo()', `${nodos.size} nodos · ${grafo?.links?.length ?? 0} links`);
  if (juli?.entidad_id) check(nodos.has(`e_${juli.entidad_id}`), `grafo() incluye e_${juli.entidad_id} (${ALIAS_DEMO})`);
}

// 4. Último caso real por WhatsApp + su alerta
if (!SOLO_BASE) {
  const { data: rep, error: eRep } = await sb
    .from('reportes')
    .select('id, modalidad, riesgo, remitente, texto, created_at')
    .eq('fuente', 'whatsapp')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eRep) check(false, "último reporte fuente='whatsapp'", eRep.message);
  else if (!rep) check(false, "último reporte fuente='whatsapp'", 'no hay ninguno: falta la primera detección real');
  else {
    const { data: ents } = await sb.from('reporte_entidad').select('entidad_id').eq('reporte_id', rep.id);
    check(
      recienteOk(rep.created_at),
      "último reporte fuente='whatsapp'",
      `r_${rep.id} · ${rep.modalidad} · riesgo ${rep.riesgo} · ${hace(rep.created_at)} · ${ents?.length ?? 0} entidades · "${String(rep.texto ?? '').slice(0, 60)}"`,
    );
  }

  const { data: al, error: eAl } = await sb
    .from('alertas')
    .select('id, reporte_id, riesgo, modalidad, enviada_a, entidad_ids, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eAl) check(false, 'última alerta', eAl.message);
  else if (!al) check(false, 'última alerta', 'no hay ninguna');
  else {
    const ids: number[] = al.entidad_ids ?? [];
    check(
      recienteOk(al.created_at) && ids.length > 0,
      'última alerta',
      `#${al.id} · r_${al.reporte_id} · ${al.modalidad} · riesgo ${al.riesgo} · ${hace(al.created_at)} · enviada a ${al.enviada_a?.length ?? 0} · entidad_ids [${ids.join(', ')}]`,
    );
    // La web destaca e_<id>: si no están en grafo() la alerta no ilumina nada.
    const faltan = ids.filter((id) => !nodos.has(`e_${id}`));
    check(faltan.length === 0 && ids.length > 0, 'entidad_ids de la alerta están en grafo()', faltan.length ? `faltan e_${faltan.join(', e_')}` : '');
    if (rep && al.reporte_id !== rep.id) console.log(`   ℹ️  la última alerta (r_${al.reporte_id}) no es del último reporte whatsapp (r_${rep.id})`);
  }
}

// 5. Web de producción (opcional)
if (WEB) {
  for (const path of ['/red', `/verificar?valor=${ALIAS_DEMO}`]) {
    try {
      const r = await fetch(WEB + path, { redirect: 'follow' });
      check(r.ok, `GET ${WEB}${path}`, `HTTP ${r.status}`);
    } catch (e) {
      check(false, `GET ${WEB}${path}`, (e as Error).message);
    }
  }
}

// 6. Realtime: INSERT en alertas (lo que escucha el feed de /red)
const suscripto = await new Promise<string>((ok) => {
  const t = setTimeout(() => ok('TIMEOUT (10 s)'), 10000);
  sb.channel('e2e-alertas')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas' }, (p) => {
      const a = p.new as { id: number; reporte_id: number; modalidad: string; riesgo: number; entidad_ids: number[] };
      console.log(`🔔 ${new Date().toLocaleTimeString('es-AR')} alerta #${a.id} · r_${a.reporte_id} · ${a.modalidad} · riesgo ${a.riesgo} · entidad_ids [${(a.entidad_ids ?? []).join(', ')}]`);
    })
    .subscribe((estado, err) => {
      if (estado === 'SUBSCRIBED' || estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') {
        clearTimeout(t);
        ok(err ? `${estado}: ${err.message}` : estado);
      }
    });
});
// SUBSCRIBED prueba el canal, no la publicación: eso solo lo prueba un INSERT real llegando (--watch).
check(suscripto === 'SUBSCRIBED', 'Realtime canal alertas', suscripto === 'SUBSCRIBED' ? 'suscripto (la publicación se confirma cuando llega un 🔔)' : suscripto);

const fallas = res.filter((r) => !r.ok);
console.log(`\n${fallas.length ? `✘ ${fallas.length} fallaron: ${fallas.map((f) => f.nombre).join(' · ')}` : '✔ todo verde'}`);

if (WATCH && suscripto === 'SUBSCRIBED') {
  console.log(`\nEscuchando INSERT en alertas${Number.isFinite(WATCH_S) ? ` por ${WATCH_S} s` : ' (Ctrl+C para salir)'}…`);
  if (Number.isFinite(WATCH_S)) setTimeout(() => process.exit(fallas.length ? 1 : 0), WATCH_S * 1000);
} else {
  process.exit(fallas.length ? 1 : 0);
}
