# Guion del video — Mula AI (2:00)

El jurado mira solo los primeros 2 minutos: la historia completa entra en 2:00. Mensajes exactos en [`mensajes.md`](mensajes.md), checklist en [`checklist.md`](checklist.md).

Flujo (cambio de plan 13:3x, ver [`docs/agentes/06-landing-dashboards.md`](../agentes/06-landing-dashboards.md)): **landing → login familiar → setup → mensaje de estafa → alerta en `/app` → login gobierno → grafo en `/admin`**. Ya no hay `/red`, `/verificar`, `/simulador` ni `/me-estafaron` públicas.

## Elenco y equipos

| Rol | Equipo | Qué tiene abierto |
|---|---|---|
| **Abuela Marta** (protegida) | celular A | WhatsApp del número secundario vinculado al worker (`PROTEGIDO_NOMBRE=Abuela Marta`), chat "Tú" fijado arriba |
| **Estafador** | celular B | WhatsApp de un número que **no** está en los contactos de confianza (y sí en `ANALIZAR_SOLO`), chat con la abuela, mensaje copiado |
| **Dami, la nieta** (familiar) | celular C (recibe la alerta de familia por WhatsApp: es el `FAMILY_GROUP_JID` del VPS) + PC, navegador 1 | https://mula-ai.vercel.app → cuenta de familiar de Clerk, con "Abuela Marta" ya cargada en `protegidos` |
| **Fiscalía / gobierno** (admin) | PC, navegador 2 (otro perfil o incógnito) | https://mula-ai.vercel.app/entrar → cuenta admin (su email en `ADMIN_EMAILS`) |

Dos perfiles de navegador para no hacer logout/login en cámara. Las contraseñas de las cuentas de demo **no van al repo**: las tiene Damian.

## Plan A — WhatsApp real

Ritmo de lectura: unas 2,5 palabras por segundo. Cada bloque de voz entra en su tramo leído en voz alta, sin apurarse.

| Tiempo | Pantalla | Voz en off (texto exacto) |
|---|---|---|
| **0:00–0:15** | Placa negra con texto blanco, una frase por vez: "40 víctimas" · "1 cuenta" · "40 denuncias sueltas". Logo de Mula AI. | "Una banda le roba a cuarenta personas con la misma cuenta. Cada víctima denuncia sola. Las estafas funcionan porque cada víctima está sola." |
| **0:15–0:25** | Landing `/`: el titular y el scroll corto hasta "Entrar". | "Mula AI es un guardián para el WhatsApp de los que más queremos." |
| **0:25–0:40** | `/entrar` → login de Dami → `/app/setup`: protegida "Abuela Marta", su teléfono, contactos de confianza y el familiar que recibe la alerta. Guardar. | "Dami protege a su abuela, Marta. Carga su número, los contactos de confianza que nunca se analizan, y quién recibe el aviso." |
| **0:40–1:05** | **Los dos celulares** (B a la izquierda, A a la derecha). El estafador manda el mensaje; llega a la abuela; 4 s quietos para que se lea. Enseguida, en A, la alerta en el chat "Tú". | "Le escribe un número que no conoce: cambié de número, choqué, necesito plata urgente. En segundos, la IA reconoce el guion y consulta la red: ese alias ya tiene reportes en cinco provincias. Le avisa a Marta, sin responderle al estafador." |
| **1:05–1:20** | Celular C: llega el aviso de Mula AI al WhatsApp de Dami. PC, navegador 1: `/app` de Dami, la alerta nueva entra arriba (sin recargar). | "Y le avisa a Dami, su nieta de verdad, que la puede llamar antes de que transfiera." |
| **1:20–1:45** | PC, navegador 2: login admin → `/admin`: el grafo con el nodo de `juli.martinez.mp` y sus reportes alrededor, el feed con la alerta de recién, las stats por provincia y modalidad. | "Cada caso suma a una red compartida de números y cuentas mula. Lo que para cada víctima es una estafa chica, para una fiscalía es una banda: la misma cuenta, en cinco provincias. Los reportes previos son sintéticos; la detección que vieron es real." |
| **1:45–2:00** | Logo + URL `mula-ai.vercel.app`. | "Las estafas funcionan porque cada víctima está sola. Con Mula AI, ya no." |

**La alerta dice 24, no 23**: el conteo ya incluye el mensaje que acaba de llegar. La voz dice "reportes en cinco provincias", sin número, así no hay que regrabar si sale 24 o 25.

### Lo que tiene que aparecer

Chat propio de la abuela (el medio lo redacta el LLM; el principio y el final los arma el worker):

```
⚠️ Mula AI: Este mensaje tiene el patrón de una estafa. El alias juli.martinez.mp tiene 24 reportes en 5 provincias. … No transfieras. Llamá a Juli al número de siempre. No le respondas a ese número.
```

En `/app` de Dami: la alerta de "Abuela Marta", riesgo 9x/100, familiar con número nuevo, `juli.martinez.mp` (24 reportes). WhatsApp de Dami (celular C):

```
🚨 Mula AI: Alguien le escribió a Abuela Marta haciéndose pasar por Juli y pidió plata a juli.martinez.mp (24 reportes). Llamá a Abuela Marta para avisarle.
Riesgo 9x/100 · familiar con número nuevo
```

