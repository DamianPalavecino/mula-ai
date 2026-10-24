# Mula AI — pitch para ensayar

Versión de un minuto, refinada con dos jurados críticos. Locución breve para acompañar el video de Damián.

## Idea en una frase

Mula AI ayuda a las familias a frenar una estafa, revisar una cuenta antes de pagar y preparar los próximos pasos si ya transfirieron.

## Pitch hablado

Una estafa puede empezar así: «Hola, abu, cambié de número. Necesito plata urgente. Mandame a este alias».

Mula AI analiza mensajes de WhatsApp con inteligencia artificial y detecta señales de estafa. En el prototipo, la alerta llega al chat de la persona en unos tres segundos. También podés configurar a qué familiar avisar.

Antes de pagar, verificá un alias, CBU o teléfono. Si ya transferiste, subí capturas y recibí un borrador de denuncia y pedido de bloqueo para revisar.

El sistema conecta cuentas y teléfonos repetidos en un tablero para explorar patrones. Los reportes previos de esta demo son datos de ejemplo.

Mula AI: frenar, verificar y actuar.

## Qué mostrar

| Tiempo | Imagen del video o captura de producto | Propósito |
|---|---|---|
| 0:00–0:08 | Chat sospechoso; abuela recibe «cambié de número» | Gancho humano y problema concreto. |
| 0:08–0:22 | WhatsApp y alerta del prototipo | Mostrar detección; el rótulo «~3 s» solo si el montaje conserva la prueba real. |
| 0:22–0:32 | `/app/verificar` con alias/CBU/teléfono | Consulta antes de pagar. |
| 0:32–0:43 | `/app/me-estafaron`: capturas y borrador | Ayuda posterior; mostrar que la denuncia se revisa antes de usarla. |
| 0:43–0:54 | `/app` y `/admin`: alertas y grafo | Rótulo visible: «Reportes previos: datos de ejemplo». |
| 0:54–1:00 | Logo y URL | Cierre: «Frenar, verificar y actuar». |

La locución tiene que entrar en 60 segundos con pausas. Dejá las pantallas de login y configuración fuera del montaje; usá el video de Damián para el gancho y cortes breves de producto para que se entienda qué existe.

## Condiciones de la narración

- El spec actualizado confirma detección real por WhatsApp y una alerta al chat propio en unos 3 segundos. La entrega al familiar y su aparición en `/app` y `/admin` siguen en la lista de pruebas pendientes; no afirmarlas como verificadas hasta comprobarlas en una toma.
- `/app/verificar`, `/app/me-estafaron` y el tablero `/admin` están incluidos en la web. El spec no acredita una prueba de punta a punta de esos recorridos; comprobarlos antes de presentarlos como una demo en vivo.
- Si se muestra una simulación, rotularla como simulación. Una animación precalculada no demuestra detección en vivo.
- Los reportes son señales para verificar; una coincidencia no prueba una estafa ni identifica una banda.
- No afirmar que bloqueamos cuentas, recuperamos dinero o evitamos todas las estafas.
- No usar cifras de víctimas, eficacia, clientes ni ahorros sin evidencia. No atribuir los datos de ejemplo a víctimas reales.

## Iteraciones

1. V1: gancho familiar, explicación de IA, red y cierre sobre transferencias apresuradas.
2. Jurado de claridad: 7/10 en claridad y 8/10 en gancho. Pidió concretar la llamada del familiar, explicar qué dato conecta los reportes y reemplazar «sintéticos» por «datos de ejemplo».
3. V2: incorporó esas correcciones, simplificó el recorrido y agregó un próximo paso medible. Segunda evaluación de claridad: 9/10 en claridad y gancho, 8/10 en prudencia de promesas.
4. V3: quitó la repetición del ataque y cambió el cierre por «una alerta para frenar, llamar y verificar». Los puntajes son opiniones del jurado simulado sobre V2, no validación del producto ni una nueva evaluación de V3.
5. Jurado de valor y credibilidad: V1 recibió valor 8/10 y credibilidad 7/10. Señaló la prueba familiar pendiente, la necesidad de distinguir coincidencias de fraude confirmado y de separar IA de consulta a la base.
6. Revisión según el spec actualizado: el pitch de un minuto cuenta tres momentos del producto —alerta, consulta antes del pago y asistencia después de la estafa— e incluye el tablero para gobierno. Las pruebas de punta a punta siguen pendientes según el documento.

## Preguntas para ensayar

**¿Por qué IA?** El modelo interpreta el mensaje y extrae señales y datos; la base busca coincidencias. Hay reglas de respaldo. Todavía falta medir cuánto mejora el modelo frente a usar solamente reglas.

**¿Cuántas estafas evitaron?** Todavía no medimos impacto real. Tenemos ensayos del prototipo; el próximo paso propuesto es probarlo con familias y medir detecciones, falsas alarmas y respuesta a los avisos.

**¿Un reporte prueba que alguien es estafador?** No. Es una señal para revisar. Los reportes previos de la demo son datos de ejemplo; compartir cuenta o teléfono no demuestra culpabilidad.

**¿Alcanza con cargar el teléfono de mi abuela?** No: el prototipo necesita una sesión de WhatsApp vinculada y configurada. El alta autónoma y la operación con familias reales todavía necesitan validación.

**¿Quién pagaría?** Es una hipótesis pendiente de validar. Primero queremos comprobar utilidad y adopción; no presentamos bancos, gobiernos ni familias como clientes existentes.
