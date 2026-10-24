# Demo y entrega — Mula AI

Para grabar el video y hacer el submit. Spec: `docs/spec.md` § Demo. **Submit 15:45.** El jurado mira solo los primeros 2 minutos.

## Elenco y equipos

| Rol | Equipo | WhatsApp |
|---|---|---|
| **Abuela Marta** (protegida) | celular A | número secundario vinculado al worker (`PROTEGIDO_NOMBRE=Abuela Marta`) |
| **Estafador** | celular B | cualquier número que **no** esté en `TRUSTED_CONTACTS` |
| **Familia** | celular C, o la PC con WhatsApp Web | miembro del grupo `FAMILY_GROUP_JID` |
| **Comprador de Marketplace** | PC (navegador) | — abre `/verificar` |

Si solo hay dos celulares: el grupo familiar se muestra desde WhatsApp Web en la PC.

## Antes de grabar (10 min)

1. `npm run reset-demo` → tiene que terminar con `juli.martinez.mp: 23 reportes · 5 provincias`. **Repetirlo antes de cada toma** (cada ensayo suma un reporte).
2. Logs del worker en Railway: `[wa] conectado como ...` y el grupo familiar listado.
3. Ensayo seco con un mensaje cualquiera de desconocido ("hola, te escribo por la publicación de la bici, pasame alias") → llega alerta. Después `npm run reset-demo` otra vez.
4. Web en incógnito: `/`, `/verificar` con `juli.martinez.mp`, `/red` con el grafo cargado.
5. Celulares: modo no molestar **apagado** para WhatsApp (que se vea la notificación), brillo al máximo, otras notificaciones silenciadas, batería > 50 %.
6. En el celular de la abuela: el chat "consigo misma" (Tú) fijado arriba, así se ve la alerta sin buscarla.
7. En el celular del estafador: el mensaje ya escrito (o copiado), listo para enviar.

## Guion (2:00)

| Tiempo | Pantalla | Voz en off |
|---|---|---|
| 0:00–0:20 | Placa negra con texto, o `/red` con el grafo girando | "Una banda le roba a 40 personas con la misma cuenta. Cada víctima denuncia sola y cada fiscalía ve una estafa chica. Las estafas funcionan porque cada víctima está sola." |
| 0:20–0:50 | **Los dos celulares a la vez**: estafador a la izquierda, abuela a la derecha. El estafador manda el mensaje. | "Esta es Marta. Le escribe un número que no conoce." *(dejar leer el mensaje)* |
| 0:50–1:15 | Llega la alerta al chat propio de la abuela. Corte al grupo familiar. | "En segundos, Mula AI reconoce el guion, ve que ese alias ya tiene reportes en cinco provincias, y le avisa a ella… y a su familia, que puede llamarla y frenar todo." |
| 1:15–1:35 | PC: Marketplace (o captura), copiar alias → `/verificar` → resultado en rojo | "Otra persona está por pagar una bici en Marketplace. Antes de transferir, pega el alias en Mula AI. La cuenta ya está quemada." |
| 1:35–1:50 | `/red`: aparece la alerta en vivo en el feed, click en el nodo `juli.martinez.mp` | "Cada estafa que detectamos protege al próximo. Los reportes previos de esta demo son sintéticos; la detección y la alerta que vieron son reales." |
| 1:50–2:00 | Logo + URL | "Las estafas funcionan porque cada víctima está sola. Con Mula AI, ya no." |

### Mensaje del estafador (copiar tal cual)

```
hola abu, soy Juli, cambié de número. Choqué con el auto y necesito plata urgente para el seguro, mandá a juli.martinez.mp que después te explico
```

Variante en dos mensajes (más real, igual dispara): `hola abu soy juli, este es mi número nuevo, agendalo` → (5 s) → `choqué y necesito que me mandes 150 mil urgente a juli.martinez.mp, no le digas a mamá`.

### Lo que tiene que aparecer

Al chat propio de la abuela (el texto exacto depende del LLM; esto es lo que arma el worker):

```
⚠️ Mula AI: Este mensaje tiene el patrón de una estafa. El alias juli.martinez.mp tiene 24 reportes en 5 provincias. … No transfieras. Llamá a Juli al número de siempre. No le respondas a ese número.
```

Al grupo familiar:

```
🚨 Mula AI: Alguien le escribió a Abuela Marta haciéndose pasar por Juli y pidió plata a juli.martinez.mp (24 reportes). Llamá a Abuela Marta para avisarle.
Riesgo 9x/100 · familiar con número nuevo
```

**Dice 24, no 23**: el conteo ya incluye el mensaje que acaba de llegar. En la voz en off decir "ya tiene reportes en cinco provincias", sin número, y no hay que regrabar si sale 24 o 25.

## Si algo falla

