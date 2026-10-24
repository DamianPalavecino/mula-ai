# Deploy — Mula AI

Sin valores secretos acá. Las claves se cargan en cada servicio, nunca en el repo.

## URLs
- Supabase: _(completar: https://xxxx.supabase.co)_
- Web (Vercel): https://mula-ai.vercel.app
- Worker: VPS Contabo (`contabo-vps` por Tailscale), servicio systemd de usuario `mula-worker`. Dominio público: _(pendiente)_

## 1. Supabase
1. supabase.com → New project (región São Paulo). Guardá la contraseña de la base.
2. SQL Editor → New query → pegar `supabase/schema.sql` → Run. Otra query → `supabase/functions.sql` → Run.
3. Project Settings → API: copiar **Project URL**, **anon** y **service_role**.
4. Seed (en la raíz del repo, PowerShell; las claves quedan solo en esa terminal):
   ```powershell
   $env:SUPABASE_URL="https://xxxx.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="<service_role>"
   npm install; npm run check supabase
   ```
5. Smoke con la anon key (lo mismo que ve la web):
   ```powershell
   $env:SUPABASE_ANON_KEY="<anon>"; npm run check prod
   ```
   Verifica: `juli.martinez.mp` ≥23 reportes en ≥5 provincias, `grafo()` con nodos y links, anon lee `alertas` y **no** puede escribir.
6. Realtime: Database → Publications → `supabase_realtime` tiene que incluir `alertas` (lo hace `schema.sql`).

### CLI de Supabase (opcional)
No está en el PATH: `C:\Users\dami_\AppData\Local\Programs\Supabase\supabase.exe` (bash: `/c/Users/dami_/AppData/Local/Programs/Supabase/supabase.exe`). Logueado; el repo se linkea una vez por worktree (`supabase/.temp`, ignorado):
```bash
supabase.exe link --project-ref <ref>                       # el ref sale de `supabase.exe projects list`
supabase.exe db query --linked -f supabase/schema.sql       # aplicar SQL a prod (después functions.sql)
supabase.exe db query --linked "select fuente, count(*) from reportes group by 1"
```

## 2. Vercel (web)
1. vercel.com → Add New → Project → importar `damianpalavecino/mula-ai`.
2. **Root Directory: `web`** (Next.js se detecta solo).
3. Environment Variables (Production):
   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon (**nunca** la service_role) |
   | `NEXT_PUBLIC_WORKER_URL` | _(cuando el worker tenga URL pública)_ URL del worker en el VPS |
   | `OPENROUTER_API_KEY` (y opcional `SUPABASE_SERVICE_ROLE_KEY`, `EXTRACTOR_MODEL`) | para `/me-estafaron`; server-only, **sin** `NEXT_PUBLIC_` |
4. Deploy. Cada vez que cambies una `NEXT_PUBLIC_*` → Redeploy (se embeben en el build).
5. Smoke: `$env:WEB_URL="https://<proyecto>.vercel.app"; npm run check prod` (prueba `/`, `/verificar?valor=juli.martinez.mp` y `/red`). Después abrilos en incógnito.

## 3. Worker (VPS)
Corre en el VPS de Damian (Contabo, alias ssh `contabo-vps` por Tailscale) como servicio systemd de usuario `mula-worker` (`Restart=always`, arranca solo si reinicia el VPS). **Una sola instancia**: WhatsApp se vincula por QR en el VPS, nunca local (dos procesos con la misma sesión se patean, code 440).

- Repo: `~/Spaces/personal/mula-ai` (clon de `main`). Start: `worker/node_modules/.bin/tsx src/index.ts`.
- Variables: `~/.config/mula-ai/worker.conf` (chmod 600). `AUTH_DIR=/home/agente/mula-data/auth_info`, fuera del repo: un deploy no toca la sesión.
- HTTP: `:8080` (`GET /health`, `POST /analizar`), hoy solo dentro de la tailnet.

Comandos (desde la raíz del repo, en la Mac de Damian):

| Para | Comando |
|---|---|
| Ver logs (últimas 60, sin el QR) | `worker/scripts/vps.sh logs` |
| Logs en vivo | `ssh contabo-vps 'journalctl --user -u mula-worker -f -o cat'` |
| Reiniciar | `worker/scripts/vps.sh restart` |
| Estado / salud | `worker/scripts/vps.sh status` · `ssh contabo-vps 'curl -s localhost:8080/health'` |
| Deployar `main` | `worker/scripts/vps.sh deploy` (pull + `npm ci` + restart) |
| Cargar variable no secreta | `worker/scripts/vps.sh set FAMILY_GROUP_JID 1203...@g.us` (reinicia) |
| Ver qué variables hay | `worker/scripts/vps.sh vars` (solo nombres) |
| QR para vincular | `worker/scripts/vps.sh qr` (abre el último en el navegador; vence en ~20 s) |

Variables cargadas: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `CLASSIFIER_MODEL`, `PROTEGIDO_NOMBRE`, `PROVINCIA_DEFAULT`, `AUTH_DIR`, `ANALIZAR_SOLO` (los 2 celulares de la demo). Faltan (cerca de la demo): `FAMILY_GROUP_JID` (los JID salen en los logs como `[grupos] ...` al conectar), `TRUSTED_CONTACTS`; `OPENAI_API_KEY` opcional (audios).

### Re-vincular el QR
- `sesión cerrada (logged out)` en los logs → `ssh contabo-vps 'rm -rf ~/mula-data/auth_info/*'`, `worker/scripts/vps.sh restart` y `worker/scripts/vps.sh qr`.
- code 440 = dos procesos con la misma sesión: verificar que no haya un worker local corriendo (`pkill -f "tsx.*src/index.ts"`).
- Después de escanear, un code 515 seguido de `[wa] conectado como ...` es normal.

## 4. Smoke de punta a punta
Desde otro número, al número protegido:
> hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá a juli.martinez.mp

Tiene que: llegar la alerta al chat propio y al grupo familiar, aparecer en el feed de `/red`, y `juli.martinez.mp` sumar 1 reporte en `/verificar`.
