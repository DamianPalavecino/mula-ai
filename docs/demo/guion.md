# Guion del video — Mula AI (2:00)

El jurado mira solo los primeros 2 minutos: la historia completa entra en 2:00. Mensajes exactos en [`mensajes.md`](mensajes.md), checklist en [`checklist.md`](checklist.md).

## Elenco y equipos

| Rol | Equipo | Qué tiene abierto |
|---|---|---|
| **Abuela Marta** (protegida) | celular A | WhatsApp del número secundario vinculado al worker (`PROTEGIDO_NOMBRE=Abuela Marta`), chat "Tú" (consigo misma) fijado arriba |
| **Estafador** | celular B | WhatsApp de un número que **no** está en `TRUSTED_CONTACTS`, chat con la abuela, mensaje copiado |
| **Familia** | celular C, o WhatsApp Web en la PC | el grupo `FAMILY_GROUP_JID` |
| **Comprador de Marketplace** | PC | pestaña 1: captura de una publicación · pestaña 2: https://mula-ai.vercel.app/verificar · pestaña 3: https://mula-ai.vercel.app/red |

Solo dos celulares: el grupo familiar se muestra desde WhatsApp Web.

## Plan A — WhatsApp real

Ritmo de lectura: unas 2,5 palabras por segundo. Cada bloque de voz entra en su tramo leído en voz alta, sin apurarse.

| Tiempo | Pantalla | Voz en off (texto exacto) |
|---|---|---|
| **0:00–0:20** | Placa negra con texto blanco, una frase por vez: "40 víctimas" · "1 cuenta" · "40 denuncias sueltas". Al final, logo de Mula AI. | "Una banda le roba a cuarenta personas con la misma cuenta. Cada víctima denuncia sola, y cada fiscalía ve una estafa chica. Las estafas funcionan porque cada víctima está sola. Esto es Mula AI." |
| **0:20–0:50** | **Los dos celulares a la vez** (B a la izquierda, A a la derecha). El estafador manda el mensaje; llega la notificación a la abuela; se abre el chat. 4 s quietos para que se lea. | "Esta es Marta. Su WhatsApp está protegido por Mula AI. Le escribe un número que no conoce…" *(pausa mientras se lee el mensaje)* "…el clásico: cambié de número, choqué, necesito plata urgente." |
| **0:50–1:15** | En A llega la alerta al chat "Tú". Zoom a la línea "tiene 24 reportes en 5 provincias". Corte al grupo familiar con la alerta. | "En segundos, la IA reconoce el guion: alguien que se hace pasar por la nieta, urgencia y pedido de plata. Y consulta la red: ese alias ya tiene reportes en cinco provincias. Le avisa a Marta y al grupo familiar, que la puede llamar antes de que transfiera." |
| **1:15–1:35** | PC: publicación de Marketplace (captura) → copiar el alias → `/verificar` → pegar → resultado en rojo. | "Ahora otra persona está por pagar una bici que vio en Marketplace. Antes de transferir, pega el alias en Mula AI. La cuenta ya está quemada." |
| **1:35–1:50** | `/red`: la alerta de recién en el feed, el nodo de `juli.martinez.mp` destacado con sus reportes alrededor. | "Cada detección suma a una red compartida de números y cuentas mula: lo que aprende un teléfono protege a todos. Los reportes previos son sintéticos; la detección que vieron es real." |
| **1:50–2:00** | Logo + URL de la web: `mula-ai.vercel.app`. | "Las estafas funcionan porque cada víctima está sola. Con Mula AI, ya no." |

**La alerta dice 24, no 23**: el conteo ya incluye el mensaje que acaba de llegar. La voz en off dice "reportes en cinco provincias", sin número, así no hay que regrabar si sale 24 o 25.

### Lo que tiene que aparecer

Chat propio de la abuela (el medio lo redacta el LLM; el principio y el final los arma el worker):

```
⚠️ Mula AI: Este mensaje tiene el patrón de una estafa. El alias juli.martinez.mp tiene 24 reportes en 5 provincias. … No transfieras. Llamá a Juli al número de siempre. No le respondas a ese número.
```

Grupo familiar:

```
🚨 Mula AI: Alguien le escribió a Abuela Marta haciéndose pasar por Juli y pidió plata a juli.martinez.mp (24 reportes). Llamá a Abuela Marta para avisarle.
Riesgo 9x/100 · familiar con número nuevo
```

## Plan B — `/simulador`

Si el worker de WhatsApp no anda en el momento de grabar. Es la misma IA y la misma red.

