# Mula AI — spec para la hackatón

Oct 24, 2026 · Damian Palavecino

Un guardián que vigila el WhatsApp de una persona, detecta guiones de
estafa y cuentas mula, avisa a la persona y a su familia, y suma cada
caso a una red compartida. Entrega: Oct 24, 2026 a las 16:00.

## Contexto

Hackatón [shippe.ar](https://shippear.vercel.app/reglas): se gana con un
producto que funcione en una URL, con IA central, un problema real
resuelto de forma no obvia y una demo que se entienda en 2 minutos.

| Criterio | Peso | Cómo lo cubre Mula AI |
|----|----|----|
| Funciona y está deployado | 35% | Detección en vivo sobre WhatsApp real + web en Vercel |
| Uso de IA | 25% | Clasifica guiones, extrae cuentas, transcribe audios, redacta alertas y denuncias |
| Problema y originalidad | 25% | Ataca la infraestructura de las bandas (números y cuentas mula) con una red compartida |
| Demo y claridad | 15% | Un mensaje de estafa llega a un celular real y la alerta aparece en segundos |

- **Track:** Social & Sector Público (soluciones implementables a nivel
  ciudad, provincia o país).

- **Equipos:** de 2 a 4 personas.

- **Entrega:** producto HTTPS, repositorio público en GitHub y video
  público en YouTube. Se evalúan los primeros 2 minutos del video.

- **Una sola entrega, irreversible.** No mandarla a último minuto.

- **Credenciales de demo:** tienen que ser descartables.

- **Evaluación:** el jurado preselecciona con votos sí/no y los 5 más
  votados pasan al pitch final.

## Problema y producto

Las estafas funcionan porque cada víctima está sola. Mula AI vigila el
WhatsApp de la persona, reconoce el guion y la cuenta mula en el momento
en que llegan, y avisa antes de que salga la plata.

### El problema

- Toda estafa necesita dos piezas reutilizables: un **contacto**
  (número, perfil) y un **destino** para la plata (alias, CBU o CVU de
  una cuenta mula). Las bandas reusan esas piezas con decenas de
  víctimas.

- Cada actor ve un solo eslabón: la víctima ve el chat, el banco ve la
  transferencia, la fiscalía ve una denuncia aislada. Nadie junta las
  piezas.

- En 2024 hubo más de 34.000 denuncias por delitos informáticos en
  Argentina, 21,1% más que el año anterior
  ([ANB](https://www.anbariloche.com.ar/noticias/2026/09/10/116762-ya-no-alcanza-con-detectar-errores-las-estafas-digitales-usan-ia-para-imitar-voces-y-enganar-a-las-victimas)).

- La IA abarató el engaño: con unos 30 segundos de un video se clona una
  voz
  ([MDZ](https://www.mdzol.com/sociedad/la-estafa-del-mundial-2026-como-la-inteligencia-artificial-puede-vaciar-tu-billetera-n1547753)),
  y en Argentina estas estafas entran sobre todo por WhatsApp
  ([iProUP](https://www.iproup.com/finanzas/48032-clonar-voz-inteligencia-artificial-robo-plata-whatsapp)).

### Para quién

- **Persona protegida:** sobre todo adultos mayores, el blanco preferido
  del "hola ma, cambié de número" y del cuento del tío.

- **Familia:** la configura y recibe las alertas.

- **Cualquiera que transfiere a un desconocido:** consulta un alias
  antes de pagar.

### Qué hace

1.  **Detecta en vivo.** Cada mensaje o audio de un desconocido se
    analiza: guion de estafa, suplantación de un familiar, pedido de
    plata, alias o CBU.

2.  **Consulta la red.** Si el mensaje trae una cuenta o viene de un
    número ya reportado, lo sabe en el momento.

3.  **Avisa a la persona y a la familia.** En el propio WhatsApp de la
    persona y en el grupo familiar.

4.  **Alimenta la red.** Cada número y cuenta detectados protegen a
    todos los demás usuarios.

5.  **Antes de pagar.** Una web donde cualquiera pega un alias y ve si
    tiene reportes.

6.  **Me estafaron.** Para quien ya transfirió: denuncia y pedido de
    bloqueo armados, vinculados al resto de los casos.

**Pitch en una línea:** *"Las estafas funcionan porque cada víctima está
sola. Mula AI detecta al estafador en tu WhatsApp, quema su cuenta y
protege al próximo."*

## Diferencial y competencia

Los competidores cubren un eslabón y descartan lo que aprenden. Mula AI
vigila donde ocurre la estafa en Argentina, que es WhatsApp, y convierte
cada intento en inteligencia compartida.

| Producto | Qué hace | Qué no hace |
|----|----|----|
| [Hiya AI Phone](https://blog.hiya.com/introducing-hiya-ai-phone-revolutionizing-your-phone-conversations) | Atiende desconocidos, detecta lenguaje de estafa y voces clonadas | Llamadas de línea; le avisa a la víctima, no a la familia; no comparte cuentas mula |
| [Truecaller AI Call Scanner](https://www.helpnetsecurity.com/?p=302670) | Detecta voces clonadas en llamadas | No mira WhatsApp ni cuentas de destino |
| [O2 Daisy](https://news.virginmediao2.co.uk/o2-unveils-daisy-the-ai-granny-wasting-scammers-time/) | Agente señuelo que hace perder tiempo a estafadores | Campaña de marketing; no protege a una persona puntual |
| Registro interbancario de cuentas fraudulentas | Suspende cuentas ya detectadas en fraude | Interno de los bancos; no llega a la persona antes de transferir |
| Comparadores de "estafadores" en redes | Listas de alias publicadas por víctimas | Sin comprobantes, sin detección, sin alertas |

**Por qué es distinto:**

1.  **Actúa donde pasa la estafa.** WhatsApp, en español rioplatense,
    con los guiones locales: "cambié de número", accidente, comisaría,
    falso ANSES, falso comprador.

2.  **Avisa a la familia, no solo a la víctima.** Una persona asustada
    es la peor para decidir; la familia puede verificar.

3.  **Red compartida de infraestructura criminal.** Números y cuentas
    mula detectados en un teléfono protegen a todos.

4.  **No depende de detectar voces falsas.** Decide por el guion, el
    pedido de plata y la red. Funciona igual con un clon de voz o con un
    actor real.

## Arquitectura

<img src="media/image1.png" style="width:6in;height:3.1875in"
alt="arquitectura de Mula AI · 6 componentes" />

arquitectura de Mula AI · 6 componentes

El worker solo escucha y avisa; toda la inteligencia vive en la API, que
consulta el LLM y la red. Por eso la web y un simulador pueden usar
exactamente la misma lógica si WhatsApp falla.

## Componentes en detalle

Stack: **Node + Baileys** para escuchar WhatsApp, **un LLM** para
entender, **Supabase** para la red y **Next.js en Vercel** para la web.

### 1. Worker de WhatsApp (Baileys)

- Proceso Node con @whiskeysockets/baileys que se conecta como
  **dispositivo vinculado** de la cuenta protegida (escaneo de QR, como
  WhatsApp Web). Funciona con Android y con iPhone.

- Corre **siempre prendido**, así que va en un servidor propio (VPS), no
  en Vercel (serverless no mantiene la conexión).

- Persistir la sesión (useMultiFileAuthState en un volumen, o guardada
  en Supabase) para no reescanear el QR en cada reinicio.

- Eventos que usa:

  - connection.update: muestra el QR y el estado de conexión.

  - messages.upsert: cada mensaje nuevo (texto, imagen, audio).

  - call: llamadas de WhatsApp entrantes.

- **Filtro antes del LLM**, para no gastar tokens en cada "jaja":

  1.  Ignorar mensajes de contactos de confianza (lista cargada por la
      familia).

  2.  Ignorar grupos y mensajes propios.

  3.  Pasar al LLM si es de un desconocido, o si contiene un alias, CBU,
      monto o palabra clave ("transferí", "urgente", "número nuevo",
      "ANSES").

- **Audios:** se descargan con downloadMediaMessage y se transcriben con
  un servicio de speech-to-text antes de clasificar.

- **Alertas:** se envían con sendMessage al chat de la persona consigo
  misma y al grupo familiar. **Nunca se le responde al estafador.**

### 2. IA

| Tarea | Modelo sugerido | Entrada | Salida |
|----|----|----|----|
| Clasificar un mensaje | Modelo rápido (Claude Haiku) | Texto o transcripción + historial corto del chat | JSON con riesgo y entidades |
| Extraer de capturas ("Me estafaron") | Modelo con visión (Claude Sonnet) | Imágenes de chats y comprobantes | JSON con cuentas, montos, fechas |
| Redactar alertas y denuncia | Modelo general | JSON del caso | Texto listo para enviar o imprimir |

Salida del clasificador (salida estructurada, siempre el mismo esquema):

{\
"es_sospechoso": true,\
"riesgo": 87,\
"modalidad": "familiar_numero_nuevo",\
"senales": \["pide dinero", "urgencia", "dice ser familiar", "número
desconocido"\],\
"suplanta_a": "nieto",\
"entidades": \[{"tipo": "alias", "valor": "juli.martinez.mp"}\],\
"alerta_persona": "Este mensaje tiene el patrón de una estafa. No
transfieras.",\
"alerta_familia": "Alguien escribió a la abuela haciéndose pasar por
Juli y pidió plata."\
}

Modalidades iniciales: familiar_numero_nuevo, accidente_o_comisaria,
falso_organismo (ANSES, banco, AFIP), premio_o_sorteo, falso_comprador,
falsa_venta, inversion, otro.

### 3. Base de datos (Supabase)

| Tabla | Campos principales | Para qué |
|----|----|----|
| protegidos | id, nombre, wa_jid, grupo_familia_jid | Cada cuenta vigilada |
| contactos_confianza | protegido_id, telefono | No analizar a la familia |
| reportes | id, fuente (whatsapp, victima, sintetico), modalidad, provincia, monto, fecha, texto, confianza | Cada caso detectado o denunciado |
| entidades | id, tipo (alias, cbu, cvu, telefono), valor_normalizado (único) | Las piezas reutilizables de las bandas |
| reporte_entidad | reporte_id, entidad_id | La red: qué caso menciona qué pieza |
| alertas | id, protegido_id, reporte_id, riesgo, enviada_a, fecha | Historial para el panel |

Una vista entidad_resumen devuelve por cada entidad: cantidad de
reportes, provincias distintas, modalidades y fecha del último. Es la
consulta que usan el worker y la web.

### 4. Normalización

Sin esto, el mismo alias escrito de dos formas cuenta como dos cuentas
distintas.

- **Alias:** minúsculas, sin espacios ni puntuación final; formato de 6
  a 20 caracteres con letras, números, punto y guion.

- **CBU/CVU:** solo dígitos, 22 de largo, validar dígitos verificadores.
  Los CVU empiezan con 000.

- **Teléfono:** solo dígitos, sin +54 ni el 9 de celular, sin el 0 ni el
  15 locales.

- Reglas deterministas primero; el LLM solo para casos ambiguos.

### 5. Web y API (Next.js en Vercel)

| Ruta | Qué muestra |
|----|----|
| / | Qué es Mula AI y cómo se configura en 3 pasos |
| /verificar | "Antes de pagar": pegás un alias, CBU o teléfono y ves sus reportes |
| /me-estafaron | Subís capturas y obtenés denuncia y pedido de bloqueo |
| /panel | Alertas en vivo (Supabase Realtime) y la red alrededor de cada cuenta |

| Endpoint | Uso |
|----|----|
| GET /api/entidad?valor= | Normaliza y devuelve el resumen de la entidad |
| POST /api/analizar | Clasifica un texto (lo usa el worker; también sirve para probar sin WhatsApp) |
| POST /api/reportes | Guarda un caso y sus entidades |
| POST /api/extraer | Recibe capturas y devuelve entidades + denuncia |

El worker llama a estos endpoints, así toda la lógica de IA y de la red
vive en un solo lugar.

### 6. Datos sintéticos

Un script genera **150 a 200 reportes** para que la red no arranque
vacía en la demo:

- Distintas provincias y modalidades, con montos y fechas de los últimos
  90 días.

- CBU con dígitos verificadores válidos y alias con estilo real.

- **3 o 4 clusters plantados**, incluido el alias de la demo
  (juli.martinez.mp) con unos 23 reportes en 5 provincias.

- Ruido: alias mal escritos y teléfonos con y sin 549, para lucir la
  normalización.

- Todos marcados con fuente = sintetico. En el pitch se dice.

## Plan de trabajo

Objetivo: a las 13:45 el recorrido completo tiene que andar de punta a
punta, aunque sea feo. Después se pule y se graba.

| Hora | Dev A — Datos y web | Dev B — IA | Dev C — WhatsApp | D — Demo y pitch |
|----|----|----|----|----|
| 11:45–12:15 | Repo público, Next.js en Vercel, Supabase con las tablas | Prompt del clasificador y esquema JSON | Baileys conectado a un número secundario, logueando mensajes | Conseguir 2 celulares y un número secundario para la demo |
| 12:15–13:00 | Script de datos sintéticos + normalización + /api/entidad | /api/analizar probado con 10 mensajes de estafa y 10 normales | Filtro de desconocidos + llamada a /api/analizar | Guion del estafador y textos de los mensajes de prueba |
| 13:00–13:45 | /verificar | Transcripción de audios + /api/reportes | Envío de alertas al chat propio y al grupo familiar; worker deployado en el VPS | Capturas falsas para "Me estafaron" |
| 13:45–14:15 | Integración y prueba del recorrido completo | Integración | Integración | Primer ensayo del pitch |
| 14:15–14:45 | /panel con alertas en vivo | /me-estafaron (si sobra tiempo) | Estabilidad: reconexión y sesión persistida | Grabar una toma de respaldo de la demo |
| 14:45–15:30 | README y limpieza del repo | Ajustes de prompts | Prueba en celulares reales | Grabar y editar el video final, subir a YouTube |
| 15:30–15:45 | Todos: probar la URL en incógnito y desde otro celular, revisar el video y hacer el submit |  |  |  |

**Si son menos de 4**, recortar en este orden: /me-estafaron, /panel,
transcripción de audios. Lo mínimo que sostiene la demo es: worker con
Baileys, clasificador, red con datos sintéticos, alertas y /verificar.

**Respaldo si Baileys falla:** /api/analizar funciona sin WhatsApp. Una
pantalla web con forma de celular puede mandar mensajes al mismo
endpoint y mostrar la alerta. La IA y la red son las mismas.

## Demo, pitch y jurado

La demo cuenta una sola historia en celulares reales: un estafador
escribe, Mula AI lo reconoce, la familia se entera y la cuenta queda
quemada para todos.

### Guion del video (2 minutos)

1.  **0:00–0:20 — El gancho.** "Una banda le roba a 40 personas con la
    misma cuenta. Cada víctima denuncia sola y cada fiscalía ve una
    estafa chica. Las estafas funcionan porque cada víctima está sola."

2.  **0:20–0:50 — El ataque.** Desde un número desconocido llega al
    celular de "la abuela": *"hola abu, soy Juli, cambié de número.
    Choqué y necesito plata urgente, mandá a juli.martinez.mp"*.

3.  **0:50–1:15 — La detección.** En segundos, en el WhatsApp de la
    abuela: *"⚠️ Este mensaje tiene el patrón de una estafa. El alias
    tiene 23 reportes en 5 provincias. No transfieras."* Y en el grupo
    familiar: *"Alguien escribió a la abuela haciéndose pasar por
    Juli."*

4.  **1:15–1:35 — La red.** Otra persona, a punto de pagar una compra en
    Marketplace, pega ese alias en /verificar y ve la advertencia.

5.  **1:35–1:50 — Por qué escala.** El panel muestra la alerta en vivo y
    la red alrededor de la cuenta: "cada estafa que detectamos protege
    al próximo".

6.  **1:50–2:00 — Cierre.** *"Las estafas funcionan porque cada víctima
    está sola. Con Mula AI, ya no."*

### Detalles que suman

- Mostrar los dos celulares en pantalla a la vez: el del estafador y el
  de la abuela.

- Si el clasificador anda con audios, hacer el ataque con un audio en
  vez de texto. Impacta más.

- Decir al pasar que los reportes previos son sintéticos.

- No mostrar configuración, código ni menús en el video.

### Preguntas del jurado y respuestas

| Pregunta | Respuesta |
|----|----|
| "¿Baileys no es ilegal o contra los términos de WhatsApp?" | "Es nuestro prototipo para validar la detección. En producción el mismo motor va en una app Android que lee notificaciones del propio teléfono y en las apps de bancos y operadoras." |
| "¿Leen todos mis chats?" | "Solo analizamos mensajes de desconocidos o con pedidos de plata; los de tus contactos de confianza ni se procesan." |
| "¿De dónde sale la red?" | "De cada detección y cada denuncia. Hoy la poblamos con datos sintéticos y lo decimos." |
| "¿Y si marcan a un inocente?" | "Mostramos cuentas y reportes con evidencia, nunca nombres. El titular de una cuenta mula muchas veces es otra víctima." |
| "¿Qué pasa con iPhone?" | "Baileys funciona con cualquier teléfono porque se conecta como dispositivo vinculado. La app nativa de producción es primero Android, que es la mayoría en Argentina." |
| "¿Quién paga?" | "Gratis para las personas. Pagan bancos y billeteras por consultar el riesgo de una cuenta antes de una transferencia, y operadoras por ofrecerlo a sus clientes." |
| "¿Esto no lo hacen los bancos?" | "Los bancos suspenden cuentas después del fraude y no comparten. Nosotros vemos el intento antes de que llegue al banco." |

## Riesgos

| Riesgo | Mitigación |
|----|----|
| Meta banea el número usado con Baileys | Número secundario solo para la demo; nunca el personal de nadie del equipo |
| El worker se cae durante la demo | Sesión persistida, reconexión automática, video de respaldo grabado y el simulador web como plan B |
| Falsos positivos ("¡es mi nieto de verdad!") | La alerta pide verificar con la familia, no bloquea nada |
| Privacidad: el servidor ve todo el WhatsApp | Filtrar en el worker y no guardar mensajes de contactos de confianza; en producción, pasar a app en el teléfono |
| Datos personales de terceros | Guardar cuentas y teléfonos, nunca nombres de titulares; verificar límites de la ley de datos personales |
| Red envenenada con reportes falsos | Cada reporte con fuente y nivel de confianza; las detecciones del worker y las denuncias con comprobante pesan más |
| API keys filtradas en el repo público | Todo en variables de entorno de Vercel y del VPS; .env en .gitignore |

## Hoja de ruta después de la hackatón

| Canal | Cómo | Viabilidad |
|----|----|----|
| WhatsApp (prototipo actual) | Baileys como dispositivo vinculado | Sirve para validar; no como producto |
| WhatsApp, SMS y llamadas | App Android con lectura de notificaciones y filtrado de llamadas por número | Alta; es el camino principal |
| iPhone | Etiquetado y bloqueo de llamadas por número + bot de WhatsApp para reenviar | Limitada por diseño de Apple |
| Transferencias | API de riesgo de cuenta dentro de apps de bancos y billeteras | Alta; requiere alianzas |
| Llamadas a nivel red | Integración con operadoras | Alta; ciclo de venta largo |
| Fiscalías | Panel de clusters de cuentas, teléfonos y guiones | Media; venta al sector público |

Límites conocidos: ninguna app de terceros puede escuchar el contenido
de una llamada telefónica en Android, y iPhone no permite leer
notificaciones de otras apps.

## Checklist de entrega

- [ ] URL HTTPS funcionando en modo incógnito y desde otro celular

- [ ] Repositorio público en GitHub con README: qué es, cómo correrlo,
  aclaración de datos sintéticos y del uso de Baileys como prototipo

- [ ] Sin API keys ni sesiones de WhatsApp en el repo

- [ ] Video público en YouTube, la historia completa en los primeros 2
  minutos

- [ ] Credenciales de demo descartables, si el jurado las necesita

- [ ] Submit a las 15:45, no a las 15:59

## Fuentes

- [Reglas de shippe.ar](https://shippear.vercel.app/reglas)

- [ANB — denuncias por delitos
  informáticos](https://www.anbariloche.com.ar/noticias/2026/09/10/116762-ya-no-alcanza-con-detectar-errores-las-estafas-digitales-usan-ia-para-imitar-voces-y-enganar-a-las-victimas)

- [MDZ — estafas con
  IA](https://www.mdzol.com/sociedad/la-estafa-del-mundial-2026-como-la-inteligencia-artificial-puede-vaciar-tu-billetera-n1547753)

- [iProUP — vishing en
  Argentina](https://www.iproup.com/finanzas/48032-clonar-voz-inteligencia-artificial-robo-plata-whatsapp)

- [Hiya AI
  Phone](https://blog.hiya.com/introducing-hiya-ai-phone-revolutionizing-your-phone-conversations)

- [Help Net Security — Truecaller AI Call
  Scanner](https://www.helpnetsecurity.com/?p=302670)

- [Virgin Media O2 —
  Daisy](https://news.virginmediao2.co.uk/o2-unveils-daisy-the-ai-granny-wasting-scammers-time/)
