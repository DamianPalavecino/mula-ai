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
| `worker/` | Damian | Railway (root `worker`, volumen para `AUTH_DIR`) |
| `web/` | el amigo | Vercel (root directory `web`) |

Comparten solo la base. **No cambiar el contrato sin avisar al otro.** Si hace falta un campo nuevo: agregarlo (nunca renombrar ni sacar) y actualizar este archivo.

## Contrato Supabase

### Tablas
- `reportes` — `id bigserial`, `fuente` (`whatsapp` | `victima` | `sintetico`), `modalidad`, `provincia`, `monto numeric`, `texto`, `riesgo int 0-100`, `confianza int 0-100`, `senales text[]`, `suplanta_a`, `remitente` (teléfono normalizado), `created_at`.
- `entidades` — `id bigserial`, `tipo` (`alias` | `cbu` | `cvu` | `telefono`), `valor_normalizado`, `created_at`; único `(tipo, valor_normalizado)`.
- `reporte_entidad` — `reporte_id`, `entidad_id` (PK compuesta). Es la red.
- `alertas` — `id bigserial`, `reporte_id`, `protegido`, `riesgo`, `modalidad`, `mensaje_persona`, `mensaje_familia`, `enviada_a text[]`, `entidad_ids bigint[]`, `created_at`. **Realtime activado** (la web escucha INSERT).

RLS: `anon` solo lee (`select` en las 4 tablas) y ejecuta `resumen_entidad`, `grafo`, `normalizar`, `detectar_tipo`. Las escrituras (`registrar_reporte`, `registrar_alerta`) son solo `service_role` (worker y seed).

### Modalidades
`familiar_numero_nuevo`, `accidente_o_comisaria`, `falso_organismo`, `premio_o_sorteo`, `falso_comprador`, `falsa_venta`, `inversion`, `otro`.

### Funciones (RPC)
- `normalizar(tipo text, valor text) → text`
  - alias: minúsculas, trim, sin espacios ni puntuación al final.
  - cbu/cvu: solo dígitos (22).
  - telefono: solo dígitos, sin `54`, sin el `9` de celular, sin `0` ni `15` locales → 10 dígitos (ej. `3415551234`).
- `detectar_tipo(valor text) → text` — 22 dígitos → `cvu` si empieza con `000`, si no `cbu`; 8–13 dígitos (con `+`, espacios, guiones) → `telefono`; resto → `alias`.
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
- `entidades[]` acepta `{tipo, valor}` con `tipo` opcional (si falta o es inválido → `detectar_tipo`), o strings sueltos. `cbu`/`cvu` se re-derivan por el prefijo `000`. Se ignoran sin error las inválidas tras normalizar: alias fuera de `^[a-z0-9.-]{6,20}$`, cbu/cvu ≠ 22 dígitos, teléfono ≠ 10 dígitos. No se validan dígitos verificadores en la base (el seed sí genera CBU/CVU válidos).
- `modalidad` desconocida → `'otro'` (en reportes y alertas); `fuente` inválida → error. `riesgo`/`confianza` se recortan a 0–100.
- `normalizar('alias', …)` también saca puntuación inicial (`@juli…`) y espacios internos.
- `grafo()`: solo entidades con ≥1 reporte y reportes con ≥1 entidad (sin nodos aislados). `label` de reporte = `modalidad_label(modalidad)`.
- Helpers extra: `entidad_canonica(tipo, valor) → (tipo_norm, valor_norm, valida)` y `modalidad_label(modalidad) → text` (anon puede ejecutarlas); `limpiar_sintetico() → {reportes, alertas, entidades}` (solo service_role; la usa el seed).
- FKs con `on delete cascade` (`reporte_entidad` → reportes/entidades, `alertas.reporte_id` → reportes).

- **HTTP del worker** (`worker/src/http.ts`, puerto `PORT` ?? 8080, CORS `*`, body ≤ 20 KB, 30/min por IP). `GET /health` → `{ ok, whatsapp: "conectado"|"desconectado"|"qr" }`. `POST /analizar` con `{ texto (1–2000), remitente?, enviar_whatsapp? }` → `{ es_sospechoso, riesgo, modalidad, senales[], suplanta_a, entidades: [resumen_entidad…], alerta_persona, alerta_familia, reporte_id|null, alerta_id|null, enviada_a: ["propio"|"familia"], fuente_clasificacion: "llm"|"heuristica" }`; errores `{ error }` con 400/429/500. Usa el mismo pipeline que WhatsApp (`worker/src/pipeline.ts`): si es sospechoso hace `registrar_reporte` (`fuente: 'whatsapp'`) y, si supera `ALERT_THRESHOLD`, `registrar_alerta`. Con `enviar_whatsapp: true` y WhatsApp conectado manda las alertas reales. En `alertas.enviada_a` se guardan los JIDs. La web lo llama con `NEXT_PUBLIC_WORKER_URL`.

### Datos de demo
- Seed sintético (`fuente = 'sintetico'`, 150–200 reportes, últimos 90 días) con clusters plantados.
- Alias de la demo: **`juli.martinez.mp`** con ~23 reportes en 5 provincias.
- Re-sembrar: `npm run seed` en la raíz (borra solo lo sintético).

## Secretos
Nunca leer ni commitear `.env*`. Las variables están en `.env.example`. La sesión de WhatsApp (`auth_info/`) nunca va al repo. El repo es público.
