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
- **FRENADO 14:0x por orden del humano** (plan 06: sin rutas públicas viejas; web/ la toca el orquestador). Esperando instrucciones. No pushear nada de esto sobre landing, Header, /app ni /admin.
- Rediseño de verificar hecho y probado (tests + build verdes, capturas ok), **sin pushear**: commit local `6d9e2f5` en la rama local `wip-verificar-ux` de este worktree (`git show wip-verificar-ux --stat`). Para portar:
  - `web/lib/verificar.ts` + `web/lib/verificar.test.ts`: `validarValor(v)` → `{ok, tipo}` o `{ok:false, error}` (alias 6–20, CBU/CVU 22 dígitos, teléfono 8–13, CUIT 11 con prefijo, link; vacío = sin mensaje) y `EJEMPLOS_VERIFICAR` (reales de prod: juli.martinez.mp 28, CBU 0110599540000123456782 9, tel 1167891234 16, limpio maria.lopez.ok 0). 4 tests en `npm test`.
  - `web/components/VerificarForm.tsx` (client): input grande con ícono y badge del tipo detectado, botón deshabilitado hasta que sea válido, error inline corto, spinner, chips rojos/verde de un clic que consultan solos. Props `base` (`/app/verificar` o `/admin/verificar`) e `inicial`; navega a `${base}?valor=` (la página server-side consulta).
  - `web/components/ResumenCard.tsx` (mismas props): rojo con número gigante + chips de provincias/modalidades con íconos + monto/último; verde "Sin reportes". Sirve en /app, /admin y el panel del grafo (`compacto`).
  - `web/components/iconos.tsx`: SVG inline (peligro, ok, buscar, ubicación, plata, reloj, guion, spinner).
  - `web/app/globals.css`: tokens `--color-seguro`, `--color-seguro-fondo`, `--color-seguro-linea`.
  - Uso en páginas (en la rama wip): en `app/app/verificar/page.tsx` y `app/admin/verificar/page.tsx`, reemplazar el `<form method="GET">` por `<VerificarForm key={valor} base="..." inicial={valor} />`, título "Verificá antes de pagar", sin párrafo.

## Próximo paso
- Esperar instrucciones. Si dicen portar: `git checkout wip-verificar-ux -- web/lib/verificar.ts web/lib/verificar.test.ts web/components/VerificarForm.tsx web/components/iconos.tsx` (+ ResumenCard/globals.css mirando el diff contra main, que cambió), `npm run check web`, push.
- El simulador público y `/red` ya no existen (plan 06); lo de NEXT_PUBLIC_WORKER_URL quedó obsoleto.

## Bloqueos / qué necesita del humano
- URL HTTPS pública del worker en el VPS → `NEXT_PUBLIC_WORKER_URL` en Vercel. Con `http://` el navegador lo bloquea desde Vercel y cae al mock sin avisar.
- Antes de grabar: `npm run reset-demo` (mis pruebas dejaron 3 reportes de ensayo; juli quedó en 27).
