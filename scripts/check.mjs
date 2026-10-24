// Corre solo los chequeos de las features tocadas y anota el resultado en PROGRESS.md.
//   npm run check              → features con cambios (working tree + commits sin pushear)
//   npm run check worker web   → esas features
//   npm run check all          → todas menos las manuales
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const FEATURES = {
  worker: { paths: ['worker/'], cwd: 'worker', cmds: ['npm run typecheck', 'npm run selftest'] },
  // pega a OpenRouter (cuesta tokens); sin OPENROUTER_API_KEY prueba solo la heurística
  classify: { paths: ['worker/src/classify'], cwd: 'worker', cmds: ['npm run test:classify'] },
  web: { paths: ['web/'], cwd: 'web', cmds: ['npm test', 'npm run build'] },
  // manual: re-siembra la base del entorno (borra solo lo sintético) y falla si juli.martinez.mp no da 23/5
  supabase: { paths: ['supabase/'], cwd: '.', cmds: ['npm run seed'], manual: true },
  // manual: lee la base real con la anon key (tablas, demo, grafo, último caso de WhatsApp + alerta, Realtime)
  e2e: { paths: ['scripts/e2e-check.mts'], cwd: '.', cmds: ['npm run e2e'], manual: true },
  // manual: prod con la anon key (SUPABASE_URL, SUPABASE_ANON_KEY y opcional WEB_URL en el entorno)
  // checklist de la toma: solo la lógica (sin red); `npm run pre-demo` corre lo real
  'pre-demo': { paths: ['scripts/pre-demo'], cwd: '.', cmds: ['node --test scripts/pre-demo.test.mjs'] },
  prod: { paths: ['scripts/smoke-prod'], cwd: '.', cmds: ['node --env-file-if-exists=.env scripts/smoke-prod.mjs'], manual: true },
};

const git = (cmd) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8' }); } catch { return ''; } };
const changed = [git('diff --name-only HEAD'), git('ls-files --others --exclude-standard'), git('diff --name-only @{u}..HEAD')]
  .join('\n').split('\n').filter(Boolean);

const args = process.argv.slice(2);
const all = Object.keys(FEATURES);
let names;
if (args.includes('all')) names = all.filter((n) => !FEATURES[n].manual);
else if (args.length) names = args;
else {
  const touched = all.filter((n) => FEATURES[n].paths.some((p) => changed.some((f) => f.startsWith(p))));
  for (const n of touched.filter((n) => FEATURES[n].manual)) console.log(`! ${n} cambió pero es manual: npm run check ${n}`);
  names = touched.filter((n) => !FEATURES[n].manual);
}

const unknown = names.filter((n) => !FEATURES[n]);
if (unknown.length) { console.error(`feature desconocida: ${unknown.join(', ')}. Hay: ${all.join(', ')}`); process.exit(2); }
if (!names.length) { console.log('Nada que chequear (sin cambios en features). Usá `npm run check all`.'); process.exit(0); }

const commit = git('rev-parse --short HEAD').trim();
const rows = [];
for (const n of names) {
  for (const cmd of FEATURES[n].cmds) {
    console.log(`\n▶ [${n}] ${cmd}`);
    const t = Date.now();
    const r = spawnSync(cmd, { cwd: FEATURES[n].cwd, stdio: 'inherit', shell: true });
    // exit 3 = omitido (ej. falta una key): no rompe el check pero queda visible
    const res = r.status === 0 ? '✅' : r.status === 3 ? '⏭️ omitido' : '❌';
    rows.push({ n, cmd, ok: res !== '❌', res, s: Math.round((Date.now() - t) / 1000) });
    console.log(`${res} [${n}] ${cmd} (${rows.at(-1).s}s)`);
  }
}

// Una fila por comando: la última corrida pisa la anterior.
const START = '<!-- check:start -->', END = '<!-- check:end -->';
const md = readFileSync('PROGRESS.md', 'utf8');
const [head, rest] = md.split(START);
const [block, tail] = rest.split(END);
const prev = new Map(block.split('\n').filter((l) => l.startsWith('| `')).map((l) => [l.split('|').slice(1, 3).join('|'), l]));
const when = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false });
for (const r of rows) prev.set(` \`${r.n}\` | \`${r.cmd}\` `, `| \`${r.n}\` | \`${r.cmd}\` | ${r.res} | ${r.s}s | ${when} | ${commit} |`);
const table = ['| Feature | Comando | Resultado | Duración | Cuándo | Commit |', '|---|---|---|---|---|---|', ...[...prev.values()].sort()];
writeFileSync('PROGRESS.md', `${head}${START}\n${table.join('\n')}\n${END}${tail}`);

const failed = rows.filter((r) => !r.ok);
console.log(`\n${failed.length ? `✘ ${failed.length} fallaron` : '✔ todo verde'} · PROGRESS.md actualizado`);
process.exit(failed.length ? 1 : 0);
