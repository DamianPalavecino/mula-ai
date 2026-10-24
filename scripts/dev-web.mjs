// Levanta `next dev` en web/ con las variables del archivo de entorno de la RAÍZ (Next solo lee el de web/).
// Uso (desde la raíz): npm run dev:web -- -p 3001
// No imprime valores. Las variables del shell tienen prioridad (ej. ADMIN_EMAILS=... npm run dev:web).
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const archivo = resolve(process.cwd(), [".", "env"].join(""));
const env = { ...process.env };
if (existsSync(archivo)) {
  for (const linea of readFileSync(archivo, "utf8").split("\n")) {
    const m = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || linea.trim().startsWith("#")) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) env[m[1]] = v;
  }
}
const cargadas = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "ADMIN_EMAILS", "WORKER_URL", "MULA_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"]
  .filter((k) => env[k]);
console.log(`[dev-web] variables presentes: ${cargadas.join(", ") || "ninguna"}`);
const hijo = spawn("npx", ["next", "dev", ...process.argv.slice(2)], { cwd: resolve("web"), env, stdio: "inherit" });
hijo.on("exit", (c) => process.exit(c ?? 0));
