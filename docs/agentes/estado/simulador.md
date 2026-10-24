# Estado del agente: simulador

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.
Tarea original: `docs/agentes/03-web-simulador.md`. Toca solo `web/` (menos `/me-estafaron` y `web/app/api/**`).

## Hecho
- `/simulador` (`web/components/Simulador.tsx`, `web/app/simulador/page.tsx`) + versión compacta en el hero de `/` (`web/app/page.tsx`) + link en `web/components/Header.tsx`.
- Lógica en `web/lib/simulador.ts`: `analizar()` hace `POST ${NEXT_PUBLIC_WORKER_URL}/analizar` con `{ texto, remitente: "simulador" }` (+ `enviar_whatsapp: true` con el toggle) y, si no hay URL, el worker falla o tarda >15 s, usa `mockAnalizar()` (aparece "modo demo" chiquito). Tipo `RespuestaAnalizar` en `web/lib/tipos.ts`.
- Tests: `web/lib/simulador.test.ts` (`cd web && npm test`, node --test). `npm run check web` = `npm test` + `npm run build`, verde a las 12:59.
- `/red`: el feed (`web/components/AlertFeed.tsx`) muestra `*negrita*` de WhatsApp; destacado del nodo, zoom y recarga de `grafo()` ya estaban de antes (`RedView.tsx`, `Graph.tsx`).
- Probado 12:58 contra worker local + Supabase prod: alerta en ~7 s, registrada y visible "recién" en el feed de `/red`; `npm run e2e -- --reciente 10` verde.
- 12:59: restaurado el simulador que había borrado `ea0610f` (/me-estafaron commiteó desde un árbol viejo). Commit `96675b2`.

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- Nada a medias. Todo lo de arriba está en `main`.

## Próximo paso
1. Cuando el worker del VPS tenga URL **HTTPS**: cargar `NEXT_PUBLIC_WORKER_URL` en Vercel (sin `/analizar`) y redeployar (se embebe en el build). Probar `/simulador` en la URL de Vercel: no debe decir "modo demo".
2. Mirar a ojo en `/red` que el nodo de la alerta nueva pulse en rojo y el grafo haga zoom (las capturas del navegador de Orca no muestran bien el canvas).
3. Si sobra tiempo: pulido de la landing (Tarea 3 de `03-web-simulador.md`).

Para probar en local sin tocar `.env*`: `cd worker && AUTH_DIR=<carpeta vacía> PORT=8080 npx tsx src/index.ts` (carpeta vacía para no patear la sesión real de WhatsApp) y `cd web && NEXT_PUBLIC_WORKER_URL=http://localhost:8080 npm run build && npx next start -p 3107`.

## Bloqueos / qué necesita del humano
- URL HTTPS pública del worker en el VPS → `NEXT_PUBLIC_WORKER_URL` en Vercel. Con `http://` el navegador lo bloquea desde Vercel y cae al mock sin avisar.
- Antes de grabar: `npm run reset-demo` (mis pruebas dejaron 3 reportes de ensayo; juli quedó en 27).
