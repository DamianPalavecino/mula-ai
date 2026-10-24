# PROGRESS — Mula AI

Entrega 16:00 · submit 15:45 · freeze 14:30.

## Traspaso (si se corta Claude y sigue Codex u otro agente)
**Relanzar los 5 con Codex:** `pwsh docs/agentes/codex.ps1` (o `... codex.ps1 simulador demo` para algunos). Arranca Codex en el mismo worktree de cada agente, así conserva lo que no se commiteó, y le pasa su brief más su estado en `docs/agentes/estado/<nombre>.md`, que cada agente actualiza después de cada paso.

Este archivo es la fuente de verdad. Para retomar a mano:
1. `git pull --rebase` y leé `CLAUDE.md` (reglas + contrato; en Windows `AGENTS.md` es un symlink que queda como texto "CLAUDE.md"), este archivo y `docs/deploy.md`.
2. Tomá el primer ítem de "Próximo paso" y el primer `[ ]` de "Qué falta probar" de tu área. Cada área tiene el brief completo en `docs/agentes/0X-*.md`.
3. Reglas: TDD, `npm run check` en verde, push directo a `main` (`git pull --rebase` antes), sin agentes revisores. Nunca leer ni commitear `.env*`. Ya están cargados en la raíz (`.env`) y en `web/.env.local` de cada checkout.
4. Al terminar algo: marcá `[x]` con hora y quién, y actualizá "Próximo paso".

