# Deploy — Mula AI

Sin valores secretos acá. Las claves se cargan en cada servicio, nunca en el repo.

## URLs
- Supabase: _(completar: https://xxxx.supabase.co)_
- Web (Vercel): _(completar)_
- Worker (Railway): _(completar; dominio público cuando exponga HTTP)_

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

## 2. Vercel (web)
1. vercel.com → Add New → Project → importar `damianpalavecino/mula-ai`.
2. **Root Directory: `web`** (Next.js se detecta solo).
3. Environment Variables (Production):
   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon (**nunca** la service_role) |
   | `NEXT_PUBLIC_WORKER_URL` | _(cuando el worker exponga HTTP)_ dominio de Railway |
   | `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | _(solo si `/me-estafaron` entra; sin `NEXT_PUBLIC_`)_ |
4. Deploy. Cada vez que cambies una `NEXT_PUBLIC_*` → Redeploy (se embeben en el build).
5. Smoke: `$env:WEB_URL="https://<proyecto>.vercel.app"; npm run check prod` (prueba `/`, `/verificar?valor=juli.martinez.mp` y `/red`). Después abrilos en incógnito.

## 3. Railway (worker)
1. railway.com → New Project → Deploy from GitHub repo → `mula-ai`.
2. Service → Settings:
   - **Root Directory:** `worker`
   - **Config file path:** `/worker/railway.json` (start `npm start`, restart always, 1 réplica)
3. Service → Add Volume → mount path **`/data`**.
4. Variables:
   | Variable | Valor |
   |---|---|
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role |
   | `OPENROUTER_API_KEY` | key de OpenRouter (sin ella, solo heurística) |
   | `AUTH_DIR` | `/data/auth_info` |
   | `PROTEGIDO_NOMBRE` | ej. `la abuela Marta` |
   | `TRUSTED_CONTACTS` | teléfonos de confianza separados por coma |
   | `PROVINCIA_DEFAULT` | `Santa Fe` |
   | `FAMILY_GROUP_JID` | después del primer arranque (ver abajo) |
   | `OPENAI_API_KEY` | opcional, audios |
5. Deploy → Logs → escanear el QR con el número **secundario** (WhatsApp → Dispositivos vinculados). Tiene que quedar `[wa] conectado como ...` (antes puede reiniciar con code 515, es normal).
6. En los logs aparece `[grupos] ...` con los JID: copiar el `...@g.us` del grupo familiar a `FAMILY_GROUP_JID` → redeploy. Si no pide QR de nuevo, la sesión quedó en el volumen.
7. Si expone HTTP: Settings → Networking → Generate Domain → pasarlo a `NEXT_PUBLIC_WORKER_URL` en Vercel.

### Re-vincular el QR
- `sesión cerrada (logged out)` en los logs → borrar `/data/auth_info` (o recrear el volumen) y redeploy.
- code 440 = dos procesos con la misma sesión: dejar **una sola réplica** y apagar el worker local.

## 4. Smoke de punta a punta
Desde otro número, al número protegido:
> hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá a juli.martinez.mp

Tiene que: llegar la alerta al chat propio y al grupo familiar, aparecer en el feed de `/red`, y `juli.martinez.mp` sumar 1 reporte en `/verificar`.