## Plan B — sin WhatsApp

Si el worker no está conectado a WhatsApp al grabar (`/health` no dice `conectado`). La detección y la red son las mismas; cambia solo cómo entra el mensaje.

| Tiempo | Cambia respecto del plan A |
|---|---|
| 0:40–1:05 | Landing `/`, la demo programática con el guion "familiar con número nuevo" (resultado precalculado). Voz igual, sin "le avisa a Marta". |
| 1:05–1:20 | La alerta real en `/app` se dispara fuera de cámara justo antes, con el mismo mensaje por HTTP (abajo). Mostrar cómo entra arriba del feed. |
| 1:20–2:00 | Igual que el plan A. |

Disparo fuera de cámara (el token está en el VPS, no se copia a ningún lado):

```bash
ssh contabo-vps 'curl -s localhost:8080/analizar -H "Content-Type: application/json" -H "X-Mula-Token: $(grep ^HTTP_TOKEN_ENVIO= ~/.config/mula-ai/worker.conf | cut -d= -f2-)" --data-binary "{\"texto\":\"hola abu, soy Juli, cambié de número. Choqué con el auto y necesito plata urgente para el seguro, mandá a juli.martinez.mp que después te explico\"}"'
```

No se dice "plan B". Si alguien pregunta: "es la misma detección; en el video entra por la web".

## Shot list

| # | Toma | Cómo | Dura |
|---|---|---|---|
| 1 | Placas del gancho | Editor (CapCut, DaVinci o Canva), texto blanco sobre negro | 15 s |
| 2 | Landing → `/entrar` → `/app/setup` | OBS de la PC a 1080p, navegador al 125 % | 25 s |
| 3 | Dos celulares, el estafador manda y llega la alerta a la abuela | Mirroring de los dos (scrcpy en Android, QuickTime en iPhone) lado a lado en OBS; o filmados desde arriba sobre fondo liso. **Sin cortar** la espera (el "en segundos" se tiene que ver) | 25 s |
| 4 | `/app` de Dami recibe la alerta | OBS, navegador 1; grabar a la vez que la toma 3 | 15 s |
| 5 | `/admin`: grafo, feed y stats | OBS, navegador 2 | 25 s |
| 6 | Cierre con logo y URL | Editor | 15 s |

- Grabar las tomas 2–5 **de corrido** en una sola pasada (OBS con la PC y los celulares en la misma escena) y cortar en edición.
- No mostrar configuración, código, logs, el `.env`, el VPS, Supabase ni el dashboard de Clerk. Tapar los emails de las cuentas si aparecen.
- Voz en off grabada aparte, en un lugar callado. Subtítulos quemados. Música baja sin copyright (biblioteca de audio de YouTube).

## Tiempos esperados

Medido 13:2x contra el LLM real con los mensajes exactos de [`mensajes.md`](mensajes.md):

| Tramo | Hoy |
|---|---|
| Clasificación (LLM) | 2–3 s; si pasa de 3,5 s el worker alerta igual con la heurística (riesgo 90–100) |
| Mensaje del estafador → alerta en el chat "Tú" | ~4–5 s (12:48 en el VPS: 5 s, antes del corte a 3,5 s) |
| Alerta → `/app` y feed de `/admin` | + 3–5 s (polling server-side, ya no Realtime en el browser) |

El agente "Latencia de alerta del worker" lo está bajando: si mejora, actualizar esta tabla.

## Toma de respaldo

Antes de la toma buena, grabar una pasada **completa y fea**: las tomas 2–5 en un solo plano, con voz en directo. Subirla como "no listada" apenas se graba. Si a las 15:15 no hay video editado, se sube esta como pública y se entrega.

## Antes de cada toma

1. `npm run pre-demo` en la raíz: reset-demo (`juli.martinez.mp: 23 reportes · 5 provincias`; cada ensayo suma uno) + smoke de prod + `/health` del worker. Todo 🟢 o no se graba.
2. Navegador 1 logueado como Dami en `/app`; navegador 2 en `/entrar` con el admin listo (o ya en `/admin`).
3. El teléfono del celular del estafador está en `ANALIZAR_SOLO` y **no** en los contactos de confianza.
4. Celulares: WhatsApp con notificaciones, no molestar apagado, brillo al máximo, batería al 50 % o más.

## Si algo falla en la toma

| Falla | Qué hacer |
|---|---|
| No llega la alerta en 15 s | `worker/scripts/vps.sh logs`. `logged out` → no hay tiempo de re-vincular: plan B. |
| No alerta y el log no muestra el mensaje | El número del estafador es de confianza, o `ANALIZAR_SOLO` no lo incluye. |
| Llega al WhatsApp pero no a `/app` | La alerta no quedó atada al protegido de Dami (`alertas.protegido_id` o `protegido` ≠ "Abuela Marta"). Mostrarla en `/admin` y seguir. |
| `/admin` rebota al login | El email de la cuenta no está en `ADMIN_EMAILS` de Vercel. |
| La alerta dice "quedó registrado en la red" en vez de "24 reportes" | El mensaje tiene que decir `juli.martinez.mp` exacto; si falta el seed, `npm run seed`. |
| Dice 25 o más | Faltó el reset. No importa para la voz; reset y seguir. |