Quién hace qué (worktrees de Orca en `C:\Users\dami_\orca\workspaces\mula-ai\<nombre>`, agentes Claude en terminal; si se cortó el usage, esos agentes también se frenaron):
| Área | Brief | Estado |
|---|---|---|
| deploy (Supabase, Vercel, VPS) | `docs/agentes/01-deploy.md` | Supabase, Vercel (https://mula-ai.vercel.app, `check prod` 9/9, `OPENROUTER_API_KEY` cargada) y worker en el VPS ✓; falta la URL pública del worker → `NEXT_PUBLIC_WORKER_URL` |
| worker | `docs/agentes/02-worker-http.md` | `POST /analizar` ✓; falta latencia < 5 s (Tarea 2) |
| web simulador + `/red` | `docs/agentes/03-web-simulador.md` | ✓ local; falta contra el worker del VPS por HTTPS |
| `/me-estafaron` | `docs/agentes/04-web-me-estafaron.md` | ✓ local; en Vercel `/api/extraer` ya tiene `OPENROUTER_API_KEY` (13:0x deploy); falta probar con captura real y el link en el header |
| demo y entrega | `docs/agentes/05-demo.md` | kit en `docs/demo/`; falta grabar, subir y hacer el submit |

Herramientas: Supabase CLI en `C:\Users\dami_\AppData\Local\Programs\Supabase\supabase.exe` (no está en el PATH, logueado, proyecto MulaAI; `link` antes de comandos contra prod). Worker en el VPS: `worker/scripts/vps.sh deploy|qr|logs|status`. Lanzar un agente: `orca worktree create --repo id:93434532-72b0-464c-a48c-b83211d7840b --name <tarea> --no-parent --agent codex --prompt "<brief>" --json`.

## Cómo se usa
- `npm run check` (en la raíz) corre solo los chequeos de las features que tocaste y pone el resultado en la tabla de abajo. `npm run check worker web` corre esas; `npm run check all` corre todas menos las manuales.
- `⏭️ omitido` = no se pudo probar de verdad (ej. `classify` sin `OPENROUTER_API_KEY` en `worker/.env`). No cuenta como verde.
- `supabase` es manual (`npm run check supabase`): re-siembra la base del entorno y verifica `juli.martinez.mp` (23 reportes, 5 provincias).
- Las pruebas que no se pueden automatizar (WhatsApp real, deploys) se marcan a mano en "Qué falta probar", con hora y quién.
- Antes de pushear: `npm run check` en verde, y actualizá "Qué falta probar" y "Próximo paso".

| Feature | Qué verifica |
|---|---|
| `worker` | `typecheck` + `selftest` (entidades, filtro, heurística, textos de alerta; sin red) |
| `classify` | 10 estafas + 10 normales con el LLM real (OpenRouter; sin key, solo la heurística) |
| `web` | `next build` (tipos + build de todas las rutas) |
| `supabase` | seed contra el Supabase del entorno + la aserción de `juli.martinez.mp` |
| `e2e` | manual: `npm run e2e` contra la base real con la anon key (`--base` antes de la 1ª detección, `--watch` para ver alertas en vivo) |
| `prod` | manual (`npm run check prod`): con la anon key, `juli.martinez.mp` 23/5, `grafo()`, anon lee `alertas` y no escribe; con `WEB_URL`, las 3 rutas de Vercel dan 200 |

## Resultados automáticos
<!-- check:start -->
| Feature | Comando | Resultado | Duración | Cuándo | Commit |
|---|---|---|---|---|---|
| `classify` | `npm run test:classify` | ✅ | 76s | 24/10/2026, 13:48:44 | 893e19e |
| `design` | `node --check docs/design/app.mjs` | ✅ | 0s | 24/10/2026, 14:18:25 | 20872aa |
| `design` | `node --check docs/design/screens.mjs` | ✅ | 0s | 24/10/2026, 14:18:25 | 20872aa |
| `design` | `node --test docs/design/design.test.mjs` | ✅ | 0s | 24/10/2026, 14:18:25 | 20872aa |
| `e2e` | `npm run e2e` | ✅ | 3s | 24/10/2026, 12:49:18 | 11979d5 |
| `pre-demo` | `node --test scripts/pre-demo.test.mjs` | ✅ | 0s | 24/10/2026, 13:16:24 | 823cd2b |
| `prod` | `node --env-file-if-exists=.env scripts/smoke-prod.mjs` | ✅ | 4s | 24/10/2026, 14:50:03 | 5a380ba |
| `prod` | `node scripts/smoke-prod.mjs` | ⏭️ omitido | 0s | 24/10/2026, 12:28:39 | c6d5a8f |
| `web` | `npm run build` | ✅ | 4s | 24/10/2026, 15:29:55 | 124b912 |
| `web` | `npm test` | ✅ | 0s | 24/10/2026, 15:29:55 | 124b912 |
| `worker` | `npm run selftest` | ✅ | 1s | 24/10/2026, 15:29:55 | 124b912 |
| `worker` | `npm run typecheck` | ✅ | 0s | 24/10/2026, 15:29:55 | 124b912 |
<!-- check:end -->

## Qué falta probar (manual / e2e)

**Diseños**
- [x] Landing real integrada en `/` con verde/lima, tres guiones y chat familiar; navbar responsive y diagrama de red mejorados. Verificada en desktop/mobile, `npm run check web` verde (62 tests + build). El ejemplo separa el mensaje sospechoso del aviso de Mula al chat propio y muestra el aviso recibido por el familiar, según el envío real del worker.
- [ ] Completar la adaptación de las demás vistas del prototipo en `web/` y comprobar sus datos autenticados.
Marcá `[x]` con hora y quién.

**Base y deploy**
- [x] 12:35 deploy — `docs/deploy.md` con pasos y variables por servicio; `scripts/smoke-prod.mjs` probado (sin vars → omitido, URL caída → 9 FAIL)
- [x] 12:5x Damian / 12:55 deploy — Supabase prod: `schema.sql` + `functions.sql` aplicados y sembrado
- [x] 12:55 deploy — `npm run check prod` 6/6 contra Supabase prod (juli 24/5, grafo 306/281, anon no escribe)
- [x] 13:50 c5 — Entidades `cuit` y `link`: check + funciones aplicadas en prod (migración `entidades_cuit_link`), `supabase/tests.sql` 29 asserts OK en local y prod; seed local con clusters nuevos OK (juli 23/5)
- [x] 14:1x c5 — Prod re-sembrado con clusters cuit/link: juli 28/5 (23 sint. + 5 reales; el seed ahora chequea ≥23), CUIT 27384551209 6 rep, CUIT 27412033987 9 rep, anses-bono-tramite.com 11, grafo con 6 nodos cuit/link
- [x] 13:50 c5 — Worker deployado con cuit/link (a0c3c54, WhatsApp conectado). Leyenda/nodos CUIT/Link verificados desktop + mobile con base local (falta mirar /admin en prod logueado)
- [ ] /me-estafaron: subir un comprobante real y ver que extraiga el CUIT del titular
- [x] 13:0x deploy — `WEB_URL=https://mula-ai.vercel.app npm run check prod` 9/9; bundle con la URL de Supabase prod; `/simulador` y `/me-estafaron` dan 200
- [x] Realtime activo en `alertas` — 13:2x agente vercel-web: `/red` de mula-ai.vercel.app abierta en Playwright, `POST /analizar` en el VPS (riesgo 95) → la alerta entra "recién" al feed sin recargar
- [x] Web en Vercel — 13:2x agente vercel-web: Playwright headless (contexto limpio) 1440 y 375: `/`, `/verificar` juli (rojo, 27) y maria.gomez.gym (sin reportes), `/red` (grafo + En vivo), `/me-estafaron`; todas 200 y sin scroll horizontal. `mula-ai.vercel.app` pública (200); `mula-ai-damianpalavecinos-projects.vercel.app` da 302 SSO. Vercel deploya solo cada push a main
- [x] 12:45 worker — en el VPS. systemd `mula-worker` en `contabo-vps`, `[wa] conectado como 549343xxxxxxx`; tras `restart` reconecta en 1 s sin QR, `/health` → `{"ok":true,"whatsapp":"conectado"}`. Sesión en `~/mula-data/auth_info`, vars en `~/.config/mula-ai/worker.conf`. Operar con `worker/scripts/vps.sh deploy|qr|logs|status`

**Worker / WhatsApp**
- [x] 12:33 worker — vinculado local (número de Damian 549343xxxxxxx, lid xxxxxxxxxxxxxx, `ANALIZAR_SOLO` con 2 números de prueba). Demo desde 341xxxxxxx → `[clasif:llm] riesgo=85 familiar_numero_nuevo alias:juli.martinez.mp` → alerta al chat propio 4 s después del mensaje. `registrar_reporte` falló: la función no existe todavía en Supabase (pendiente el schema)
- [x] Un mensaje de estafa desde un número desconocido → alerta al chat propio en menos de 5 s — 12:48 worker VPS: msg 48:46 → alerta #1 registrada 48:51 (~5 s, LLM 4.5 s, al límite); Damian la vio en el chat propio. 12:57 `/red` de Vercel muestra la alerta en el feed "En vivo" (desktop + mobile)
- [ ] La misma alerta llega al familiar (13:2x agente entrega: `FAMILY_GROUP_JID` en el VPS = WhatsApp de la Nieta Dami, persona; worker reiniciado y `/health` conectado. Falta un mensaje de prueba)
- [ ] El mensaje de un contacto de confianza no se procesa (no aparece en los logs)
- [x] Un mensaje normal de un desconocido no alerta — 13:22 worker-latencia: `POST /analizar` en el VPS "hola, ¿tenés el número del plomero?" → `es_sospechoso:false`, riesgo 0, `reporte_id:null`, `alerta_id:null`
- [x] Latencia < 5 s (deploy `e050908`) — 13:22 worker-latencia: 3 estafas por `/analizar` en el VPS → `[tiempo] llm=2693/3333/2589ms red=0ms total=3038/3531/2799ms` (total incluye `registrar_alerta`; antes ~5 s). Cambios: `resumen_entidad` en paralelo al LLM, la alerta sale antes de `registrar_reporte`, y si el LLM pasa `CLASSIFIER_BUDGET_MS` (3500) con la heurística ya ≥ umbral alerta con la heurística. `test:classify` 20/20 con rango (mediana 2.5 s, máx 5 s). Falta: 1 mensaje real de WhatsApp para ver `alerta_enviada=` en `vps.sh logs`
- [x] La detección suma 1 reporte a `juli.martinez.mp` (12:48, e2e: r_181, juli 23→24; falta verlo en `/verificar` de Vercel)
- [ ] Audio de estafa transcripto y alertado (si hay key de transcripción)

- [ ] Filtro por palabras clave en el VPS (desde 24/10 tarde): un desconocido solo pasa al LLM si trae plata/alias/CBU/link/monto/palabra de estafa; la charla común queda `[skip] sin señales` pero entra al historial. Probar en WhatsApp real: "hola, cómo andás" → skip; después "cambié de número, pasame plata" → alerta con el contexto. Requiere `worker/scripts/vps.sh deploy`

**Plan B / features nuevas**
- [x] `POST /analizar`: curl local con estafa / normal / body inválido (400) — 12:27, agente worker-http (LLM real: estafa riesgo 95, normal 0; OPTIONS 204; `/health` ok. Supabase falso: `reporte_id` null y alerta sin registrar, como corresponde)
- [x] `POST /analizar` contra Supabase prod — 12:53, agente worker-http: r_182 + alerta #2, `juli.martinez.mp` 24→25, `npm run e2e` verde (falta verla en el feed de `/red`). Ojo: en Windows `curl -d 'texto con tildes'` manda latin1; usá `--data-binary @archivo.json` (r_182 quedó con `�`, la web manda UTF-8 bien)
- [x] `POST /analizar` cerrado (Tarea E, deploy `707ea19`) — 13:25 worker-latencia, en el VPS: sin `X-Mula-Token` → 401, token malo → 401, token del `worker.conf` → 200 (1.6 s); `/health` 200 sin token; `Origin` ajeno → sin `Access-Control-*`. Token: `MULA_TOKEN` (acepta `HTTP_TOKEN_ENVIO`, que es el que hay hoy en el VPS). `WEB_ORIGIN` sin setear (el browser ya no llama al worker). 13:27: `MULA_TOKEN` nuevo cargado en `worker.conf` del VPS y en Vercel (production) por pipe, sin mostrarlo; nuevo → 200, el viejo `HTTP_TOKEN_ENVIO` → 401. `docs/demo/guion.md` usa `MULA_TOKEN`
- [ ] La alerta de `POST /analizar` aparece en el feed de `/red` en vivo
- [ ] `POST /analizar` con `enviar_whatsapp: true` y WhatsApp conectado → llega al chat propio y al grupo
- [x] Worker con URL pública — 13:45 agente worker-funnel: Funnel bloqueado (pide habilitarlo en el admin + `sudo` para operator) → Cloudflare quick tunnel `mula-tunnel` (systemd usuario en el VPS) en https://realized-forgotten-aspect-quick.trycloudflare.com. Desde afuera (Mac + allorigins) `/health` → `{"ok":true,"whatsapp":"conectado"}`; `POST /analizar` sin token → 401, con `MULA_TOKEN` → 200 en 2.2 s (LLM), el worker loguea la IP real. `WORKER_URL` cargada en Vercel production (server-only, sin redeploy: lo hace quien sube el proxy). Ojo: la URL cambia si `mula-tunnel` reinicia o el VPS rebootea → `worker/scripts/vps.sh tunnel` (docs/deploy.md §3)
- [ ] **Antes de grabar: `npm run reset-demo`** (los ensayos por `/analizar` suben el contador de juli)
- [x] `/simulador` en modo mock (sin `NEXT_PUBLIC_WORKER_URL`): 3 mensajes, aviso al grupo familiar, mobile 375 px sin scroll horizontal, 1080p entra en una pantalla — 12:33, agente simulador
- [x] `/simulador` contra worker local + Supabase prod (`NEXT_PUBLIC_WORKER_URL=http://localhost:8080`): Juli → alerta LLM riesgo 90-95 en ~7 s, `registrar_alerta` ok, aparece "recién" y resaltada en el feed de `/red`; `npm run e2e -- --reciente 10` verde (entidad_ids en grafo()) — 12:58, agente simulador. Dejó 3 reportes whatsapp de ensayo (juli en 27): `npm run reset-demo` antes de grabar
- [ ] `/simulador` en Vercel contra el worker del VPS (URL **HTTPS**: desde una página HTTPS un `http://` lo bloquea el navegador y cae al mock sin avisar)
- [ ] `/simulador` con el toggle "Mandar también al WhatsApp real" → llega al chat propio y al grupo
- [ ] `/red`: el nodo de la alerta nueva se destaca (feed resaltado ✓ 12:58; el pulso del canvas no lo pude capturar, mirarlo a ojo)
- [x] 12:35 me-estafaron — local, `POST /api/extraer` con `chat.png` + `comprobante.png` → 200 en 27 s vía OpenRouter (`anthropic/claude-sonnet-5.5`): alias, CVU y teléfono bien extraídos, $180.000, denuncia + pedido de bloqueo + pasos. Sin body → 400. Cruce con la red da `null` (falta schema en prod)
- [x] 12:54 me-estafaron — local contra Supabase prod: capturas de demo → teléfono 11 reportes/6 prov, `juli.martinez.mp` 24/5, CVU 7/3; la denuncia trae "Antecedentes" antes del pedido (23 s)
- [x] `/me-estafaron` en Vercel — 13:2x agente vercel-web: `POST /api/extraer` con chat.png + comprobante.png → 200 en 22 s, alias/CVU/teléfono + cruce con la red; `puede_registrar: true` y el botón "Sumar mi caso a la red" habilitado (no lo clickeé)
- [ ] `/me-estafaron` → "Sumar mi caso a la red" suma 1 reporte a `juli.martinez.mp` (necesita `SUPABASE_SERVICE_ROLE_KEY` server-only en Vercel; sin ella el botón queda deshabilitado)
- [ ] ~~Link "Me estafaron" en `Header.tsx`~~ descartado por el cambio de plan (`docs/agentes/06-landing-dashboards.md`)

**Entrega**
- [ ] URL probada desde otro celular
- [x] Sin secretos en el repo: `git log -p | grep -iE "sk-|service_role|eyJ"` vacío y `auth_info/` sin trackear — 12:25, agente demo (volver a correr a las 15:30, comandos en `docs/demo/checklist.md`)
- [ ] Video subido a YouTube (público), con la historia completa en los primeros 2 minutos
- [ ] `npm run reset-demo` contra Supabase prod deja `juli.martinez.mp` en 23/5 (correrlo antes de cada toma)
- [ ] Capturas de `docs/demo/capturas/` (chat + comprobante) probadas en `/me-estafaron`
- [ ] Toma de respaldo grabada y subida como "no listada" (`docs/demo/guion.md`)
- [ ] README: rutas de la sección Demo verificadas en Vercel (hoy describen el plan nuevo, todavía no deployado); paso 1 de "Correrlo" con `supabase/auth.sql` cuando exista
- [ ] README: `TODO_VIDEO` reemplazado (el título y la descripción de YouTube están en un comentario HTML debajo de la tabla); sacar `/simulador` o `/me-estafaron` si se cortaron
- [x] 13:25 agente entrega — README con `https://mula-ai.vercel.app` (las 6 rutas dan 200 por curl), links a `/verificar`, `/red`, `/simulador`, `/me-estafaron`, sin WhatsApp local ni Railway. Misma URL en `docs/demo/checklist.md` y `guion.md`
- [x] 13:12 agente entrega — repo sin secretos. **Ojo: el hook de rtk resume `git log -p` y el grep da vacío aunque haya algo**; con `rtk proxy git log -p --all | grep -iE "sk-ant|sk-or-|service_role\"?\s*[:=]|eyJhbGci"` salen 5 líneas y las 5 son docs que citan el mismo comando (con `| grep -v "grep -iE"` → vacío). `git ls-files | grep -E "auth_info|(^|/)\.env($|\.)" | grep -v "\.env\.example$"` → vacío. `git log --all --name-only --format= | grep -E "auth_info/" | sort -u` → vacío
- [x] 13:12 agente entrega — capturas trackeadas (`docs/demo/capturas/chat.png`, `comprobante.png`) sin teléfonos reales (el del chat es el ficticio `+54 9 11 4444-5555`). El número real de Damian estaba en este archivo (redactado 13:25), pero sigue en la historia (`d4f4843`, `11979d5`)
- [x] 13:2x agente entrega — mensajes exactos de `docs/demo/mensajes.md` con el clasificador real: estafas 85–100, normales 0–10, LLM 2–3 s (ANSES y el alias suelto cortaron a 3,5 s y alertaron por heurística). `npm run check classify` 20/20
- [x] 13:40 agente entrega — cambio de plan (`docs/agentes/06-landing-dashboards.md`): `guion.md` reescrito para landing → login familiar → setup → estafa por WhatsApp → alerta en `/app` → login gobierno → grafo en `/admin` (plan B: disparo por HTTP en el VPS); `mensajes.md` sin `/simulador` ni `/verificar` público; checklist "Web" con `/`, `/entrar`, `/app`, `/admin` y las cuentas de demo en el formulario; README con las rutas nuevas. `pre-demo` solo llama a `npm run check prod` (el smoke lo actualiza el agente de Supabase)
- [x] 13:28 agente entrega — `npm run pre-demo` (reset-demo → `check prod` con `WEB_URL=https://mula-ai.vercel.app` → `/health` del VPS → semáforo). Probado con `-- --dry`: 3/3 🟢 (juli en 28 por los ensayos, sin borrar). Falta la corrida real ~14:00
- [ ] Submit hecho

## Próximo paso
- **Landing real:** `/` ya usa el diseño verde/lima y chats de WhatsApp, navbar responsive y red de casos ilustrativa. Demo corregida: mensaje sospechoso → aviso separado al chat propio → aviso al familiar. Verificar el deploy automático tras el push; los ejemplos públicos no llaman a DB ni LLM.
- **Diseños:** prototipo responsive de landing, familiar y administrador en `docs/design/`, con chats de WhatsApp, verde/lima y los guiones actuales. `npm run check design` verde (7 pruebas + sintaxis). Landing integrada en `web/`; seguir con las vistas autenticadas según el sistema actual.
- /admin: probar con login admin que un caso sin alerta (me-estafaron → sumar a la red) aparece en el grafo en ≤15 s sin recargar, pulsando (refresco propio del grafo, 14:15).
- **Base cerrada a anon ✓ (14:0x, Damian vía MCP):** `supabase/cierre-anon.sql` aplicado en prod (ya estaba casi todo cerrado; el script idempotente dejó los grants limpios). anon → 401 en tablas y RPC; a anon solo le queda `rls_auto_enable` (event trigger de la plataforma). `npm run check prod` sin `MODO` 17/17 verde. juli en 28: `npm run reset-demo` antes de grabar.
- **Web nueva en Vercel (13:50, orquestador):** `mula-ai.vercel.app` sirve landing sin DB/LLM, `/entrar` y `/registro` (Clerk), `/admin` (gobierno: grafo + feed por polling + stats + verificar) y `/app` (familiar: setup del protegido, alertas propias, me-estafaron, verificar, probar mensaje). Rutas viejas redirigen. Variables cargadas en Vercel: Clerk (pk/sk, SIGN_IN_URL=/entrar, SIGN_UP_URL=/registro), `ADMIN_EMAILS`, `WORKER_URL`, `MULA_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`. Verificado con login real en local (admin y familiar, capturas en `docs/demo/capturas/admin-*.png`, `app-*.png`). Falta: verificar en prod que `/admin` sin sesión redirija a `/entrar` (deploy de e935a1a) y entrar con la cuenta admin real.
- ~~Cuenta familiar de la demo~~ hecho 14:02 (cierre): familiar = `testjuancruz7@gmail.com` (`user_3L9L4c43dq85o46JTuQTOvYvmCy`), "Abuela Marta" = `protegidos.id 2` con 11 alertas. Admin = `damianpalavecino.web@gmail.com` (`user_3L9LM3oM9PGkARzickaJd5LG90R`). Fila de prueba id 1 borrada. Usuarios `+clerk_test@example.com` siguen en Clerk (inofensivos).
- Red: cuit/link en prod (base, worker, web, seed). Falta: probar /me-estafaron con un comprobante real.
- Demo: kit en `docs/demo/` (guion ya con landing → login familiar → setup → alerta → login gobierno → grafo). Falta: `npm run reset-demo`, toma de respaldo. Si la URL del túnel cambió: `worker/scripts/vps.sh tunnel` y recargar `WORKER_URL` en Vercel.
- Deploy a Vercel: SOLO con `git push origin main` (nunca `vercel --prod` desde el árbol local). Con `cacheComponents`: todo lo que lea sesión/searchParams va bajo un `loading.tsx`/`<Suspense>`, sin `export const dynamic`.
