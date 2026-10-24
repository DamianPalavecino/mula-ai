# Estado — Mula AI (13:40)

Web: https://mula-ai.vercel.app

Resumen para leer rápido e iterar. El detalle vivo (cada prueba, con hora y quién) está en [`PROGRESS.md`](PROGRESS.md).

## Qué anda hoy
| Pieza | Estado | Dónde |
|---|---|---|
| Base (Supabase prod) | ✅ schema, funciones y seed. `juli.martinez.mp` con 24 reportes en 5 provincias | `supabase/` · `npm run check prod` |
| Clasificador | ✅ 20/20 con el LLM real (DeepSeek por OpenRouter). Tarda 4–6 s por mensaje | `worker/src/classify.ts` · `npm run check classify` |
| Worker WhatsApp | ✅ en el VPS (systemd `mula-worker`). Estafa real → alerta al chat propio en ~5 s → aparece en `/red` | `worker/` · `worker/scripts/vps.sh logs` |
| `POST /analizar` | ✅ mismo pipeline que WhatsApp, probado contra prod. Le falta URL pública HTTPS | `worker/src/http.ts` |
| `/verificar` | ✅ en Vercel (200) | `web/app/verificar` |
| `/red` (grafo + alertas en vivo) | ✅ en Vercel. El feed resalta la alerta nueva | `web/app/red` |
| `/simulador` (plan B) | ✅ en local contra el worker. En Vercel todavía usa el mock | `web/app/simulador` |
| `/me-estafaron` | ✅ en local (capturas → denuncia + pedido de bloqueo, ~25 s). Faltan las variables en Vercel | `web/app/me-estafaron`, `web/app/api/extraer` |
| Kit de demo | ✅ guion, mensajes, capturas, preguntas del jurado, checklist | `docs/demo/` |

## Qué falta (13:30, agente entrega: verificado contra https://mula-ai.vercel.app y la VPS)
1. **URL pública HTTPS del worker** (Funnel, esperando que Damian lo habilite) → `NEXT_PUBLIC_WORKER_URL` en Vercel + redeploy. Hoy el bundle de `/simulador` no trae URL del worker: usa el mock.
2. **VPS**: falta `FAMILY_GROUP_JID` (sin eso la alerta no llega al grupo familiar del guion), `TRUSTED_CONTACTS` y `OPENAI_API_KEY` (audios; si no está, no usar el mensaje de audio). Cargadas: Supabase, OpenRouter, `ANALIZAR_SOLO`, `HTTP_TOKEN_ENVIO`.
3. **Link "Me estafaron"** en el header: hay cambios sin commitear en `web/components/Header.tsx`; en Vercel todavía no está.
4. Probar a mano: un mensaje normal no alerta, un contacto de confianza se ignora, la alerta llega al grupo.
5. **Entrega** (kit listo, ver abajo): ~14:00 `npm run pre-demo` real → 14:30 grabar → YouTube → `TODO_VIDEO` en el README (título y descripción ya están en un comentario HTML ahí) → submit 15:45.

Ya resuelto en esta pasada: `/me-estafaron` en Vercel tiene la key (`/api/extraer` responde); latencia del LLM 2–3 s con corte a 3,5 s; README con la URL real; repo sin secretos (ojo: el chequeo hay que correrlo con `rtk proxy git log -p`, ver `docs/demo/checklist.md`).

### Kit de entrega
- **13:40, cambio de plan**: guion, mensajes, checklist y README ya describen landing `/` → `/entrar` → `/app` (familia) → `/admin` (gobierno). Para grabar hacen falta: web nueva en Vercel, las 2 cuentas de demo en Clerk (familiar con "Abuela Marta" cargada, admin en `ADMIN_EMAILS`) y que la alerta del worker aparezca en `/app` de esa familia.
- `npm run pre-demo`: reset-demo → `check prod` contra Vercel → `/health` del worker → semáforo 🟢/🔴. `-- --dry` no borra nada.
- `docs/demo/guion.md` (con tiempos esperados), `mensajes.md` (todos probados: estafas ≥85, normales ≤10), `checklist.md` (con título y descripción de YouTube).
- El número real de Damian quedó en la historia del repo (commits `d4f4843`, `11979d5`, en `PROGRESS.md`); en el archivo actual está redactado.

## Cómo iterar una feature
1. `git pull --rebase`.
2. Test primero, en el comando que ya corre esa feature (worker: `worker/src/selftest.ts`; web: `npm test`).
3. `npm run check`: corre solo lo que tocaste y lo anota en `PROGRESS.md`.
4. Commit chico → `git push origin main` (Vercel deploya solo).
5. Marcá la prueba en `PROGRESS.md`.

## Ojo
- Antes de grabar: `npm run pre-demo` (incluye el reset). Los ensayos suben el contador de juli (13:28 estaba en 28).
- En Windows, `curl -d` con tildes manda latin1: usá `--data-binary @archivo.json`.
- Varios agentes pushean a `main`: siempre `git pull --rebase` antes de commitear (un commit viejo ya borró el simulador una vez).
