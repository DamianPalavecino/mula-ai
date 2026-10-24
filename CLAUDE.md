# Mula AI — contexto para agentes

Hackatón shippe.ar (entrega 2026-10-24 16:00, submit 15:45). Guardián de WhatsApp que detecta guiones de estafa y cuentas mula, avisa a la persona y a su familia, y suma cada caso a una red compartida.
Spec completo: `docs/spec.md`.

## Reglas de trabajo (hackatón: no time wasting)
- **TDD siempre**: primero el test que falla, después el código mínimo que lo pasa, después refactor. Worker: casos en `worker/src/selftest.ts` (`npm run selftest`) + `npm run typecheck`. Si la carpeta no tiene runner, sumá `vitest` y seguí.
- **Verificar**: `npm run check` en la raíz corre solo los tests de las features tocadas y anota el resultado en `PROGRESS.md`. Antes de pushear: verde, y actualizá ahí "Qué falta probar" y "Próximo paso". Feature nueva con lógica → su test en el comando que ya corre esa feature.
- **Sin review**: no lances agentes revisores ni pases de code review. Tests en verde = listo.
- **Push directo a `main`**: commit chico y `git push origin main` apenas los tests pasan. Sin branches ni PRs. Antes de pushear, `git pull --rebase` (somos dos tocando el repo).
- Nunca commitear `.env*` ni `auth_info/`.

## Reparto

| Carpeta | Dueño | Deploy |
|---|---|---|
| `supabase/` | los dos (el contrato) | SQL editor de Supabase |
| `worker/` | Damian | VPS Contabo, systemd `mula-worker` (`worker/scripts/vps.sh deploy\|qr\|logs`) |
| `web/` | el amigo | Vercel (root directory `web`) |

Comparten solo la base. **No cambiar el contrato sin avisar al otro.** Si hace falta un campo nuevo: agregarlo (nunca renombrar ni sacar) y actualizar este archivo.

## Contrato Supabase

### Tablas
- `reportes` — `id bigserial`, `fuente` (`whatsapp` | `victima` | `sintetico`), `modalidad`, `provincia`, `monto numeric`, `texto`, `riesgo int 0-100`, `confianza int 0-100`, `senales text[]`, `suplanta_a`, `remitente` (teléfono normalizado), `created_at`.
- `entidades` — `id bigserial`, `tipo` (`alias` | `cbu` | `cvu` | `telefono` | `cuit` | `link`), `valor_normalizado`, `created_at`; único `(tipo, valor_normalizado)`. `cuit` (CUIT/CUIL del titular de la cuenta destino) y `link` (sitio/link del estafador) se agregaron el 24/10.
- `reporte_entidad` — `reporte_id`, `entidad_id` (PK compuesta). Es la red.
- `alertas` — `id bigserial`, `reporte_id`, `protegido`, `riesgo`, `modalidad`, `mensaje_persona`, `mensaje_familia`, `enviada_a text[]`, `entidad_ids bigint[]`, `created_at`. **Realtime activado** (la web escucha INSERT).
  - `protegido_id bigint` (nullable, FK → `protegidos.id`, `on delete set null`): el protegido dueño de la alerta. Se agrega, `protegido` (texto) se mantiene.
- `protegidos` — `id bigserial`, `owner text` (userId de Clerk; la web siempre filtra `owner = userId`), `nombre`, `telefono` (normalizado), `contactos_confianza text[]`, `familiares text[]`, `provincia`, `created_at`. RLS sin policies: solo `service_role`. Demo: `npm run protegido-demo -- <clerkUserId> ["Abuela Marta"] [telefono]`.

RLS: anon/authenticated: sin acceso (desde 24/10 13:xx). La web lee server-side con service role tras Clerk. Scripts: `supabase/auth.sql` (aditivo) y `supabase/cierre-anon.sql` (revokes). Las escrituras (`registrar_reporte`, `registrar_alerta`) y lecturas (`resumen_entidad`, `grafo`, etc.) son solo `service_role` (web server-side, worker y seed).

### Modalidades
`familiar_numero_nuevo`, `accidente_o_comisaria`, `falso_organismo`, `premio_o_sorteo`, `falso_comprador`, `falsa_venta`, `inversion`, `otro`.

### Funciones (RPC)
- `normalizar(tipo text, valor text) → text`
  - alias: minúsculas, trim, sin espacios ni puntuación al final.
  - cbu/cvu: solo dígitos (22).
  - telefono: solo dígitos, sin `54`, sin el `9` de celular, sin `0` ni `15` locales → 10 dígitos (ej. `3415551234`).
  - cuit: solo dígitos (11).
  - link: host en minúsculas sin esquema, `www.` ni puerto (`https://www.Anses-Bono.com/x?y` → `anses-bono.com`). En plataformas compartidas (`link_plataforma`: acortadores, redes, links de pago, ej. `bit.ly`, `t.me`, `link.mercadopago.com.ar`) queda host + path sin query (`bit.ly/AbC12`).
