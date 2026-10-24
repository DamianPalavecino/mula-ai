# Mula AI — pitch para ensayar

Versión de un minuto, para la voz en off del video de Damián o para decirlo en vivo. Arranca por algo que le pasó a todos y cierra con la misma frase.

## Idea en una frase

Todos tenemos un familiar al que intentaron estafar: Mula AI cuida su WhatsApp, le avisa a él y a su familia a tiempo, y suma cada caso a una red compartida.

## Pitch hablado

Todos tenemos un familiar al que intentaron estafar.

Casi siempre empieza así: «Hola, abu, cambié de número. Necesito plata urgente. Mandame a este alias».

Mula AI cuida el WhatsApp de esa persona. La familia lo vincula con un QR.

Cuando llega un mensaje así, la IA reconoce el guion y cruza el alias con la red. En segundos le avisa a la abuela en su chat, y a la nieta en su WhatsApp, con un PDF con los datos para denunciar.

¿Dudás antes de pagar? Pegás el alias o una captura en el chat y te dice si tiene reportes. Si ya transferiste, te arma la denuncia y el pedido de bloqueo para revisar.

Cada caso suma a una red compartida de cuentas, teléfonos y links. Lo que para una familia es un susto, en la red es un patrón.

Todos tenemos un familiar al que intentaron estafar. Con Mula AI, la próxima vez alguien avisa a tiempo.

*(unas 158 palabras: a 2,5 por segundo da poco más de un minuto. Si hay que recortar, lo primero que se va es la oración de «Si ya transferiste…».)*

### Cómo decir el arranque

- **Video:** la primera frase sola, sobre negro, y después una pausa de un segundo. Recién ahí aparece el mensaje en el celular.
- **En vivo:** preguntá «¿Quién tiene un familiar al que intentaron estafar por WhatsApp?», esperá las manos y seguí con «Casi siempre el mensaje es este…».
- Si alguien del equipo tiene un caso real y lo puede contar, reemplazá la segunda frase por ese caso en una línea («A mi abuela le escribieron…»). No inventes una anécdota personal.

## Qué mostrar

| Tiempo | Imagen | Propósito |
|---|---|---|
| 0:00–0:06 | Negro, texto blanco: «Todos tenemos un familiar al que intentaron estafar». | Identificación inmediata. |
| 0:06–0:12 | Celular de la abuela: llega «cambié de número…». | El problema concreto. |
| 0:12–0:17 | `/app/vincular`: el QR en pantalla (corte breve, sin el login). | Se instala en un minuto, desde la web. |
| 0:17–0:30 | Celular A: aviso en el chat «Tú». Celular C: aviso en el WhatsApp de la nieta + el PDF adjunto abierto un segundo. | La alerta y la ayuda práctica para la familia. |
| 0:30–0:42 | Inicio de `/app`: el chat con «¿juli.martinez.mp es estafa?» → tarjeta roja. Corte a la pestaña «Me estafaron» con el borrador. | Antes de pagar y después de pagar. |
| 0:42–0:54 | Pestaña «Red»: grafo a pantalla completa, nodo de `juli.martinez.mp`, CUIT y links. La campana con la alerta nueva. Rótulo: «Reportes previos: datos de ejemplo». | De casos sueltos a un patrón. |
| 0:54–1:00 | Negro: «Todos tenemos un familiar al que intentaron estafar». Logo + `mula-ai.vercel.app`. | Cierre con la misma frase. |

Dejá afuera login y configuración (salvo el QR). Los «datos de ejemplo» van como rótulo en pantalla, no en la voz, para ganar segundos.

## Condiciones de la narración

Qué se puede decir según lo verificado en `PROGRESS.md` (24/10, 15:3x):

| Afirmación | Estado | Si no se verifica antes de grabar |
|---|---|---|
| Alerta al chat propio en segundos | ✅ Verificada: WhatsApp real ~5 s; por `/analizar` 2,8–3,5 s | — |
| Aviso a la nieta por WhatsApp | ⏳ Falta un mensaje de prueba. Con Kapso solo llega si el familiar le escribió al número de Kapso en las últimas 24 h: que el celular C le mande «hola» antes de la toma | Decir «y le puede avisar a la familia» y no mostrar el celular C |
| PDF con los datos para la denuncia | ⏳ Recién deployado (15:32), sin prueba en una toma | Sacar «con un PDF…» |
| Vincular con QR desde la web | ⏳ Código en `main`, sin prueba de punta a punta | Sacar la oración del QR y el corte de `/app/vincular` |
| Chat de Inicio con alias y capturas | ⏳ Falta probarlo en Vercel con login | Mostrar la pestaña «Verificar» y decir «verificás el alias» |
| Borrador de denuncia y pedido de bloqueo | ✅ `/me-estafaron` en Vercel, 22 s, extrae alias/CVU/teléfono | Acelerar el corte en el montaje (tarda) |
| Red con CUIT y links | ✅ En prod | — |

