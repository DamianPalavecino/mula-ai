// Checklist antes de cada toma de la demo:
//   npm run pre-demo            → reset-demo + check prod contra Vercel + /health del worker en el VPS
//   npm run pre-demo -- --dry   → igual, pero el reset no borra nada (solo muestra qué borraría)
// Sale con 1 si algo da rojo.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const WEB_URL = 'https://mula-ai.vercel.app';

export function evaluarReset(status, out, { dry = false } = {}) {
  const juli = out.match(/juli\.martinez\.mp: .*/)?.[0];
  const detalle = (juli ?? out.trim().split('\n').at(-1) ?? 'sin salida') + (dry ? ' (dry: no borró nada)' : '');
  return { ok: status === 0 && !!juli, detalle };
}

export function evaluarProd(status, out) {
  const fallas = out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.replace(/^FAIL\s+/, ''));
  if (status === 0) return { ok: true, detalle: `Supabase + ${WEB_URL} ok` };
  if (status === 3) return { ok: false, detalle: 'omitido: faltan SUPABASE_URL / SUPABASE_ANON_KEY en .env' };
  return { ok: false, detalle: fallas.length ? fallas.join(' · ') : `exit ${status}` };
}

export function evaluarHealth(status, out) {
  let h = null;
  try { h = JSON.parse(out); } catch {}
  if (status !== 0 || !h) return { ok: false, detalle: `sin respuesta del worker (exit ${status}) ${out.trim().slice(0, 80)}` };
  return { ok: h.ok === true && h.whatsapp === 'conectado', detalle: `whatsapp: ${h.whatsapp}` };
}

function correr(titulo, cmd, env = {}) {
  console.log(`\n▶ ${titulo}: ${cmd}`);
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', env: { ...process.env, ...env } });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  process.stdout.write(out);
  return [r.status ?? 1, out];
}

async function main() {
  const dry = process.argv.includes('--dry');
  const pasos = [
    ['reset-demo', evaluarReset(...correr('reset-demo', `npm run reset-demo${dry ? ' -- --dry' : ''}`), { dry })],
    ['check prod', evaluarProd(...correr('check prod', 'npm run check prod', { WEB_URL }))],
    ['worker VPS', evaluarHealth(...correr('worker VPS', `ssh -o ConnectTimeout=10 contabo-vps 'curl -s -m 5 localhost:8080/health'`))],
  ];
  console.log('\n── Pre-demo ──');
  for (const [n, r] of pasos) console.log(`${r.ok ? '🟢' : '🔴'} ${n.padEnd(11)} ${r.detalle}`);
  const rojos = pasos.filter(([, r]) => !r.ok).length;
  console.log(rojos ? `\n🔴 ${rojos} en rojo: no grabes todavía.` : dry ? '\n🟢 Todo verde (dry): corré `npm run pre-demo` sin --dry antes de grabar.' : '\n🟢 Todo verde: a grabar.');
  process.exit(rojos ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
