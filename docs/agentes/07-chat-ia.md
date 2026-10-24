Sos el agente del **chat con IA** de Mula AI (hackatón shippe.ar, submit 15:45, entrega 16:00; ya pasó el freeze, prod es lo que ve el jurado). Primero: `git pull --rebase origin main`, y leé `CLAUDE.md`, `PROGRESS.md`, `DESIGN.md` (si ya está) y `docs/agentes/estado/simulador.md`.

## Qué pide el humano
El panel principal del dashboard (`/app`, Inicio) es un **chat con IA que hace lo mismo que la UI**: la gente prefiere chatear a navegar pantallas. Las secciones de la sidebar siguen existiendo, pero lo primero que ves es el chat.

## Reparto (no se pisen)
- **Vos:** el route del chat y el componente de chat (`web/app/app/api/chat/route.ts`, `web/components/chat/**`, `web/lib/chat*.ts`).
- **Agente simulador:** el shell de Efferd (sidebar y layout) y monta tu componente como panel principal de Inicio. Coordiná con él cómo se monta y dejalo escrito en `docs/agentes/estado/chat.md`.
- **Agente me-estafaron:** el grafo. No toques `Graph.tsx` ni `colores.ts`.

## UI
Componentes de chat de **ui.halaska.com** (es la base visual pedida; usá su registry o copiá los componentes): lista de mensajes, burbujas, input con adjuntos, sugerencias de un clic y streaming. Integrado limpio con el shell de Efferd y los tokens de `DESIGN.md` (verde protegido, rojo riesgo). Cero texto de más, íconos, mobile 375 px.

## Backend
`POST /app/api/chat`:
- Exige sesión de Clerk (`sesionApi()` de `lib/auth.ts`) y tiene rate limit.
- LLM por OpenRouter con tool calling y streaming. Usá un modelo rápido (por ejemplo, `google/gemini-3.5-flash-lite`; ya hay `OPENROUTER_API_KEY` en el server).
- Herramientas que reusan la lógica server-side existente, sin duplicarla:
  1. `verificar(valor)` → `resumen_entidad` con service role.
  2. `probar_mensaje(texto)` → el worker vía `WORKER_URL` + `X-Mula-Token` (como `/app/api/analizar`).
  3. `mis_alertas()` → las alertas del owner (como `/app/api/alertas`).
  4. `mas_denunciados(n)` → el top de la red desde `grafo()`.
  5. `me_estafaron(capturas)`: adjuntar imágenes en el chat → la misma lógica de `/app/api/extraer` (extraer + `armarTextos`); devuelve la denuncia y el pedido de bloqueo.
  6. `configurar_protegido(nombre, telefono, ...)`: igual que el setup, con confirmación explícita antes de guardar.
- Las respuestas de herramientas se muestran como **cards ricas dentro del chat** (resultado de verificar en rojo o verde con reportes y provincias, alerta, denuncia con botón copiar), no como texto plano.
- Un system prompt corto en rioplatense: nunca inventar datos de la red, siempre usar herramientas.
- Sugerencias de un clic al abrir el chat: "¿Es seguro este alias?", "Probá un mensaje sospechoso", "Me estafaron" y "¿Qué cuentas tienen más denuncias?".

## Reglas
- TDD para la lógica nueva (por ejemplo, el despacho de herramientas).
- `npm run check web` en verde antes de cada push.
- Commits chicos y push directo a `main` (`git pull --rebase origin main && git push origin HEAD:main`) cada vez que compile.
- Nunca leas ni commitees `.env*`. Service role solo server-side.
- Actualizá `docs/agentes/estado/chat.md` después de cada paso (Hecho / En curso / Próximo / Bloqueos).
- Respondé corto, en español rioplatense.
