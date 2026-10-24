# Plan para 2 personas

Un repo con dos carpetas independientes y Supabase como contrato. Damian escribe en la red (worker), el amigo la lee (web). El contrato vive en `CLAUDE.md`.

## Puntos de sincronización
- **11:45–12:00** — schema, RPCs y seed, juntos.
- **13:30** — primera integración: se manda un mensaje de estafa y tiene que aparecer en `/red`.
- **14:30** — recorrido completo andando; se empieza a grabar.

## Worker (Damian → Railway)
1. Conectar Baileys a un número secundario y loguear mensajes (lo primero que puede trabarse).
2. Filtro de desconocidos y regex de entidades.
3. Clasificador con salida JSON. Probarlo con 10 mensajes de estafa y 10 normales antes de conectarlo (`npm run test:classify`).
4. `registrar_reporte` y alertas: al chat propio (`jidNormalizedUser(sock.user.id)`) y al grupo familiar.
5. Deploy en Railway con un volumen para `auth_info`, así no se reescanea el QR en cada reinicio.
6. Audios, si sobra tiempo.

Ojo con Baileys:
- Algunos remitentes llegan como `...@lid` en vez de número. Buscar el número en el campo alternativo (`remoteJidAlt` / `participantAlt` / `senderPn`) antes de comparar con los contactos de confianza.
- El ID propio puede venir con sufijo de dispositivo (`549...:12@s.whatsapp.net`) → `jidNormalizedUser`.

## Web (amigo → Vercel)
- `/` — qué es, el problema en una frase y "cómo se configura" en 3 pasos.
- `/verificar` — input → `resumen_entidad` → resultado claro, en rojo si tiene reportes.
- `/red` — grafo con `react-force-graph-2d` a partir de `grafo()`. Nodos de cuenta más grandes según reportes, color por tipo, click en un nodo para ver su resumen. Feed de alertas en vivo (Realtime sobre `alertas`) al costado.
- Si sobra tiempo: que el nodo de la alerta nueva se destaque en el grafo.

## Recorte si falta tiempo
`/me-estafaron` → audios → panel. Lo mínimo: worker + clasificador + red con seed + alertas + `/verificar`.
