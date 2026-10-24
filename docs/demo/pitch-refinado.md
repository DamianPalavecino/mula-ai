# Mula AI — pitch para ensayar

Versión de un minuto, para la voz en off del video de Damián o para decirlo en vivo. El primer tercio es el problema: arranca por algo que le pasó a todos, muestra que en ese momento la persona está sola y que lo que existe no llega a tiempo. Recién después aparece Mula AI. Cierra con la frase del principio.

## Idea en una frase

Todos tenemos un familiar al que intentaron estafar, y en ese momento nadie le avisa. Mula AI cuida su WhatsApp, le avisa a esa persona y a su familia a tiempo y suma cada caso a una red compartida.

## Pitch hablado

**Problema (~25 s)**

Todos tenemos un familiar al que intentaron estafar.

Casi siempre empieza así: «Hola, abu, cambié de número. Necesito plata urgente. Mandame a este alias».

Y en ese momento, está sola. La familia se entera tarde. La denuncia, cuando la plata ya salió. Y si ese alias ya estafó a otros, nadie lo cruza: cada víctima denuncia sola.

Hay consejos y campañas, pero nada que le avise en el momento, con lo que ya les pasó a otros.

**Solución (~30 s)**

Mula AI se mete justo ahí. La familia vincula su WhatsApp con un QR. Cuando llega ese mensaje, la IA reconoce el guion y cruza el alias con la red. En segundos le avisa a ella y a su nieta, con un PDF para denunciar.

Cada caso suma a la red: lo que para una familia es un susto, en la red es un patrón.

**Cierre (~5 s)**

Todos tenemos un familiar al que intentaron estafar. Con Mula AI, la próxima vez no está sola.

*(159 palabras: a 2,5 por segundo son unos 64 s. «Está sola» en el problema y «no está sola» en el cierre son la misma idea: no cortes ninguna de las dos. Si sobra tiempo, después del PDF va «¿Dudás antes de pagar? Le preguntás al chat».)*

### Cómo decirlo

- **Video:** la primera frase sola, sobre negro, con un segundo de pausa. Después aparece el mensaje en el celular.
- **En vivo:** preguntá «¿Quién tiene un familiar al que intentaron estafar por WhatsApp?», esperá a que levanten la mano y seguí con «Casi siempre empieza así…».
- **«Está sola»:** decilo más lento y frená un instante antes de «La familia se entera tarde». Es el corazón del problema.
- **«Hay consejos y campañas, pero…»:** es el hueco que llenamos. Sin nombrar productos ni prometer que no existe nada: lo que falta es el aviso *en el momento* y *con lo que les pasó a otros*.
- Si alguien del equipo tiene un caso real y lo puede contar, reemplazá la segunda frase por ese caso en una línea («A mi abuela le escribieron…»). No inventes una anécdota personal.

## Qué mostrar

| Tiempo | Imagen | Propósito |
|---|---|---|
| 0:00–0:05 | Negro, texto blanco: «Todos tenemos un familiar al que intentaron estafar». | Identificación inmediata. |
| 0:05–0:11 | Celular de la abuela: llega «cambié de número…». | El problema concreto. |
| 0:11–0:19 | Placas, una frase por vez: «Está sola» · «La familia se entera tarde» · «Cada víctima denuncia sola». | Por qué hoy no se frena. |
| 0:19–0:25 | Placa: «Consejos y campañas ✓ · Aviso en el momento ✗». | El hueco. |
| 0:25–0:30 | `/app/vincular`: el QR en pantalla (corte breve, sin el login). | Se instala desde la web. |
| 0:30–0:43 | Celular A: aviso en el chat «Tú». Celular C: aviso en el WhatsApp de la nieta + el PDF abierto un segundo. | La alerta y la ayuda práctica. |
| 0:43–0:55 | Pestaña «Red»: grafo a pantalla completa, nodo de `juli.martinez.mp`, CUIT y links; la campana con la alerta nueva. Rótulo: «Reportes previos: datos de ejemplo». | De casos sueltos a un patrón. |
| 0:55–1:04 | Negro: «Todos tenemos un familiar al que intentaron estafar». Logo + `mula-ai.vercel.app`. | Cierre con la misma frase. |

