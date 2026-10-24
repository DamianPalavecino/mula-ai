# Estado del agente: deploy

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.

## Hecho
- `docs/deploy.md`: guía por servicio (Supabase, Vercel, worker en VPS), variables, re-vinculación del QR. Sin secretos.
- `npm run check prod` (`scripts/smoke-prod.mjs`): carga `.env` de la raíz; con `WEB_URL=https://mula-ai.vercel.app` prueba también la web.
- 12:55 Supabase prod (MulaAI, ref `rldsoshlnhwkccfakkjm`) aplicado y sembrado.
- CLI Supabase: `/c/Users/dami_/AppData/Local/Programs/Supabase/supabase.exe` (no está en PATH). Este worktree ya está linkeado: `supabase.exe db query --linked "<sql>"`.
- 13:0x Vercel https://mula-ai.vercel.app verificado: `check prod` 9/9, bundle con la URL de Supabase prod, `OPENROUTER_API_KEY` cargada (`POST /api/extraer` con `{}` da 400, no 503).

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- URL HTTPS pública del worker (VPS `:8080`, hoy solo tailnet) con Tailscale Funnel: `ssh contabo-vps 'tailscale funnel --bg 8080'` → probar `curl https://<host>.ts.net/health` desde afuera.

## Próximo paso
- Con la URL: `NEXT_PUBLIC_WORKER_URL=https://<host>.ts.net` (sin `/analizar`) en Vercel + redeploy (humano). Verificar que `/simulador` en Vercel no diga "modo demo".
- Anotar la URL en `docs/deploy.md` → URLs.
- Smoke de punta a punta (`docs/deploy.md` §4).

## Bloqueos / qué necesita del humano
- Vercel (no hay CLI; no se leen `.env*`): cargar `NEXT_PUBLIC_WORKER_URL` y redeploy.
- Smoke de WhatsApp: mandar el mensaje de §4 desde otro número.
