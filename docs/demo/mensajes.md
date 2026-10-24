# Mensajes de la demo

Todos usan `juli.martinez.mp`, el alias plantado en el seed (23 reportes en 5 provincias). Copiar tal cual.

Probados 13:2x con el clasificador real (sin la red): las estafas dan riesgo 85–100 y los normales 0–10. ANSES y el alias suelto después del audio pasaron los 3,5 s y alertaron por la heurística (90 y 100).

## Estafa — el de la toma buena

Desde el celular del estafador (número que no está en `TRUSTED_CONTACTS`):

```
hola abu, soy Juli, cambié de número. Choqué con el auto y necesito plata urgente para el seguro, mandá a juli.martinez.mp que después te explico
```

Es el mismo que trae precargado `/simulador` (en versión un poco más corta), así el plan A y el plan B cuentan lo mismo.

## Estafa — en dos mensajes (más realista)

Si queda tiempo para una toma más natural:

1. `hola abu soy juli, este es mi número nuevo, agendalo 🙏`
2. *(a los 5 s)* `choqué y necesito que me mandes 150 mil urgente a juli.martinez.mp, no le digas a mamá`

Los dos alertan (13:2x: el primero solo da riesgo 85 por "número nuevo" de un familiar; el segundo 90 con el alias). Para el video conviene que la alerta del segundo sea la que se ve, así nombra al alias y sus reportes.

## Estafa — audio de 10 s

Solo si está cargada la key de transcripción en el worker (`OPENAI_API_KEY`). Grabarlo con voz joven y apurada, con algo de ruido de calle:

> "Hola abu, soy Juli, me cambié de número. Escuchame, choqué con el auto y necesito plata ya para el seguro. Te paso el alias por acá, mandame lo que puedas, después te explico. No le digas a mamá, porfa."

Y **enseguida, como texto**:

```
juli.martinez.mp
```

El alias va por texto porque dictado ("juli punto martinez punto eme pe") la transcripción no lo devuelve como alias. Así el audio pone el guion y el texto pone la cuenta que la red reconoce.

## Estafa — falso ANSES (segunda modalidad)

Para mostrar que no es una sola regla. Usa el CVU del mismo cluster que `juli.martinez.mp`:

```
Buenas, le hablamos de ANSES. Para cobrar el refuerzo de octubre tiene que validar su cuenta transfiriendo $5.000 al CVU 0000003100123456789016. Tiene tiempo hasta hoy a las 18 hs.
```

## Mensajes normales (no tienen que alertar)

Desde el mismo número desconocido, para mostrar que no grita por cualquier cosa:

1. `abu, el domingo vamos a comer? llevo las empanadas`
2. `Buenas, soy Carlos el plomero. Mañana a las 10 paso por lo del calefón, ¿le queda bien?`
3. `Hola! Le escribo de la farmacia, ya llegó su receta, puede pasar a retirarla cuando quiera`

Y desde un contacto de confianza (está en `TRUSTED_CONTACTS`), cualquier cosa, incluso `mandame plata al alias juli.martinez.mp`: **no se procesa** (ni aparece en los logs del worker). Sirve si el jurado pregunta "¿leen todos mis chats?".

## Para `/verificar`

| Pegar | Qué se tiene que ver |
|---|---|
| `juli.martinez.mp` | rojo, 23 reportes (24 o más después de la toma), 5 provincias |
| `Juli.Martinez.MP ` | lo mismo: luce la normalización |
| `0000003100123456789016` | CVU con reportes (mismo cluster) |
| `+54 9 341 555-1234` | teléfono con reportes (el que usa la banda en el seed) |
| `maria.gomez.gym` | sin reportes |