Dejá afuera login y configuración (salvo el QR). El chat de Inicio y «Me estafaron» ya no van en la voz para dejarle tiempo al problema; quedan para las preguntas o para la demo en vivo. Los «datos de ejemplo» van como rótulo en pantalla.

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
- No decir «no existe ninguna solución». Un jurado puede nombrar avisos de bancos o de WhatsApp. Lo defendible es más preciso: lo que hay son consejos generales o llega después (la denuncia), y nada le avisa a la persona en el momento con lo que ya reportaron otros.
- «Todos tenemos un familiar…» es un gancho, no una estadística. No sumar cifras de víctimas, eficacia ni clientes sin fuente, ni atribuir los datos de ejemplo a víctimas reales.

## Iteraciones

1. V1: gancho familiar, explicación de IA, red y cierre sobre transferencias apresuradas.
2. Jurado de claridad: 7/10 en claridad y 8/10 en gancho. Pidió concretar la llamada del familiar, explicar qué dato conecta los reportes y reemplazar «sintéticos» por «datos de ejemplo».
3. V2: incorporó esas correcciones, simplificó el recorrido y agregó un próximo paso medible. Segunda evaluación: 9/10 en claridad y gancho, 8/10 en prudencia de promesas.
4. V3: quitó la repetición del ataque y cambió el cierre por «una alerta para frenar, llamar y verificar». Los puntajes son del jurado simulado sobre V2, no validación del producto.
5. Jurado de valor y credibilidad sobre V1: valor 8/10, credibilidad 7/10. Señaló la prueba familiar pendiente, distinguir coincidencia de fraude confirmado y separar IA de consulta a la base.
6. Revisión según el spec: tres momentos del producto —alerta, consulta antes de pagar y ayuda después— más el tablero.
7. V4 (24/10 tarde): arranca y cierra con «Todos tenemos un familiar al que intentaron estafar». Suma lo nuevo: vincular con QR desde la web, aviso a la nieta con PDF para denunciar, chat de Inicio que acepta alias y capturas, CUIT y links en la red. El aviso de datos de ejemplo pasa a rótulo en pantalla. Sin nueva evaluación de jurado.
8. V5 (24/10 tarde): el primer tercio desarrolla el problema (en ese momento está sola, la familia se entera tarde, cada víctima denuncia sola) y el hueco (consejos y campañas, pero nada que avise en el momento). El cierre retoma «no está sola». El chat y «Me estafaron» salen de la voz para hacer lugar.

## Preguntas para ensayar

**¿Por qué IA?** El modelo entiende el mensaje aunque cambien las palabras, extrae alias, CBU, teléfonos, CUIT y links, y lee capturas. La base busca coincidencias. Si el modelo tarda, alertan reglas de respaldo. Falta medir cuánto mejora frente a usar solo reglas.

**¿No existe ya algo así?** Hay consejos, campañas y avisos generales, y la denuncia llega después. Lo que no vimos es algo que lea el mensaje en el WhatsApp de la persona, le avise en ese momento a ella y a su familia, y lo cruce con lo que ya reportaron otros. (Si el jurado nombra un producto puntual, no lo discutas: preguntá si avisa en el momento y si conecta los casos.)

**¿Cómo se instala?** La familia entra a la web, carga a su protegido y escanea un QR con el WhatsApp de esa persona, como WhatsApp Web. No hay que instalar nada en su celular. (Decirlo solo si el QR quedó probado.)

**¿Leen todos los mensajes?** Los contactos de confianza no se analizan. Lo demás pasa por un filtro, y la IA mira solo lo que trae plata, alias, CBU, links o un pedido urgente. Mula AI nunca le responde al estafador. (El filtro está en el código. Antes de afirmarlo, confirmá que esté deployado en el VPS.)

**¿Qué hace el PDF?** Junta lo que necesita una denuncia: el mensaje, el número, las cuentas y cuántos reportes tienen en la red, con el link para hacer la denuncia online en Santa Fe. No hace la denuncia por la persona.

**¿Cuántas estafas evitaron?** Todavía no medimos impacto real. Hay ensayos del prototipo. El próximo paso es probarlo con familias y medir detecciones, falsas alarmas y respuesta a los avisos.

**¿Un reporte prueba que alguien es estafador?** No. Es una señal para revisar. Los reportes previos de la demo son datos de ejemplo, y compartir cuenta o teléfono no demuestra culpabilidad.

**¿Quién pagaría?** Es una hipótesis sin validar. Primero queremos comprobar utilidad y adopción. No presentamos bancos, gobiernos ni familias como clientes.
