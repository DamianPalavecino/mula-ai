# Estado del agente: deploy

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.

## Hecho
- `docs/deploy.md`: guía por servicio (Supabase, Vercel, worker en VPS), variables, re-vinculación del QR. Sin secretos.
- `npm run check prod` (`scripts/smoke-prod.mjs`): carga `.env` de la raíz; con `WEB_URL=https://mula-ai.vercel.app` prueba también la web.
- 12:55 Supabase prod (MulaAI, ref `rldsoshlnhwkccfakkjm`) aplicado y sembrado.
- CLI Supabase: `/c/Users/dami_/AppData/Local/Programs/Supabase/supabase.exe` (no está en PATH). Este worktree ya está linkeado: `supabase.exe db query --linked "<sql>"`.
- 13:0x Vercel https://mula-ai.vercel.app verificado: `check prod` 9/9, bundle con la URL de Supabase prod, `OPENROUTER_API_KEY` cargada (`POST /api/extraer` con `{}` da 400, no 503).

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- URL HTTPS pública del worker con Tailscale Funnel. Host: `contabo-damian.tail6fe934.ts.net` → URL será `https://contabo-damian.tail6fe934.ts.net`. Worker sano (`curl localhost:8080/health` en el VPS → `{"ok":true,"whatsapp":"conectado"}`).
  - 13:1x `tailscale funnel --bg 8080` respondió "Funnel is not enabled on your tailnet" → **esperando al humano** (ver Bloqueos).
  - Cuando lo habilite: `ssh contabo-vps 'tailscale funnel --bg 8080'` y desde esta PC `curl https://contabo-damian.tail6fe934.ts.net/health`.

## Próximo paso
- Con la URL: `NEXT_PUBLIC_WORKER_URL=https://<host>.ts.net` (sin `/analizar`) en Vercel + redeploy (humano). Verificar que `/simulador` en Vercel no diga "modo demo".
- Anotar la URL en `docs/deploy.md` → URLs.
- Smoke de punta a punta (`docs/deploy.md` §4).

## Bloqueos / qué necesita del humano
- Habilitar Funnel en el tailnet: abrir https://login.tailscale.com/f/funnel?node=n63PNYNzf311CNTRL y aprobar (admin de Tailscale).
- Vercel (no hay CLI; no se leen `.env*`): cargar `NEXT_PUBLIC_WORKER_URL` y redeploy.
- Smoke de WhatsApp: mandar el mensaje de §4 desde otro número.
