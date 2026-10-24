# Estado del agente: demo

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.
Brief: `docs/agentes/05-demo.md`. Toca solo `docs/demo/**` y `README.md` (+ `supabase/reset-demo.ts`, ya hecho).

## Hecho
- `docs/demo/guion.md`: video 0:00–2:00 (voz en off exacta, pantalla, celulares), plan A WhatsApp / plan B `/simulador`, shot list, toma de respaldo, fallas.
- `docs/demo/mensajes.md`: estafa (texto, en 2 mensajes, audio 10 s, falso ANSES), 3 normales, valores para `/verificar`.
- `docs/demo/jurado.md`: 11 preguntas + pitch 30 s y 2 min.
- `docs/demo/checklist.md`: 14:30 → 15:45 con quién y hora; título y descripción de YouTube.
- `docs/demo/capturas/`: `chat.png`, `comprobante.png` (+ HTML fuente, banco inventado "Banco Ombú", alias/CVU/teléfono del cluster juli).
- `README.md` para el jurado con placeholders `TODO_URL` y `TODO_VIDEO`.
- `npm run reset-demo` (`supabase/reset-demo.ts`): borra reportes `fuente in (whatsapp, victima)` + entidades huérfanas y verifica juli = 23/5. `--dry` probado contra prod 12:55: 1 reporte de ensayo, juli 24/5.
- Chequeo de secretos en la historia: limpio (12:25).

## En curso
- Nada a medio hacer. `npm run reset-demo` (sin `--dry`) **no se corrió**: esperando OK de Damian (borraría el reporte whatsapp que usa `npm run e2e`). Recomendado: correrlo justo antes de grabar.

## Próximo paso
1. Cuando Damian diga: `npm run reset-demo` → tiene que imprimir `juli.martinez.mp: 23 reportes · 5 provincias`. Marcar en `PROGRESS.md` ("reset-demo contra prod") con hora.
2. Cuando estén mergeados `/simulador` y `/me-estafaron`: probar las capturas de `docs/demo/capturas/` en `/me-estafaron` y verificar que los mensajes de `docs/demo/mensajes.md` coincidan con los precargados del simulador. Si alguna feature se corta, sacarla de la sección Demo de `README.md`.
3. Con URL de Vercel y link de YouTube: reemplazar `TODO_URL`/`TODO_VIDEO` en `README.md` y en la descripción de `docs/demo/checklist.md`.
4. 15:30: re-correr los comandos de secretos de `docs/demo/checklist.md`.

## Bloqueos / qué necesita del humano
- OK para el reset real (o hacerlo él antes de grabar).
- Celulares (abuela, estafador, familia) y número del estafador fuera de `TRUSTED_CONTACTS` y dentro de `ANALIZAR_SOLO` si está cargado.
- URL de Vercel y video de YouTube.
