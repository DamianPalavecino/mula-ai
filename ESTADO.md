# Estado — Mula AI (13:02)

Resumen para leer rápido e iterar. El detalle vivo (cada prueba, con hora y quién) está en [`PROGRESS.md`](PROGRESS.md).

## Qué anda hoy
| Pieza | Estado | Dónde |
|---|---|---|
| Base (Supabase prod) | ✅ schema, funciones y seed. `juli.martinez.mp` con 24 reportes en 5 provincias | `supabase/` · `npm run check prod` |
| Clasificador | ✅ 20/20 con el LLM real (DeepSeek por OpenRouter). Tarda 4–6 s por mensaje | `worker/src/classify.ts` · `npm run check classify` |
| Worker WhatsApp | ✅ en el VPS (systemd `mula-worker`). Estafa real → alerta al chat propio en ~5 s → aparece en `/red` | `worker/` · `worker/scripts/vps.sh logs` |
| `POST /analizar` | ✅ mismo pipeline que WhatsApp, probado contra prod. Le falta URL pública HTTPS | `worker/src/http.ts` |
| `/verificar` | ✅ en Vercel | `web/app/verificar` |
| `/red` (grafo + alertas en vivo) | ✅ en Vercel. El feed resalta la alerta nueva | `web/app/red` |
| `/simulador` (plan B) | ✅ en local contra el worker. En Vercel todavía usa el mock | `web/app/simulador` |
| `/me-estafaron` | ✅ en local (capturas → denuncia + pedido de bloqueo, ~25 s). Faltan las variables en Vercel | `web/app/me-estafaron`, `web/app/api/extraer` |
| Kit de demo | ✅ guion, mensajes, capturas, preguntas del jurado, checklist | `docs/demo/` |

## Qué falta (por prioridad)
1. **URL pública HTTPS del worker** (Tailscale Funnel en el VPS) → `NEXT_PUBLIC_WORKER_URL` en Vercel. Sin esto, el simulador en Vercel cae al mock.
2. **Variables de Vercel** para `/me-estafaron`: `OPENROUTER_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY`, sin `NEXT_PUBLIC_`.
3. **Alerta al grupo familiar**: falta `FAMILY_GROUP_JID` (el worker lista los grupos al conectar).
4. **Link "Me estafaron"** en el header.
5. **Latencia**: hoy ~5 s, al límite. Bajarla (otro modelo o timeout más corto).
6. Probar a mano: un mensaje normal no alerta; un contacto de confianza se ignora; audio (falta `OPENAI_API_KEY`).
7. **Entrega**: `npm run reset-demo` → grabar → YouTube → README sin `TODO_URL`/`TODO_VIDEO` → submit 15:45.

## Cómo iterar una feature
1. `git pull --rebase`.
2. Test primero, en el comando que ya corre esa feature (worker: `worker/src/selftest.ts`; web: `npm test`).
3. `npm run check`: corre solo lo que tocaste y lo anota en `PROGRESS.md`.
4. Commit chico → `git push origin main` (Vercel deploya solo).
5. Marcá la prueba en `PROGRESS.md`.

## Ojo
- Antes de grabar: `npm run reset-demo`. Los ensayos suben el contador de juli (hoy está en 27).
- En Windows, `curl -d` con tildes manda latin1: usá `--data-binary @archivo.json`.
- Varios agentes pushean a `main`: siempre `git pull --rebase` antes de commitear (un commit viejo ya borró el simulador una vez).
