# Estado del agente: deploy

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.

## Hecho
- `docs/deploy.md`: guía por servicio (Supabase, Vercel, worker en VPS), variables y re-vinculación del QR. Sin secretos.
- `scripts/smoke-prod.mjs` + feature `prod` en `scripts/check.mjs`: `npm run check prod` (carga `.env` de la raíz solo; con `WEB_URL` prueba la web).
- 12:55 Supabase prod (MulaAI, ref `rldsoshlnhwkccfakkjm`) aplicado y sembrado; `npm run check prod` 6/6.
- CLI de Supabase: `/c/Users/dami_/AppData/Local/Programs/Supabase/supabase.exe` (no está en PATH). Worktree ya linkeado; `supabase.exe db query --linked "<sql>"` anda.
- Vercel: hay deploy en https://mula-ai.vercel.app (lo hizo otro agente/humano).

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- Verificar Vercel: `WEB_URL=https://mula-ai.vercel.app npm run check prod` (raíz del worktree). Falta correrlo y marcar en `PROGRESS.md` la línea "`npm run check prod` con `WEB_URL` contra Vercel".

## Próximo paso
- Si da verde: completar en `docs/deploy.md` → URLs la de Supabase (`https://rldsoshlnhwkccfakkjm.supabase.co`) y marcar PROGRESS.
- Worker HTTP público (VPS `:8080`, hoy solo tailnet) → `NEXT_PUBLIC_WORKER_URL` en Vercel + redeploy (lo coordina con `worker-http`/`simulador`).
- Smoke punta a punta (`docs/deploy.md` §4).

## Bloqueos / qué necesita del humano
- Cargar variables en Vercel (no hay CLI de vercel; no se leen `.env*`): `OPENROUTER_API_KEY` server-only para `/me-estafaron`; `NEXT_PUBLIC_WORKER_URL` cuando exista.
- Smoke de WhatsApp: mandar el mensaje de §4 desde otro número.
