Sos el agente de **web: simulador y red** de Mula AI (hackatón shippe.ar, entrega HOY 16:00, submit 15:45). Leé `CLAUDE.md` (el contrato), `docs/spec.md` (sección Demo), `web/README.md`, `web/AGENTS.md` y todo `web/`. Es Next.js 16 con App Router: antes de usar APIs de Next, leé la guía en `node_modules/next/dist/docs/` si `web/AGENTS.md` lo pide.

Tocás solo `web/`, **salvo** `web/app/me-estafaron/**`, `web/app/api/**` y `web/components/MeEstafaron*`, que son de otro agente. `web/components/Header.tsx` es tuyo: agregá vos el link a `/me-estafaron` cuando te lo pidan. Nunca leas ni commitees `.env*`.

## Tarea 1 (alta, para las 13:15): simulador de dos celulares
Es el plan B de la demo y además el hero de la landing: a la izquierda el celular del estafador, a la derecha el de "la abuela".

- Componente `web/components/Simulador.tsx` y página `/simulador`. Una versión compacta va en el hero de `/`.
- El celular del estafador tiene un input y 3 mensajes precargados (botones):
  1. "hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá a juli.martinez.mp"
  2. "Buenas, le hablamos de ANSES. Para cobrar el refuerzo transfiera $5.000 de validación al CBU 0000003100012345678901"
  3. un mensaje normal ("abu, el domingo vamos a comer?") para mostrar que no alerta.
- Al enviar, el mensaje aparece en los dos celulares. En el de la abuela, a los segundos, aparece la alerta de Mula AI (burbuja destacada) con `alerta_persona`, la línea de la red ("tiene 24 reportes en 5 provincias") y el riesgo. Debajo, una tarjeta "Grupo familiar" con `alerta_familia`.
- Llama a `POST ${process.env.NEXT_PUBLIC_WORKER_URL}/analizar` con body `{ texto, remitente: "simulador" }` (sin `enviar_whatsapp`; un toggle "mandar también al WhatsApp real" lo pone en `true`).
- **Contrato de respuesta** (lo implementa el agente del worker; no lo cambies):
```json
{
  "es_sospechoso": true, "riesgo": 87, "modalidad": "familiar_numero_nuevo",
  "senales": ["pide dinero", "urgencia"], "suplanta_a": "nieto",
  "entidades": [ { "entidad_id": 12, "tipo": "alias", "valor_normalizado": "juli.martinez.mp", "encontrada": true, "reportes": 24, "provincias": ["Santa Fe"], "modalidades": ["familiar_numero_nuevo"], "ultimo": "2026-10-24T...", "monto_total": 1200000 } ],
  "alerta_persona": "⚠️ ...", "alerta_familia": "...",
  "reporte_id": 301, "alerta_id": 55, "enviada_a": ["propio", "familia"], "fuente_clasificacion": "llm"
}
```
  Errores: `{ "error": "..." }` con 400, 429 o 500.
- Sin `NEXT_PUBLIC_WORKER_URL` o si el fetch falla: **mock local** con respuestas creíbles para los 3 mensajes, más un aviso chico de "modo demo" que no se note en el video. Tipos en `web/lib/tipos.ts` (agregar, no cambiar lo existente).
- Mobile-first y que se vea bien grabado en 1080p: dos celulares lado a lado en desktop y apilados en mobile.

## Tarea 2 (alta): `/red` para el video
- Cuando entra una alerta nueva por Realtime, el nodo de su entidad (`entidad_ids` → `e_<id>`) se destaca (pulso o halo), el grafo hace zoom ahí y la alerta del feed queda resaltada unos segundos.
- Refrescar `grafo()` cuando entra la alerta, así aparece el nodo del reporte nuevo.
- Click en un nodo de cuenta → `ResumenCard` (si ya existe, verificá que ande).

## Tarea 3 (si sobra): pulido
Landing: el problema en una frase, cómo funciona en 3 pasos, el simulador y un CTA a `/verificar`. Aclaración chica de que los reportes previos son sintéticos.

Antes de pushear: `npm run build` sin errores y probalo en el navegador (mobile y desktop). Commit y push en tu rama y avisá. Podés usar subagentes para revisar UI o diffs. Respondé corto, en español rioplatense.
