# Mula AI

> Las estafas funcionan porque cada víctima está sola. Mula AI detecta al estafador en tu WhatsApp, quema su cuenta y protege al próximo.

Un guardián que vigila el WhatsApp de una persona (sobre todo adultos mayores), reconoce el guion de estafa y la cuenta mula en el momento en que llegan, avisa a la persona y a su grupo familiar, y suma cada número y cada alias/CBU a una red compartida que cualquiera puede consultar antes de pagar.

Hackatón [shippe.ar](https://shippe.ar) · Track Social & Sector Público.

- **Web:** _<URL de Vercel>_
- **Video (2 min):** _<link de YouTube>_

## Cómo funciona

```
WhatsApp de la persona ──► worker (Baileys, Railway)
                             │ filtro: ignora contactos de confianza y grupos
                             │ Claude: clasifica el guion y extrae alias/CBU/teléfonos
                             ▼
                        Supabase (la red) ◄──── web (Next.js, Vercel)
                             │                   /verificar  "antes de pagar"
                             │                   /red        grafo + alertas en vivo
                             ▼
              alerta al chat propio + al grupo familiar
```

- **Detecta en vivo**: cada mensaje (o audio) de un desconocido se analiza: suplantación de un familiar, urgencia, pedido de plata, alias o CBU.
- **Consulta la red**: si el alias ya tiene reportes, la alerta lo dice ("23 reportes en 5 provincias").
- **Avisa a la familia**, no solo a la víctima. Nunca le responde al estafador.
- **Antes de pagar**: cualquiera pega un alias, CBU/CVU o teléfono en `/verificar`.

## Estructura

| Carpeta | Qué es | Deploy |
|---|---|---|
| [`supabase/`](supabase/) | Schema, normalización y RPCs (el contrato) + seed sintético | Supabase |
| [`worker/`](worker/) | Proceso Node + Baileys que escucha WhatsApp | Railway |
| [`web/`](web/) | Landing, `/verificar` y `/red` | Vercel |

El contrato entre worker y web está en [`CLAUDE.md`](CLAUDE.md).

## Correrlo

1. Crear un proyecto en Supabase y pegar en el SQL editor `supabase/schema.sql` y después `supabase/functions.sql`.
2. Copiar `.env.example` a `.env` (raíz), `worker/.env` y `web/.env.local`, y completar.
3. Sembrar la red: `npm install && npm run seed`. Entre ensayos de la demo, `npm run reset-demo` borra los reportes en vivo y deja `juli.martinez.mp` otra vez en 23 (guion en [`docs/demo.md`](docs/demo.md)).
4. Web: `cd web && npm install && npm run dev`.
5. Worker: `cd worker && npm install && npm run dev` y escanear el QR con el WhatsApp a proteger.

Detalle en el README de cada carpeta.

## Aclaraciones

- **Datos sintéticos**: los reportes previos de la red (`fuente = 'sintetico'`) son generados para la demo, incluido el alias `juli.martinez.mp`. Las detecciones en vivo se guardan con `fuente = 'whatsapp'`.
- **Baileys es el prototipo**: el worker se conecta como dispositivo vinculado para validar la detección. En producción el mismo motor va en una app Android que lee notificaciones del propio teléfono y en APIs de riesgo para bancos y billeteras. Usar siempre un número secundario.
- **Privacidad**: los mensajes de contactos de confianza no se procesan ni se guardan. La red guarda cuentas y teléfonos, nunca nombres de titulares (el titular de una cuenta mula muchas veces es otra víctima).