| Falla | Qué hacer |
|---|---|
| No llega la alerta en 15 s | Mirar logs del worker. Si dice `logged out` → no hay tiempo de re-vincular durante la toma: pasar al simulador web (plan B). |
| El número del estafador está en `TRUSTED_CONTACTS` | Sacarlo de la variable o usar otro celular. |
| La alerta dice "quedó registrado en la red" en vez de "24 reportes" | El alias no matcheó: revisar que el mensaje diga `juli.martinez.mp` exacto y que el seed esté (`npm run seed`). |
| Baileys caído del todo | **Plan B:** simulador web con forma de celular (rama `simulador`) contra la misma IA y la misma red. Se dice "acá lo mostramos en el simulador" y se sigue. |
| Todo caído a las 15:15 | Subir la toma de respaldo grabada en el primer ensayo. |

## Grabación

- Grabar primero una **toma de respaldo** completa, aunque sea fea, y guardarla.
- Celulares filmados desde arriba (o screen mirroring con scrcpy / QuickTime) lado a lado en una sola pantalla.
- Pantalla de la PC con OBS a 1080p, zoom del navegador al 125 %.
- No mostrar configuración, código, logs, menús ni el `.env`. Ni Railway ni Supabase en pantalla.
- Audio en off grabado aparte si hay ruido en el lugar.
- Editar a **≤ 2:00**. Subtítulos quemados si se puede (el jurado puede verlo sin sonido).

## YouTube

- Título: `Mula AI — guardián de WhatsApp contra estafas y cuentas mula (shippe.ar 2026)`
- Visibilidad: **Pública** (no "no listada" si las reglas piden pública). Abrirlo en incógnito para confirmar.
- Descripción:

```
Las estafas funcionan porque cada víctima está sola. Mula AI vigila el WhatsApp de una persona, reconoce el guion de estafa y la cuenta mula en el momento en que llegan, avisa a la persona y a su familia, y suma cada caso a una red compartida que cualquiera puede consultar antes de pagar.

Web: <URL de Vercel>
Código: https://github.com/damianpalavecino/mula-ai

Los reportes previos de la red son sintéticos y están marcados como tales. La detección y las alertas del video son en vivo. El worker usa Baileys como prototipo; en producción el mismo motor va en una app Android y en APIs de riesgo para bancos y billeteras.

Hackatón shippe.ar · Track Social & Sector Público.
```

## Checklist de submit (15:30)

- [ ] URL de Vercel abre en incógnito **y** desde un celular con datos móviles: `/`, `/verificar`, `/red`.
- [ ] `/verificar` con `juli.martinez.mp` da rojo; con un alias inventado da "sin reportes".
- [ ] Repo público: abrir `github.com/damianpalavecino/mula-ai` sin sesión.
- [ ] Sin secretos en el repo: `git log -p | grep -iE "sk-ant|service_role|eyJhbGci"` vacío y sin `auth_info/`.
- [ ] README con URL de la web y link al video (completar las dos líneas de arriba del README).
- [ ] Video público, ≤ 2:00 la historia completa, abre en incógnito.
- [ ] Worker prendido en Railway (el jurado puede probar después).
- [ ] Credenciales de demo: no hacen falta (la web es pública y sin login). Si piden probar el WhatsApp, ofrecer el número secundario, nunca uno personal.
- [ ] **Submit 15:45.** Una sola entrega, irreversible: revisar los tres links antes de mandar.

## Preguntas del jurado (machete)

| Pregunta | Respuesta corta |
|---|---|
| ¿Baileys no va contra los términos de WhatsApp? | Es el prototipo para validar la detección. En producción el motor va en una app Android que lee notificaciones del propio teléfono y en las apps de bancos y operadoras. |
| ¿Leen todos mis chats? | Solo mensajes de desconocidos o con pedidos de plata. Los de contactos de confianza ni se procesan. |
| ¿De dónde sale la red? | De cada detección y cada denuncia. Hoy la poblamos con datos sintéticos y lo decimos. |
| ¿Y si marcan a un inocente? | Mostramos cuentas y reportes con evidencia, nunca nombres. El titular de una cuenta mula muchas veces es otra víctima. La alerta pide verificar, no bloquea nada. |
| ¿Y con voces clonadas? | No dependemos de detectar la voz: decidimos por el guion, el pedido de plata y la red. Funciona igual con un clon o con un actor. |
| ¿iPhone? | Baileys funciona con cualquier teléfono porque se vincula como WhatsApp Web. La app de producción es primero Android, que es la mayoría en Argentina. |
| ¿Quién paga? | Gratis para las personas. Pagan bancos y billeteras por consultar el riesgo de una cuenta antes de una transferencia, y operadoras por ofrecerlo. |
| ¿Esto no lo hacen los bancos? | Los bancos suspenden cuentas después del fraude y no comparten. Nosotros vemos el intento antes de que llegue al banco. |
