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
- **Líder del rediseño: panel único en `/app`** (base: prototipo `docs/design/` + skills Emil/Jakub). Pusheado:
  1. `8cf6a00` tokens (`globals.css`: seguro, bosque, lima, papel, `--ease-salida`, `.presionable`), `components/iconos.tsx`, `lib/verificar.ts` (+test), `ResumenCard` nueva.
  2. `e1df11e` `components/Panel.tsx` (client, pestañas inicio/probar/verificar/me-estafaron/red/ajustes, `?tab=` con `history.replaceState`, pestañas visitadas quedan montadas) + `components/VerificarPanel.tsx` (consulta `/admin/api/resumen`) + `app/app/page.tsx` (carga todo server-side: requireUser, misProtegidos/misAlertas por owner, grafo, stats).
  3. `5f23d51` redirects: `/app/verificar`, `/admin/verificar` → `?tab=verificar`; `/app/me-estafaron` → `?tab=me-estafaron`; `/app/setup` → `?tab=ajustes` (la action sigue en `app/app/setup/actions.ts`); `/admin` → `?tab=red`. APIs de `/app/api` y `/admin/api` intactas.
- Más pasos pusheados: `5786838` header mínimo con sesión; `ec412bd` "Probar" con look WhatsApp + ejemplos de un clic (`lib/probar.ts` + test); `b34bc35` **`DESIGN.md`** (raíz, fuente de verdad) + `web/lib/tokens.test.ts` (falla si el bloque ```css tokens``` de DESIGN.md y el `@theme` de `globals.css` no son 1:1; corre en `npm run check web`, que ahora también mira `DESIGN.md`); `407dd78` **`/styleguide`** (`components/Styleguide.tsx`: tokens, botones, input con validación, chips, badges, ResumenCard, alerta, tabs, sidebar, tabla, drawer, toast, estados, WhatsApp, nodos; tema día/noche y densidad en vivo; sin datos reales, sin link, noindex).
- Para cambiar un token: editarlo en `DESIGN.md` **y** en `web/app/globals.css` (mismo nombre y valor).
- **15:11 `288cfa1`: /app sobre Efferd app-shell-4** (pedido del humano: sin banner verde, sin atajos repetidos, sin pills inútiles). `components.json` (registry `@efferd`), `components/ui/*` de shadcn, `lib/utils.ts` (cn), `hooks/use-mobile.ts`. `components/app-shell.tsx` + `components/app-sidebar.tsx` (adaptados de Efferd: sidebar flotante colapsable, drawer en mobile con ítems de 44 px; protegido como encabezado chico con estado; secciones Inicio, Alertas, Probar, Verificar, Me estafaron, Red, Ajustes; badge de alertas en Inicio; Vincular WhatsApp y UserButton en el footer). `Panel.tsx`: stats en fila de cards chicas + alertas en vivo como contenido de Inicio; "Alertas" = alertas de la red. Variables de shadcn mapeadas a tokens en `:root` de `globals.css` (documentado en DESIGN.md). El header global se oculta en /app (`data-header-global` + `<style>` en el shell). Tabs en `lib/panel.ts` (no en módulos "use client": eso dio un 500, ver `e85f79f`).
- **No tocar** `Graph.tsx`, `colores.ts` ni la leyenda: los rediseña el agente me-estafaron.
- **15:3x `6370690`, `b4be30d`, `145c1b1`: Inicio = chat con IA.** Lugar reservado en `components/InicioChat.tsx` (placeholder con sugerencias que abren secciones); contrato con chat-ia en `docs/agentes/estado/chat.md` (`components/chat/Chat.tsx`, default export, props `protegido` y `onIr`). Sidebar sin "Inicio" (el chat es la vista por defecto; el logo vuelve) ni "Alertas". **Alertas en la campana del top bar** (`components/AlertasCampana.tsx`): badge rojo de no vistas (`lib/alertasVistas.ts` + test, último id visto en localStorage), panel con `AppAlertas` siempre montado (polling autenticado; nueva prop opcional `onCambio`); Esc/clic afuera cierra; en mobile ocupa el ancho. `UserButton` pasó al top bar. `PublicNav` también lleva `data-header-global` (se oculta dentro del panel).
- Reparto: la sección **Red** (grafo, card del nodo, alertas de Red) es del agente me-estafaron; yo solo la monto (`AdminRed` en `Panel.tsx`).
- Ojo: `qrcode` es dependencia nueva (de `/app/vincular`): `cd web && npm install` antes de buildear.
- Capturas sin login: ruta temporal `app/preview-panel/page.tsx` (NO commitear) que renderiza `<Panel>` con datos fijos dentro de `<Suspense>` + `await connection()`; mirar con el navegador de Orca.

## Próximo paso
- Cuando chat-ia pushee `web/components/chat/Chat.tsx`: en `components/InicioChat.tsx` reemplazar el placeholder por `<Chat protegido={protegido} onIr={onIr} />` (mirar `docs/agentes/estado/chat.md`), `npm run check web`, push.
- Probar /app con login real en Vercel (1080p y 375 px): campana, drawer, cada sección.

## Bloqueos / qué necesita del humano
- URL HTTPS pública del worker en el VPS → `NEXT_PUBLIC_WORKER_URL` en Vercel. Con `http://` el navegador lo bloquea desde Vercel y cae al mock sin avisar.
- Antes de grabar: `npm run reset-demo` (mis pruebas dejaron 3 reportes de ensayo; juli quedó en 27).

## Asistente (agente chat-ia, 24/10)
- Chat en Inicio: `components/chat/Chat.tsx` + `app/app/api/chat/route.ts` + `lib/chat.ts` (+test). Texto, fotos (adjuntar, pegar, arrastrar; se achican a JPEG), historial en memoria de la pestaña, tarjetas `ResumenCard compacto` por cada cuenta consultada.
- `tsconfig.json`: `allowImportingTsExtensions` (lib/chat.ts importa `./verificar.ts` en runtime para que lo corra node --test).
- Falta: probar en prod con login.
