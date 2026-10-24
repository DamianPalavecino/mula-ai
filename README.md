# Mula AI

> **Las estafas funcionan porque cada víctima está sola.** Mula AI detecta al estafador en tu WhatsApp, quema su cuenta y protege al próximo.

| | |
|---|---|
| 🌐 **Web** | TODO_URL |
| ▶️ **Video (2 min)** | TODO_VIDEO |
| 🏁 **Hackatón** | [shippe.ar](https://shippe.ar) · Track Social & Sector Público |

## Qué es

Un guardián para el WhatsApp de una persona, sobre todo adultos mayores. Cuando un desconocido escribe "hola abu, cambié de número, mandame plata a este alias", Mula AI:

1. **Reconoce el guion** en segundos con IA: suplantación de un familiar, accidente, comisaría, falso ANSES, falso comprador y otros guiones locales.
2. **Consulta la red**: "el alias juli.martinez.mp tiene 24 reportes en 5 provincias".
3. **Avisa a la persona y al grupo familiar**, porque alguien asustado decide mal y la familia puede verificar. Nunca le responde al estafador.
4. **Suma el número y la cuenta a una red compartida** que cualquiera consulta antes de pagar en `/verificar`.

Toda estafa necesita dos piezas que las bandas reusan con decenas de víctimas: un **contacto** y una **cuenta mula**. Hoy la víctima ve el chat, el banco ve la transferencia y la fiscalía ve una denuncia suelta. Mula AI junta las piezas.

## Demo

- **WhatsApp real**: un número desconocido le escribe a "la abuela" y la alerta llega a su chat y al grupo familiar en segundos.
- **`/verificar`**: pegá un alias, CBU/CVU o teléfono (probá `juli.martinez.mp`) y mirá sus reportes antes de transferir.
- **`/red`**: el grafo de cuentas y números conectados por los casos, con las alertas entrando en vivo.
- **`/simulador`**: la misma detección sin WhatsApp: dos celulares en pantalla, el del estafador y el de la abuela.
- **`/me-estafaron`**: para quien ya transfirió. Sube capturas y recibe la denuncia y el pedido de bloqueo armados, vinculados a los otros casos.

Guion, mensajes de prueba y capturas de ejemplo en [`docs/demo/`](docs/demo/).

## Cómo funciona

```
WhatsApp de la persona ──► worker (Node + Baileys, Railway)
                             │ filtro: ignora contactos de confianza, grupos y mensajes propios
                             │ LLM: clasifica el guion y extrae alias / CBU / CVU / teléfonos
                             ▼
                        Supabase (la red) ◄──── web (Next.js, Vercel)
                             │                   /verificar · /red · /simulador · /me-estafaron
                             ▼
              alerta al chat propio + al grupo familiar
```

| Dónde se usa IA | Para qué |
|---|---|
| Clasificador (DeepSeek V4 Flash vía OpenRouter, salida JSON estructurada) | Riesgo 0–100, modalidad, señales, a quién suplanta, entidades y los textos de las alertas |
| Transcripción | Audios de WhatsApp → texto antes de clasificar |
| Visión (Claude) en `/me-estafaron` | Lee capturas de chats y comprobantes y redacta la denuncia y el pedido de bloqueo |

La normalización es determinista (en SQL): `Juli.Martinez.MP`, `@juli.martinez.mp` y `juli.martinez.mp` son la misma cuenta; `+54 9 341 555-1234` y `0341 15 555-1234` son el mismo teléfono.

## Correrlo

1. Supabase: pegar en el SQL editor `supabase/schema.sql` y después `supabase/functions.sql`.
2. Copiar `.env.example` a `.env` (raíz), `worker/.env` y `web/.env.local`, y completar.
3. Sembrar la red: `npm install && npm run seed` (en la raíz).
4. Web: `cd web && npm install && npm run dev`.
5. Worker: `cd worker && npm install && npm run dev` y escanear el QR con el WhatsApp a proteger (**número secundario**).
6. Chequeo end-to-end: `npm run e2e` verifica con la anon key las tablas, `juli.martinez.mp`, `grafo()`, el último reporte de WhatsApp con su alerta y la suscripción Realtime. `--base` antes de la primera detección real, `--watch` para ver las alertas que entran en vivo, `--web <url>` para pegarle también a la web.

Tests: `npm run check` en la raíz. Detalle en el README de cada carpeta: [`supabase/`](supabase/), [`worker/`](worker/), [`web/`](web/). El contrato entre worker y web está en [`CLAUDE.md`](CLAUDE.md).

## Aclaraciones

- **Datos sintéticos.** Los reportes previos de la red son generados para la demo y están marcados (`fuente = 'sintetico'`), incluido el alias `juli.martinez.mp`. Las detecciones en vivo se guardan con `fuente = 'whatsapp'`.
- **Baileys es el prototipo.** El worker se vincula como WhatsApp Web para validar la detección. En producción el mismo motor va en una app Android que lee las notificaciones del propio teléfono, y como API de riesgo para bancos y billeteras. Para la demo usamos un número secundario.
- **Privacidad.** Los mensajes de contactos de confianza no se procesan ni se guardan. La red guarda cuentas y teléfonos, nunca nombres de titulares: el titular de una cuenta mula muchas veces es otra víctima. Las alertas piden verificar con la familia; no bloquean nada.

## Stack

Node + [Baileys](https://github.com/WhiskeySockets/Baileys) (worker, Railway) · DeepSeek V4 Flash vía OpenRouter y Claude (IA) · Supabase: Postgres, RPC y Realtime (la red) · Next.js en Vercel (web).
