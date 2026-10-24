# Estado del agente: worker-http

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.
Tarea completa: `docs/agentes/02-worker-http.md`. Worktree: `C:\Users\dami_\orca\workspaces\mula-ai\worker-http`.

## Hecho
- **Tarea 1 (`POST /analizar` + `GET /health`)**, en main (`9d59d5e`):
  - `worker/src/pipeline.ts`: `procesarMensaje({ texto, remitente, historial, enviar })` es el pipeline compartido por WhatsApp y HTTP. Las deps se inyectan para los tests.
  - `worker/src/http.ts`: server `node:http` (CORS `*`, 20 KB, 30/min por IP). El contrato está en `CLAUDE.md` → "HTTP del worker".
  - `worker/src/index.ts`: el listener usa el pipeline y levanta el HTTP en `PORT` ?? 8080.
  - `worker/src/alerts.ts`: `enviadorWhatsapp(sock)` reemplaza a `enviarAlertas`.
  - Tests en `worker/src/selftest.ts` (83 ok). Se corren con `npm run check worker`.
- Probado contra Supabase prod a las 12:53: r_182 + alerta #2, `npm run e2e` verde, 4,2 s con el LLM.
- **Tarea 2.1, latencia**: `CLASSIFIER_TIMEOUT_MS` ahora es el presupuesto TOTAL del LLM (intento + reintento, default 8000; antes 2×10 s). Si quedan menos de 1,5 s, no reintenta y cae a la heurística. Tests en `selftest.ts` → "classify: ...". `test:classify` 20/20 (~2,5 s por caso). El tiempo de punta a punta se loguea en `[clasif:...] ... N ms` y `[http] /analizar ... N ms`.
- **Tarea 2.2, test:classify**: 26 casos en `worker/src/classify.test-cases.ts`: +audio de comisaría, "soy de ANSES", falso comprador de Marketplace, familiar con historial y 2 normales. Con LLM exige riesgo ≥70 en estafas y ≤39 en normales. Para la seña ajusté el prompt en `classify.ts` (línea "riesgo: entero…"). Da 26/26.
- **Tarea 2.3, reconexión**: `worker/src/reconnect.ts` → `decidirReconexion(code, intentos)` (tests en `selftest.ts` → "reconexión: ..."). Con `logged out` borra `AUTH_DIR` y reconecta con QR nuevo (antes `exit(1)` → loop en Railway). Code 440 (otra instancia) espera 60 s y lo avisa. El resto usa backoff 2–30 s. Los errores de un mensaje puntual ya se atrapaban en `messages.upsert`.
- Docs: `.env.example` (`PORT`, `NEXT_PUBLIC_WORKER_URL`), `worker/README.md`, `CLAUDE.md`.

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- Nada a medio hacer: el working tree está limpio. La Tarea 2 no arrancó.

## Próximo paso
Tarea 2 del prompt 02, lo que queda:
1. Audio real con `OPENAI_API_KEY` (`worker/src/transcribe.ts`). Sin key no transcribe.
2. Opcional, latencia: si en la demo real pasa de 5 s, bajar `CLASSIFIER_TIMEOUT_MS` a ~5000 en Railway (no hace falta tocar código).

Reglas:
- Antes de pushear, `npm run check worker` en la raíz. Sin upstream, `npm run check` a secas no detecta los commits.
- Push con `git pull --rebase origin main && git push origin HEAD:main`.
- Para probar local sin pisar la sesión real de WhatsApp, usá `AUTH_DIR=<carpeta temporal> PORT=8790 npx tsx src/index.ts` desde `worker/`.
- En Windows, curl con tildes va con `--data-binary @body.json`: `-d '...'` manda latin1.

## Bloqueos / qué necesita del humano
- Deploy a Railway + **Generate Domain** → cargar esa URL en `NEXT_PUBLIC_WORKER_URL` de Vercel. Sin healthcheck en Railway: con dos instancias la sesión de WhatsApp se pisa (code 440).
- `FAMILY_GROUP_JID` y `TRUSTED_CONTACTS` en el entorno del worker. Sin ellos alerta solo al chat propio y trata a todos como desconocidos.
- Opcional: borrar el reporte de prueba r_182 (texto con `�`) desde el SQL editor.
- CLI de supabase: `/c/Users/dami_/AppData/Local/Programs/Supabase/supabase.exe`. No está linkeado y para el worker no hace falta.
