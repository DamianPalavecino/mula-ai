# Mula AI · worker de WhatsApp

Proceso Node que se vincula al WhatsApp de la persona protegida (como WhatsApp Web), escucha los mensajes de desconocidos, los clasifica con un LLM (DeepSeek V4 Flash vía OpenRouter), los suma a la red en Supabase y avisa a la persona (chat propio) y al grupo familiar. **Nunca le responde al remitente.**

> ⚠️ **Usá un número secundario, nunca uno personal.** Baileys no es un cliente oficial y Meta puede banear el número. Para la demo: un chip descartable.

## Flujo

```
messages.upsert → ignora fromMe / grupos / status / newsletters
  → texto (conversation · extendedText · caption) o audio transcripto
  → teléfono real del remitente (key.remoteJidAlt si viene @lid; si no, mapeo LID→PN)
  → filter.debeAnalizar: contacto de confianza = nunca; desconocido = >2 palabras o entidades/palabras clave
  → classify: DeepSeek vía OpenRouter (salida estructurada) + regex de entidades; si el LLM falla → heurística
  → si no es sospechoso pero un alias/CBU ya tiene reportes en la red → sospechoso igual
  → registrar_reporte (fuente whatsapp) → alertas al chat propio + grupo → registrar_alerta
```

## Correr local

```bash
cd worker
npm install
# completá las variables (ver .env.example en la raíz; el worker lee worker/.env y ../.env)
npm run dev        # tsx watch
# o
npm start
```

La primera vez aparece un QR en la terminal: **WhatsApp → Dispositivos vinculados → Vincular un dispositivo**. La sesión queda en `AUTH_DIR` (default `./auth_info`, en `.gitignore`). Si el QR no se ve bien, el log también imprime el string crudo y un link que lo renderiza.

Para volver a vincular: borrá la carpeta de `AUTH_DIR` y reiniciá.

### Sacar el JID del grupo familiar

1. Con el número secundario, creá (o sumate a) el grupo familiar.
2. Arrancá el worker. Al conectar loguea el JID propio y **lista todos los grupos**:
   ```
   [grupos] 2 grupo(s). Copiá el JID del familiar en FAMILY_GROUP_JID:
       120363012345678901@g.us  Familia 💛
   ```
3. Copiá ese `...@g.us` en `FAMILY_GROUP_JID` y reiniciá. Sin esa variable el worker arranca igual y solo avisa al chat propio.

## Variables

| Variable | Obligatoria | Qué es |
|---|---|---|
| `SUPABASE_URL` | sí | URL del proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | sí | service role (solo acá, nunca en la web) |
| `OPENROUTER_API_KEY` | recomendada | sin ella clasifica solo con heurística |
| `CLASSIFIER_MODEL` | no | default `deepseek/deepseek-v4-flash` |
| `PROTEGIDO_NOMBRE` | no | cómo se nombra en las alertas ("la abuela Marta") |
| `FAMILY_GROUP_JID` | no | `...@g.us` del grupo familiar |
| `TRUSTED_CONTACTS` | no | teléfonos separados por coma; se normalizan a 10 dígitos (`+54 9 341 555-1234` → `3415551234`) |
| `ANALIZAR_SOLO` | no | teléfonos separados por coma; si tiene alguno, **solo** se analizan esos remitentes y el resto se ignora sin loguear (para vincular un número personal en la demo) |
| `PROVINCIA_DEFAULT` | no | provincia que se guarda en los reportes (default `Santa Fe`) |
| `AUTH_DIR` | no | carpeta de la sesión (default `./auth_info`; en Railway `/data/auth_info`) |
| `OPENAI_API_KEY` | no | para transcribir audios (`gpt-4o-mini-transcribe`) |
| `ALERT_THRESHOLD` | no | riesgo mínimo para alertar (default 60) |
| `CLASSIFIER_TIMEOUT_MS` | no | timeout del LLM antes de caer a la heurística (default 10000) |
| `BAILEYS_LOG_LEVEL` | no | default `warn` |

## Scripts

- `npm run dev` / `npm start` — worker.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run selftest` — smoke test sin red (entidades, filtro, heurística, textos de alerta).
- `npm run test:classify` — 10 estafas + 10 normales con el clasificador real (requiere `OPENROUTER_API_KEY`; sin key muestra la heurística).

## Deploy en Railway

1. New Project → Deploy from GitHub repo → este repo.
2. Settings del servicio:
   - **Root Directory:** `worker`
   - **Config file path:** `/worker/railway.json` (Railway no lo busca dentro del root directory solo). Si no, poné **Start Command** `npm start` a mano.
3. **Volumen:** Add Volume → mount path `/data`. Variable `AUTH_DIR=/data/auth_info`. Así no se re-escanea el QR en cada deploy.
4. Variables: las de la tabla de arriba.
5. Deploy → abrí los logs y escaneá el QR (o abrí el link que imprime el log). Después de vincular, Baileys reinicia la conexión solo (code 515) y queda `[wa] conectado como ...`.
6. **Una sola réplica** (dos procesos con la misma sesión se patean entre sí, code 440).

Si el log dice `sesión cerrada (logged out)`: se desvinculó desde el teléfono → borrá `/data/auth_info` (o el volumen) y redeploy para un QR nuevo.

## Notas

- Remitentes `@lid`: Baileys 7 puede mandar el chat como `xxxx@lid`. El teléfono se toma de `key.remoteJidAlt` (o `participantAlt`, o `senderPn` en versiones viejas); si no, del mapeo LID→PN del signal repository. Si no se puede resolver, se trata como desconocido.
- El historial corto (últimos 5 mensajes por chat) vive en memoria y solo para desconocidos: los mensajes de contactos de confianza no se procesan ni se loguean.
- El link del QR usa `api.qrserver.com` (servicio de terceros); el QR vence en segundos, pero si preferís, usá el string crudo con un generador local.
