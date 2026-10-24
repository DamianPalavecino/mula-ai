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
- Docs: `.env.example` (`PORT`, `NEXT_PUBLIC_WORKER_URL`), `worker/README.md`, `CLAUDE.md`.

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- Nada a medio hacer: el working tree está limpio. La Tarea 2 no arrancó.

## Próximo paso
Tarea 2 del prompt 02, en este orden:
1. **Latencia (<5 s de punta a punta)**: el LLM tarda 2,5–6 s (`[http] /analizar ... ms` y `[clasif:...] ... ms` en el log).
   - Idea 1: bajar `CLASSIFIER_TIMEOUT_MS` (default 10000 en `worker/src/config.ts`). Hoy hay un reintento en `worker/src/classify.ts` → `llamarOpenRouter`, así que el peor caso son 2× el timeout antes de caer a la heurística.
   - Idea 2: acotar el reintento a un tiempo total.
2. `npm run test:classify` (en `worker/`, LLM real, hoy da 20/20): sumar casos en `worker/src/classify.test-cases.ts`: audio transcripto (`[audio transcripto] ...`), "soy de ANSES", falso comprador de Marketplace. Meta: estafas ≥70, normales <40.
3. Reconexión de Baileys: ya hay backoff en `index.ts` → `conectar()`; revisar que `logged out` loguee claro.
4. Audio real con `OPENAI_API_KEY` (`worker/src/transcribe.ts`). Hoy no hay key: el worker avisa y no transcribe.

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