- `detectar_tipo(valor text) → text` — con esquema/`www.`, dominio con path o TLD típico (`.com`, `.online`, `.ly`…, no `.mp`/`.ar` solos) → `link`; 22 dígitos → `cvu` si empieza con `000`, si no `cbu`; 11 dígitos con dígito verificador de CUIT (acepta prefijo `CUIT`/`CUIL`) → `cuit`; 8–13 dígitos (con `+`, espacios, guiones) → `telefono`; resto → `alias`.
- `registrar_reporte(payload jsonb) → jsonb` *(service_role)*
  - payload: `{ fuente, modalidad, provincia, monto, texto, riesgo, confianza, senales[], suplanta_a, remitente, entidades: [{tipo, valor}] }`
  - normaliza cada entidad, hace upsert en `entidades`, vincula en `reporte_entidad`.
  - devuelve `{ reporte_id, entidades: [resumen_entidad de cada una] }` (los conteos ya incluyen este reporte).
- `registrar_alerta(payload jsonb) → jsonb` *(service_role)*
  - payload: `{ reporte_id, protegido, riesgo, modalidad, mensaje_persona, mensaje_familia, enviada_a[], entidad_ids[] }` → devuelve `{ alerta_id }`.
- `resumen_entidad(valor text, tipo text default null) → jsonb`
  - si `tipo` es null usa `detectar_tipo`.
  - `{ entidad_id, tipo, valor_normalizado, encontrada, reportes, provincias[], modalidades[], ultimo, monto_total }` (si no existe: `encontrada:false, reportes:0`, arrays vacíos).
- `grafo() → jsonb`

```json
{
  "nodes": [
    { "id": "e_12", "tipo": "alias", "label": "juli.martinez.mp", "reportes": 23 },
    { "id": "r_301", "tipo": "reporte", "label": "Familiar número nuevo", "modalidad": "familiar_numero_nuevo", "provincia": "Santa Fe", "fuente": "sintetico", "created_at": "..." }
  ],
  "links": [{ "source": "r_301", "target": "e_12" }]
}
```
Ids de nodo: `e_<entidades.id>` y `r_<reportes.id>`. Una alerta apunta a sus nodos con `entidad_ids` → `e_<id>`.

### Detalles de implementación (agregados, no cambian lo de arriba)
- Llamadas supabase-js: `rpc('registrar_reporte', { payload })`, `rpc('registrar_alerta', { payload })`, `rpc('resumen_entidad', { valor, tipo })`, `rpc('grafo')`.
- `registrar_reporte` acepta además `created_at` (ISO, opcional; el seed lo usa para backdatear). `remitente` se guarda normalizado con `normalizar('telefono', …)` (acepta JID `549…@s.whatsapp.net`). **No** se agrega solo como entidad: si querés el remitente en la red, mandalo también en `entidades`.
- `entidades[]` acepta `{tipo, valor}` con `tipo` opcional (si falta o es inválido → `detectar_tipo`), o strings sueltos. `cbu`/`cvu` se re-derivan por el prefijo `000`; links de WhatsApp (`wa.me/549…`, `api.whatsapp.com/send?phone=…`) se re-derivan a `telefono`. Se ignoran sin error las inválidas tras normalizar: alias fuera de `^[a-z0-9.-]{6,20}$`, cbu/cvu ≠ 22 dígitos, teléfono ≠ 10 dígitos, cuit sin dígito verificador válido (`cuit_valido`), link sin dominio, oficial (`link_oficial`: `*.gob.ar`, bancos, google.com…) o plataforma sin path. No se validan dígitos verificadores de CBU/CVU en la base (el seed sí los genera válidos); el de CUIT sí.
- `modalidad` desconocida → `'otro'` (en reportes y alertas); `fuente` inválida → error. `riesgo`/`confianza` se recortan a 0–100.
- `normalizar('alias', …)` también saca puntuación inicial (`@juli…`) y espacios internos.
- `grafo()`: solo entidades con ≥1 reporte y reportes con ≥1 entidad (sin nodos aislados). `label` de reporte = `modalidad_label(modalidad)`.
- Helpers extra: `entidad_canonica(tipo, valor) → (tipo_norm, valor_norm, valida)`, `modalidad_label(modalidad) → text`, `cuit_valido(d)`, `link_plataforma(host)`, `link_oficial(host)` (solo service_role); tests SQL en `supabase/tests.sql`; `limpiar_sintetico() → {reportes, alertas, entidades}` (solo service_role; la usa el seed).
- FKs con `on delete cascade` (`reporte_entidad` → reportes/entidades, `alertas.reporte_id` → reportes).
- Web `/app/me-estafaron` (con sesión): `POST /app/api/extraer` (FormData `imagenes` ≤4, `relato`, `provincia`) → LLM con visión vía OpenRouter (`OPENROUTER_API_KEY`, `EXTRACTOR_MODEL`, default `google/gemini-3.5-flash-lite`) solo extrae entidades/montos; denuncia, pedido de bloqueo y pasos salen de plantilla (`armarTextos` en `web/lib/meEstafaron.ts`); cruza cada entidad con `resumen_entidad`. `POST /app/api/registrar` hace `registrar_reporte` con `fuente: 'victima'`, `confianza: 60`, solo si el usuario confirma y el server tiene `SUPABASE_SERVICE_ROLE_KEY` (server-only, sin `NEXT_PUBLIC_`). Rate limit en memoria por IP.

