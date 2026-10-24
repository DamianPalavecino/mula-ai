Sos el agente del **worker** de Mula AI (hackatón shippe.ar, entrega HOY 16:00, submit 15:45). Leé `CLAUDE.md` (el contrato de Supabase), `worker/README.md` y todo `worker/src/`.

Tocás solo `worker/`, más **agregar** líneas en `.env.example` y `CLAUDE.md`. Nunca leas ni commitees `.env*`.

## Tarea 1 (crítica, para las 13:15): endpoint HTTP `POST /analizar`
Es el plan B de la demo: si Baileys se cae, el simulador web usa exactamente la misma IA y la misma red.

1. Sacá el pipeline de `messages.upsert` en `index.ts` a una función reutilizable, por ejemplo `procesarMensaje({ texto, remitente, historial })` en `worker/src/pipeline.ts`. Tiene que hacer: clasificar, consultar la red, `registrar_reporte` y armar las alertas. El envío por WhatsApp queda opcional. El comportamiento del listener de WhatsApp no cambia.
2. `worker/src/http.ts`: un servidor `node:http` sin dependencias nuevas, en `process.env.PORT ?? 8080`, que arranque junto con Baileys y no dependa de que WhatsApp esté conectado.
   - `GET /health` → `{ ok: true, whatsapp: "conectado" | "desconectado" | "qr" }`
   - `POST /analizar` con body `{ "texto": string, "remitente"?: string, "enviar_whatsapp"?: boolean }`
   - CORS abierto (`*`, incluido `OPTIONS`), límite de body de 20 KB, texto de 1 a 2000 caracteres. Rate limit simple en memoria: 30 por minuto por IP.
   - Si viene `enviar_whatsapp: true` y WhatsApp está conectado, manda las alertas reales (chat propio y grupo familiar), que impacta en la demo. Si no, solo devuelve los textos.
   - Si es sospechoso: `registrar_reporte` con `fuente: 'whatsapp'` y, si supera `ALERT_THRESHOLD`, `registrar_alerta` (así aparece en el feed de `/red`).
3. **Contrato de respuesta** (no lo cambies, la web ya lo está implementando con un mock):
```json
{
  "es_sospechoso": true,
  "riesgo": 87,
  "modalidad": "familiar_numero_nuevo",
  "senales": ["pide dinero", "urgencia"],
  "suplanta_a": "nieto",
  "entidades": [ { "entidad_id": 12, "tipo": "alias", "valor_normalizado": "juli.martinez.mp", "encontrada": true, "reportes": 24, "provincias": ["Santa Fe"], "modalidades": ["familiar_numero_nuevo"], "ultimo": "2026-10-24T...", "monto_total": 1200000 } ],
  "alerta_persona": "⚠️ ...",
  "alerta_familia": "...",
  "reporte_id": 301,
  "alerta_id": 55,
  "enviada_a": ["propio", "familia"],
  "fuente_clasificacion": "llm"
}
```
   `entidades` son objetos de `resumen_entidad`. `reporte_id` y `alerta_id` valen `null` si no se registró nada. `fuente_clasificacion` es `"llm"` o `"heuristica"`. Errores: `{ "error": "..." }` con 400, 429 o 500.
4. Agregá `PORT` y `NEXT_PUBLIC_WORKER_URL` (la URL pública de Railway, que usa la web) a `.env.example`, una línea en la tabla de variables de `worker/README.md` y una nota corta bajo "Detalles de implementación" de `CLAUDE.md` con el endpoint y el contrato.
5. Probalo con `curl` contra el worker local (con y sin `ANTHROPIC_API_KEY`), `npm run typecheck` y `npm run selftest`. Commit y push en tu rama, y avisá que está listo para mergear.

## Tarea 2 (después): robustez para la demo
- `npm run test:classify`: ajustá el prompt hasta que las 10 estafas den riesgo de 70 o más y las 10 normales menos de 40. Sumá casos rioplatenses: audio transcripto, "soy de ANSES", falso comprador de Marketplace.
- Reconexión: backoff, que no se caiga ante errores de un mensaje puntual y que `logged out` quede logueado claro.
- Latencia: la alerta tiene que llegar en menos de 5 s. Medí y logueá el tiempo de punta a punta.
- Audios: verificar que `transcribe.ts` anda con una nota de voz real si hay `OPENAI_API_KEY`.

Si necesitás un subagente (por ejemplo, para revisar el diff o generar casos de prueba), usalo. Respondé corto, en español rioplatense.
