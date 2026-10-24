# Jurado — preguntas y pitches

## Preguntas probables

| Pregunta | Respuesta |
|---|---|
| ¿Baileys no va contra los términos de WhatsApp? | Es el prototipo para validar la detección. En producción el mismo motor va en una app Android que lee las notificaciones del propio teléfono, y como API en bancos y operadoras. |
| ¿Leen todos mis chats? | No. Los mensajes de contactos de confianza ni se procesan; solo miramos desconocidos o mensajes con pedidos de plata, alias o CBU. |
| ¿De dónde sale la red? | De cada detección y cada denuncia. Hoy la poblamos con datos sintéticos, marcados como tales, y lo decimos en el video. |
| ¿Y si marcan a un inocente? | Mostramos cuentas y cantidad de reportes, nunca nombres; el titular de una cuenta mula muchas veces es otra víctima. La alerta pide verificar con la familia, no bloquea nada. |
| ¿Qué pasa con iPhone? | Baileys se vincula como WhatsApp Web, así que anda con cualquier teléfono. La app de producción es primero Android, que es la mayoría en Argentina. |
| ¿Quién paga? | Gratis para las personas. Pagan bancos y billeteras por consultar el riesgo de una cuenta antes de una transferencia, y operadoras por ofrecerlo a sus clientes. |
| ¿Esto no lo hacen los bancos? | Los bancos suspenden cuentas después del fraude y no lo comparten. Nosotros vemos el intento antes de que la plata llegue al banco. |
| ¿Y las voces clonadas con IA? | No dependemos de detectar si la voz es falsa: decidimos por el guion, el pedido de plata y la red. Funciona igual con un clon o con un actor de carne y hueso. |
| ¿Qué hace exactamente la IA? | Un LLM clasifica el guion (8 modalidades argentinas), detecta suplantación y urgencia, extrae alias, CBU y teléfonos, y redacta las alertas. Con capturas, un modelo con visión arma la denuncia y el pedido de bloqueo. |
| ¿Y si la red se llena de reportes falsos para quemar a alguien? | Cada reporte guarda su fuente y su confianza; las detecciones en vivo y las denuncias con comprobante pesan más que un reporte suelto. Una cuenta no se "quema" por un solo reporte. |
| ¿Cómo escala a una provincia o al país? | La red es una sola base que crece con cada teléfono protegido. Una fiscalía puede ver los clusters (mismas cuentas y números en distintas provincias) y unir causas que hoy se investigan sueltas. |

## Pitch de 30 s

> Las estafas funcionan porque cada víctima está sola. Toda estafa necesita dos piezas que las bandas reusan con decenas de víctimas: un número y una cuenta mula. Mula AI vigila el WhatsApp de una persona mayor, reconoce el guion y la cuenta en el momento en que llegan y le avisa a ella y a su familia antes de que salga la plata. Y cada número y cada cuenta que detectamos quedan en una red compartida que cualquiera consulta antes de pagar. Detectamos al estafador, quemamos su cuenta y protegemos al próximo.

## Pitch de 2 min (final)

1. **El problema (20 s).** En 2024 hubo más de 34.000 denuncias por delitos informáticos en Argentina, 21 % más que el año anterior, y la mayoría de estas estafas entra por WhatsApp. Una banda le roba a cuarenta personas con la misma cuenta, pero cada víctima denuncia sola y cada fiscalía ve una estafa chica. Nadie junta las piezas.

2. **La idea (20 s).** Toda estafa necesita dos piezas reutilizables: un contacto y un destino para la plata. Si atacás esas piezas, atacás la infraestructura de la banda, no a una víctima por vez.

3. **Qué hace (40 s).** Mula AI se vincula al WhatsApp de la persona protegida. Cada mensaje o audio de un desconocido lo analiza una IA entrenada en los guiones locales: "cambié de número", el accidente, la comisaría, el falso ANSES, el falso comprador. Extrae el alias o el CBU y consulta la red. Si es una estafa, avisa a la persona y al grupo familiar en segundos, porque alguien asustado decide mal y la familia puede verificar. Nunca le responde al estafador.

4. **La red (20 s).** Cada detección suma el número y la cuenta a una red compartida. Cualquiera puede pegar un alias antes de pagar en Marketplace. Y quien ya transfirió sube las capturas y recibe la denuncia y el pedido de bloqueo armados, vinculados a los otros casos.

5. **Por qué gana (20 s).** Los bancos suspenden cuentas después del fraude y no comparten; las apps de llamadas avisan a la víctima pero no a la familia ni a la red. Nosotros actuamos donde pasa la estafa, antes de la transferencia. Es gratis para las personas: pagan bancos, billeteras y operadoras por consultar el riesgo de una cuenta. El prototipo usa WhatsApp vinculado; el producto es una app Android y una API para bancos.

6. **Cierre (5 s).** Las estafas funcionan porque cada víctima está sola. Con Mula AI, ya no.