- **HTTP del worker** (`worker/src/http.ts`, puerto `PORT` ?? 8080, body ≤ 20 KB, 30/min por IP; CORS solo para el origen `WEB_ORIGIN` del worker, sin él no hay `Access-Control-Allow-Origin`). `GET /health` → `{ ok, whatsapp: "conectado"|"desconectado"|"qr" }`. `POST /analizar` con `{ texto (1–2000), remitente?, enviar_whatsapp? }` → `{ es_sospechoso, riesgo, modalidad, senales[], suplanta_a, entidades: [resumen_entidad…], alerta_persona, alerta_familia, reporte_id|null, alerta_id|null, enviada_a: ["propio"|"familia"], fuente_clasificacion: "llm"|"heuristica" }`; errores `{ error }` con 400/429/500. Usa el mismo pipeline que WhatsApp (`worker/src/pipeline.ts`): si es sospechoso hace `registrar_reporte` (`fuente: 'whatsapp'`) y, si supera `ALERT_THRESHOLD`, `registrar_alerta`. **`POST /analizar` exige siempre el header `X-Mula-Token`** = `MULA_TOKEN` del worker (falta o no coincide → 401; si el worker no tiene `MULA_TOKEN`, 401 siempre y warning al arrancar; `HTTP_TOKEN_ENVIO` se acepta como nombre viejo). `GET /health` sigue público. Solo lo llama el server de la web (`WORKER_URL` + `MULA_TOKEN`, server-only), nunca el browser. Con `enviar_whatsapp: true` y WhatsApp conectado manda las alertas reales. Detrás de Funnel el rate limit usa el último `X-Forwarded-For`. En `alertas.enviada_a` se guardan los JIDs. La web lo llama con `NEXT_PUBLIC_WORKER_URL`.

- **Avisos por Kapso** (opcional, `KAPSO_API_KEY` + `KAPSO_PHONE_NUMBER_ID` en el worker): las alertas a números (propio y familiares) salen del número de WhatsApp Business de Kapso (+1 205-855-0917, `phone_number_id` 1416697921521182) por `POST https://api.kapso.ai/meta/whatsapp/v23.0/<id>/messages`. Sin templates: solo llega si el destinatario le escribió a ese número en las últimas 24 h. Grupos (`@g.us`) y fallos de Kapso siguen por Baileys. `alertas.enviada_a` sigue guardando JIDs.

- **Sesiones por protegido (QR desde la web)**: `GET|POST|DELETE /sesiones/:protegido_id` en el worker, con `X-Mula-Token` (240/min por IP) → `{ protegido_id, estado: "conectado"|"desconectado"|"qr"|"inactiva", qr: string|null, telefono: string|null }`. `POST` abre la sesión (Baileys, auth en `SESIONES_DIR/<id>`, default `sesiones/` al lado de `AUTH_DIR`) y empieza a emitir QR; `DELETE` desvincula y borra. La config sale de `protegidos` (releída cada 30 s): ignora `contactos_confianza`, avisa al chat propio y a cada número de `familiares` por DM, `provincia` va al reporte y la alerta queda con `alertas.protegido_id`. Si el QR vence sin escanear o el teléfono desvincula → `inactiva`. Al arrancar reabre las carpetas con `creds.json`. La sesión principal (env, `AUTH_DIR`) sigue igual. Web: `/app/vincular` (polling 2,5 s) vía `GET|POST|DELETE /app/api/whatsapp` (server-only, primer protegido del owner, devuelve `{ estado, telefono, qr_svg }`).

### Datos de demo
- Seed sintético (`fuente = 'sintetico'`, 150–200 reportes, últimos 90 días) con clusters plantados.
- Alias de la demo: **`juli.martinez.mp`** con ~23 reportes en 5 provincias.
- Re-sembrar: `npm run seed` en la raíz (borra solo lo sintético).

## Secretos
Nunca leer ni commitear `.env*`. Las variables están en `.env.example`. La sesión de WhatsApp (`auth_info/`) nunca va al repo. El repo es público.
