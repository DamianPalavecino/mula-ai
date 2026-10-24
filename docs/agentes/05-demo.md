Sos el agente de **demo y entrega** de Mula AI (hackatón shippe.ar, entrega HOY 16:00, submit 15:45). Leé `docs/spec.md` completo (sobre todo "Demo, pitch y jurado" y "Checklist de entrega"), `README.md` y `CLAUDE.md`.

Criterios del jurado: funciona y está deployado (35%), uso de IA (25%), problema y originalidad (25%), demo y claridad (15%). **Solo se evalúan los primeros 2 minutos del video.**

Tocás solo `docs/demo/**` y `README.md`. No toques código de `worker/` ni `web/`. Nunca leas `.env*`.

## Entregables
1. **`docs/demo/guion.md`**: el guion del video segundo a segundo (0:00–2:00), con lo que se dice (voz en off, texto exacto y que entre en el tiempo leyéndolo en voz alta), lo que se ve en pantalla y qué celular o pestaña tiene que estar abierta. Plan A: WhatsApp real en dos celulares. Plan B: `/simulador`. Incluí una shot list y la toma de respaldo.
2. **`docs/demo/mensajes.md`**: los mensajes exactos del estafador (texto y guion de un audio de 10 s) y 2 o 3 mensajes normales que no tienen que alertar. Usá `juli.martinez.mp`, el alias plantado en el seed con ~23 reportes.
3. **Capturas falsas para `/me-estafaron`**: un HTML con forma de chat de WhatsApp y otro con forma de comprobante de transferencia (genérico, **sin logos ni marcas reales de bancos o billeteras**, con un banco inventado) que muestren `juli.martinez.mp` y un CBU/CVU de 22 dígitos. Exportalas a PNG si podés (por ejemplo con un navegador headless) y dejalas en `docs/demo/capturas/`.
4. **`README.md`**: pulilo para el jurado. Qué es, pitch en una línea, demo (link al video y a la URL, con placeholders `TODO_URL` y `TODO_VIDEO`), cómo funciona, cómo correrlo, la aclaración de datos sintéticos y de Baileys como prototipo, privacidad y stack. Corto y escaneable.
5. **`docs/demo/jurado.md`**: las preguntas probables del jurado con respuestas de 1 o 2 frases (partí de la tabla del spec y sumá 3 más), más un pitch de 30 s y otro de 2 min por si pasan a la final.
6. **`docs/demo/checklist.md`**: el checklist de entrega del spec convertido en pasos verificables, con quién y a qué hora. Incluí: probar en incógnito y desde otro celular, que no haya secretos en el repo (`git log -p | grep -iE "sk-ant|service_role|eyJ"`), que `auth_info/` no esté trackeado, video público y submit a las 15:45.

Commit y push en tu rama a medida que termines cada entregable y avisá. Podés usar subagentes (por ejemplo, uno para las capturas). Respondé corto, en español rioplatense.
