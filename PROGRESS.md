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
| `classify` | `npm run test:classify` | ⏭️ omitido | 1s | 24/10/2026, 12:22:00 | f1093ee |
| `e2e` | `npm run e2e` | ❌ | 3s | 24/10/2026, 12:26:00 | f9d0ffb |
| `prod` | `node scripts/smoke-prod.mjs` | ⏭️ omitido | 0s | 24/10/2026, 12:25:00 | 9f011ae |
| `web` | `npm run build` | ✅ | 29s | 24/10/2026, 12:21:35 | f1093ee |
| `worker` | `npm run selftest` | ✅ | 18s | 24/10/2026, 12:21:35 | f1093ee |
| `worker` | `npm run typecheck` | ✅ | 4s | 24/10/2026, 12:21:35 | f1093ee |
<!-- check:end -->

## Qué falta probar (manual / e2e)
Marcá `[x]` con hora y quién.

**Base y deploy**
- [x] 12:35 deploy — `docs/deploy.md` con pasos y variables por servicio; `scripts/smoke-prod.mjs` probado (sin vars → omitido, URL caída → 9 FAIL)
- [ ] Supabase prod: `schema.sql` + `functions.sql` aplicados, `npm run check supabase` verde
- [ ] `npm run check prod` verde contra Supabase prod (y con `WEB_URL` contra Vercel)
- [ ] Realtime activo en `alertas` (un INSERT aparece en el feed de `/red`)
- [ ] Web en Vercel: `/`, `/verificar?valor=juli.martinez.mp` (23 reportes, en rojo) y `/red` en incógnito
- [ ] Worker en Railway: conectado, sesión persistida (redeploy sin re-escanear el QR)

**Worker / WhatsApp**
- [ ] Un mensaje de estafa desde un número desconocido → alerta al chat propio en menos de 5 s
- [ ] La misma alerta llega al grupo familiar
- [ ] El mensaje de un contacto de confianza no se procesa (no aparece en los logs)
- [ ] Un mensaje normal de un desconocido no alerta
- [ ] La detección suma 1 reporte a `juli.martinez.mp` en `/verificar`
- [ ] Audio de estafa transcripto y alertado (si hay key de transcripción)

**Plan B / features nuevas**
- [ ] `POST /analizar`: curl local con estafa / normal / body inválido (400)
- [ ] `/simulador` contra el worker real (y en modo mock sin `NEXT_PUBLIC_WORKER_URL`)
- [ ] `/red`: el nodo de la alerta nueva se destaca
- [ ] `/me-estafaron`: captura de ejemplo → denuncia + pedido de bloqueo (se corta si a las 14:00 no anda)

**Entrega**
- [ ] URL probada desde otro celular
- [ ] Sin secretos en el repo: `git log -p | grep -iE "sk-|service_role|eyJ"` vacío y `auth_info/` sin trackear
- [ ] Video subido a YouTube (público), con la historia completa en los primeros 2 minutos
- [ ] Submit hecho

## Próximo paso
- Damian: crear Supabase prod y seguir `docs/deploy.md` §1 (no hay CLIs de supabase/vercel/railway en la PC: es por clics). Después `npm run check supabase` y `npm run check prod`.
- Después Vercel (§2) y Railway (§3); completar las URLs arriba de `docs/deploy.md`.