Además:

- Si se muestra una simulación, rotularla como simulación. Una animación precalculada no demuestra detección en vivo.
- Un reporte es una señal para verificar: una coincidencia no prueba una estafa ni identifica una banda.
- No decir que bloqueamos cuentas, recuperamos plata, hacemos la denuncia por la persona ni frenamos todas las estafas. El PDF junta datos; la denuncia la hace la familia.
- «Todos tenemos un familiar…» es un gancho, no una estadística. No sumar cifras de víctimas, eficacia ni clientes sin fuente, ni atribuir los datos de ejemplo a víctimas reales.

## Iteraciones

1. V1: gancho familiar, explicación de IA, red y cierre sobre transferencias apresuradas.
2. Jurado de claridad: 7/10 en claridad y 8/10 en gancho. Pidió concretar la llamada del familiar, explicar qué dato conecta los reportes y reemplazar «sintéticos» por «datos de ejemplo».
3. V2: incorporó esas correcciones, simplificó el recorrido y agregó un próximo paso medible. Segunda evaluación: 9/10 en claridad y gancho, 8/10 en prudencia de promesas.
4. V3: quitó la repetición del ataque y cambió el cierre por «una alerta para frenar, llamar y verificar». Los puntajes son del jurado simulado sobre V2, no validación del producto.
5. Jurado de valor y credibilidad sobre V1: valor 8/10, credibilidad 7/10. Señaló la prueba familiar pendiente, distinguir coincidencia de fraude confirmado y separar IA de consulta a la base.
6. Revisión según el spec: tres momentos del producto —alerta, consulta antes de pagar y ayuda después— más el tablero.
7. V4 (24/10 tarde): arranca y cierra con «Todos tenemos un familiar al que intentaron estafar». Suma lo nuevo: vincular con QR desde la web, aviso a la nieta con PDF para denunciar, chat de Inicio que acepta alias y capturas, CUIT y links en la red. El aviso de datos de ejemplo pasa a rótulo en pantalla. Sin nueva evaluación de jurado.

## Preguntas para ensayar

**¿Por qué IA?** El modelo entiende el mensaje aunque cambien las palabras, extrae alias, CBU, teléfonos, CUIT y links, y lee capturas. La base busca coincidencias. Si el modelo tarda, alertan reglas de respaldo. Falta medir cuánto mejora frente a usar solo reglas.

**¿Cómo se instala?** La familia entra a la web, carga a su protegido y escanea un QR con el WhatsApp de esa persona, como WhatsApp Web. No hay que instalar nada en su celular. (Decirlo solo si el QR quedó probado.)

**¿Leen todos los mensajes?** Los contactos de confianza no se analizan. Lo demás pasa por un filtro, y la IA mira solo lo que trae plata, alias, CBU, links o un pedido urgente. Mula AI nunca le responde al estafador. (El filtro está en el código. Antes de afirmarlo, confirmá que esté deployado en el VPS.)

**¿Qué hace el PDF?** Junta lo que necesita una denuncia: el mensaje, el número, las cuentas y cuántos reportes tienen en la red, con el link para hacer la denuncia online en Santa Fe. No hace la denuncia por la persona.

**¿Cuántas estafas evitaron?** Todavía no medimos impacto real. Hay ensayos del prototipo. El próximo paso es probarlo con familias y medir detecciones, falsas alarmas y respuesta a los avisos.

**¿Un reporte prueba que alguien es estafador?** No. Es una señal para revisar. Los reportes previos de la demo son datos de ejemplo, y compartir cuenta o teléfono no demuestra culpabilidad.

**¿Quién pagaría?** Es una hipótesis sin validar. Primero queremos comprobar utilidad y adopción. No presentamos bancos, gobiernos ni familias como clientes.