| Tiempo | Cambia respecto del plan A |
|---|---|
| 0:20–0:50 | Pantalla completa de `/simulador`: celular del estafador a la izquierda, el de la abuela a la derecha. Click en el mensaje precargado 1 ("hola abu, soy Juli…"). Voz: "Esta es Marta. Le escribe un número que no conoce…" |
| 0:50–1:15 | La burbuja de alerta en el celular de la abuela y la tarjeta "Grupo familiar" debajo. Misma voz. |
| 1:15–2:00 | Igual que el plan A. |

Si sobran 5 s: mandar el mensaje 3 (normal, "abu, el domingo vamos a comer?") y mostrar que no alerta.

No se dice "simulador" ni "plan B". Si alguien pregunta: "es la misma detección; en el video la mostramos en la web".

## Shot list

| # | Toma | Cómo | Dura |
|---|---|---|---|
| 1 | Placas del gancho | Editor (CapCut, DaVinci o Canva), texto blanco sobre negro | 20 s |
| 2 | Dos celulares, el estafador manda el mensaje | Mirroring de los dos (scrcpy en Android, QuickTime en iPhone) lado a lado en OBS; o filmados desde arriba con un tercer celular sobre fondo liso | 30 s |
| 3 | Llega la alerta a la abuela | Misma toma que la 2, sin cortar (el "en segundos" se tiene que ver de verdad) | 15 s |
| 4 | Alerta en el grupo familiar | Celular C o WhatsApp Web, zoom al mensaje | 10 s |
| 5 | Marketplace → `/verificar` en rojo | OBS de la PC a 1080p, zoom del navegador al 125 % | 20 s |
| 6 | `/red` con la alerta en vivo y el nodo destacado | OBS; grabar justo después de la toma 3 para que la alerta esté arriba del feed | 15 s |
| 7 | Cierre con logo y URL (`mula-ai.vercel.app`) | Editor | 10 s |

- Grabar las tomas 2–6 **de corrido** en una sola pasada y cortar en edición.
- No mostrar configuración, código, logs, menús, el `.env`, el VPS ni Supabase.
- Voz en off grabada aparte con el celular cerca de la boca, en un lugar callado.
- Subtítulos quemados (el jurado puede verlo sin sonido).
- Música de fondo baja, sin copyright (la biblioteca de audio de YouTube).

## Tiempos esperados

Medido hoy 13:2x contra el LLM real (DeepSeek por OpenRouter), con los mensajes exactos de [`mensajes.md`](mensajes.md):

| Tramo | Hoy |
|---|---|
| Clasificación (LLM) | 2–3 s; si pasa de 3,5 s el worker alerta igual con la heurística (riesgo 90–100) |
| Mensaje del estafador → alerta en el chat "Tú" | ~4–5 s (12:48 en el VPS: 5 s, antes del corte a 3,5 s) |
| Alerta → feed de `/red` | < 1 s (Realtime) |
| `/simulador`, mensaje 1 → burbuja de alerta | ~4–7 s |
| `/me-estafaron`, 2 capturas → denuncia | ~25 s (en el video, cortar la espera) |

El agente "C worker latencia" lo está bajando: si mejora, actualizar esta tabla. En la toma 3 **no cortar** la espera del WhatsApp (el "en segundos" se tiene que ver).

## Toma de respaldo

Antes de la toma buena, grabar una pasada **completa y fea**: las tomas 2–6 en un solo plano, con voz en directo. Subirla como "no listada" apenas se graba. Si a las 15:15 no hay video editado, se sube esta como pública y se entrega.

## Antes de cada toma

1. `npm run pre-demo` en la raíz: reset-demo (`juli.martinez.mp: 23 reportes · 5 provincias`; cada ensayo suma uno) + smoke de Supabase y Vercel + `/health` del worker en el VPS. Todo 🟢 o no se graba.
2. Logs del worker: `[wa] conectado como ...`.
3. Si el worker tiene `ANALIZAR_SOLO` cargado (número personal vinculado), el teléfono del celular del estafador **tiene que estar en esa lista**; si no, el mensaje se ignora sin loguear.
4. Celulares: WhatsApp con notificaciones, no molestar apagado, brillo al máximo, el resto silenciado, batería al 50 % o más.
5. `/red` abierto y cargado en la PC (que el feed reciba la alerta en vivo).

## Si algo falla en la toma

| Falla | Qué hacer |
|---|---|
| No llega la alerta en 15 s | Mirar logs del worker. `logged out` → no hay tiempo de re-vincular: plan B. |
| No alerta nada y el log no muestra el mensaje | El número del estafador está en `TRUSTED_CONTACTS`, o `ANALIZAR_SOLO` está cargado y no lo incluye. |
| La alerta dice "quedó registrado en la red" en vez de "24 reportes" | El alias no matcheó: el mensaje tiene que decir `juli.martinez.mp` exacto; si falta el seed, `npm run seed`. |
| Dice 25 o más | Faltó el `reset-demo`. No importa para la voz en off; reset y seguir. |
