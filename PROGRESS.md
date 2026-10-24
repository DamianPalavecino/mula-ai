# PROGRESS — Mula AI

Entrega 16:00 · submit 15:45 · freeze 14:30.

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
| `classify` | `npm run test:classify` | ✅ | 66s | 24/10/2026, 12:28:29 | c6d5a8f |
| `e2e` | `npm run e2e` | ✅ | 3s | 24/10/2026, 12:49:18 | 11979d5 |
| `prod` | `node --env-file-if-exists=.env scripts/smoke-prod.mjs` | ❌ | 4s | 24/10/2026, 12:28:56 | c6d5a8f |
| `prod` | `node scripts/smoke-prod.mjs` | ⏭️ omitido | 0s | 24/10/2026, 12:28:39 | c6d5a8f |
| `web` | `npm run build` | ✅ | 17s | 24/10/2026, 12:36:34 | dcb8616 |
| `web` | `npm test` | ✅ | 1s | 24/10/2026, 12:36:34 | dcb8616 |
| `worker` | `npm run selftest` | ✅ | 1s | 24/10/2026, 12:49:35 | 610f3c1 |
| `worker` | `npm run typecheck` | ✅ | 0s | 24/10/2026, 12:49:35 | 610f3c1 |
<!-- check:end -->

## Qué falta probar (manual / e2e)
Marcá `[x]` con hora y quién.

**Base y deploy**
- [x] 12:35 deploy — `docs/deploy.md` con pasos y variables por servicio; `scripts/smoke-prod.mjs` probado (sin vars → omitido, URL caída → 9 FAIL)
- [ ] Supabase prod: `schema.sql` + `functions.sql` aplicados, `npm run check supabase` verde
- [ ] `npm run check prod` verde contra Supabase prod (y con `WEB_URL` contra Vercel)
- [ ] Realtime activo en `alertas` (un INSERT aparece en el feed de `/red`)
- [ ] Web en Vercel: `/`, `/verificar?valor=juli.martinez.mp` (23 reportes, en rojo) y `/red` en incógnito
- [x] 12:45 worker — en el VPS. systemd `mula-worker` en `contabo-vps`, `[wa] conectado como 5493436612270`; tras `restart` reconecta en 1 s sin QR, `/health` → `{"ok":true,"whatsapp":"conectado"}`. Sesión en `~/mula-data/auth_info`, vars en `~/.config/mula-ai/worker.conf`. Operar con `worker/scripts/vps.sh deploy|qr|logs|status`

**Worker / WhatsApp**
- [x] 12:33 worker — vinculado local (número de Damian 5493436612270, lid 44066381295863, `ANALIZAR_SOLO` con 2 números de prueba). Demo desde 3413950428 → `[clasif:llm] riesgo=85 familiar_numero_nuevo alias:juli.martinez.mp` → alerta al chat propio 4 s después del mensaje. `registrar_reporte` falló: la función no existe todavía en Supabase (pendiente el schema)
- [ ] Un mensaje de estafa desde un número desconocido → alerta al chat propio en menos de 5 s — 12:48 worker VPS: msg 48:46 → alerta #1 registrada 48:51 (~5 s, LLM 4.5 s); falta que Damian confirme que la vio en el chat propio
- [ ] La misma alerta llega al grupo familiar
- [ ] El mensaje de un contacto de confianza no se procesa (no aparece en los logs)
- [ ] Un mensaje normal de un desconocido no alerta
- [x] La detección suma 1 reporte a `juli.martinez.mp` (12:48, e2e: r_181, juli 23→24; falta verlo en `/verificar` de Vercel)
- [ ] Audio de estafa transcripto y alertado (si hay key de transcripción)

**Plan B / features nuevas**
- [x] `POST /analizar`: curl local con estafa / normal / body inválido (400) — 12:27, agente worker-http (LLM real: estafa riesgo 95, normal 0; OPTIONS 204; `/health` ok. Supabase falso: `reporte_id` null y alerta sin registrar, como corresponde)
- [ ] `POST /analizar` contra Supabase real: devuelve `reporte_id`/`alerta_id` y la alerta aparece en el feed de `/red`
- [ ] `POST /analizar` con `enviar_whatsapp: true` y WhatsApp conectado → llega al chat propio y al grupo
- [ ] Worker con URL pública (VPS: Tailscale Funnel, pendiente OK de Damian) y `GET /health` responde desde afuera; URL cargada en `NEXT_PUBLIC_WORKER_URL` de Vercel
- [ ] `/simulador` contra el worker real (y en modo mock sin `NEXT_PUBLIC_WORKER_URL`)
- [ ] `/red`: el nodo de la alerta nueva se destaca
- [x] 12:35 me-estafaron — local, `POST /api/extraer` con `chat.png` + `comprobante.png` → 200 en 27 s vía OpenRouter (`anthropic/claude-sonnet-5.5`): alias, CVU y teléfono bien extraídos, $180.000, denuncia + pedido de bloqueo + pasos. Sin body → 400. Cruce con la red da `null` (falta schema en prod)
- [ ] `/me-estafaron` en Vercel con Supabase prod: las 3 cuentas salen en rojo y la denuncia trae el párrafo "Antecedentes" (necesita `OPENROUTER_API_KEY` server-only en Vercel)
- [ ] `/me-estafaron` → "Sumar mi caso a la red" suma 1 reporte a `juli.martinez.mp` (necesita `SUPABASE_SERVICE_ROLE_KEY` server-only en Vercel; sin ella el botón queda deshabilitado)
- [ ] Link "Me estafaron" en `Header.tsx` (lo suma el dueño del header)

**Entrega**
- [ ] URL probada desde otro celular
- [x] Sin secretos en el repo: `git log -p | grep -iE "sk-|service_role|eyJ"` vacío y `auth_info/` sin trackear — 12:25, agente demo (volver a correr a las 15:30, comandos en `docs/demo/checklist.md`)
- [ ] Video subido a YouTube (público), con la historia completa en los primeros 2 minutos
- [ ] `npm run reset-demo` contra Supabase prod deja `juli.martinez.mp` en 23/5 (correrlo antes de cada toma)
- [ ] Capturas de `docs/demo/capturas/` (chat + comprobante) probadas en `/me-estafaron`
- [ ] Toma de respaldo grabada y subida como "no listada" (`docs/demo/guion.md`)
- [ ] README: `TODO_URL` y `TODO_VIDEO` reemplazados; sacar `/simulador` o `/me-estafaron` si se cortaron
- [ ] Submit hecho

## Próximo paso
- me-estafaron: listo en main. Falta cargar en Vercel `OPENROUTER_API_KEY` (y opcional `SUPABASE_SERVICE_ROLE_KEY`, ambas sin `NEXT_PUBLIC_`) y sumar el link en el header.
- Demo: kit listo en `docs/demo/` (guion, mensajes, jurado, checklist, capturas). Falta: conseguir celulares y número del estafador, `npm run reset-demo`, toma de respaldo (el worker ya anda en el VPS).
- Damian: crear Supabase prod y seguir `docs/deploy.md` §1 (no hay CLIs de supabase/vercel en la PC: es por clics). Después `npm run check supabase` y `npm run check prod`.
- Después Vercel (§2); el worker ya está en el VPS (§3). Completar las URLs arriba de `docs/deploy.md`.
- Worker: `POST /analizar` está en main y el worker corre en el VPS. Falta: URL pública (Funnel) → `NEXT_PUBLIC_WORKER_URL` en Vercel (agente `deploy`/`simulador`). Después, Tarea 2 del worker: el LLM tarda 4–6 s por mensaje y la alerta tiene que llegar en menos de 5 s.
