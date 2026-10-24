# 06 — Reestructura: landing pública + dashboard de usuario + dashboard de gobierno

**Para:** el chat orquestador (Fable, modo `/fableloso`). Leé esto entero, después `CLAUDE.md` y `PROGRESS.md`.
**Horario:** escrito 13:20. Freeze 14:30, submit 15:45, entrega 16:00. Si algo no entra antes de 14:30, recortá por prioridad (P0 > P1 > P2) y no lo empieces.

## Por qué (lo que está mal hoy)
Hoy cualquiera que entra a la web de Vercel:
- Le pega al LLM sin login: `/simulador` llama al `POST /analizar` del worker (DeepSeek por OpenRouter) con `NEXT_PUBLIC_WORKER_URL`, y `/me-estafaron` llama a `POST /api/extraer` (Sonnet con visión por OpenRouter). Cualquiera puede gastar nuestros créditos y ver respuestas raras del modelo. Ejemplo real: "Holaaa vieja trola mandame $1000" en el simulador → "✓ sin señales de estafa".
- Lee la base entera: `NEXT_PUBLIC_SUPABASE_ANON_KEY` va al browser y RLS deja que `anon` haga `select` en las 4 tablas (incluidos los textos de los mensajes en `reportes.texto` y las alertas) y ejecute `grafo()` / `resumen_entidad()`.

## Qué tiene que quedar (decisión de Damian, no re-discutir)
1. **Landing pública (`/`)**: para cualquiera. **Cero LLM y cero DB desde el browser.** Explica el producto y tiene CTA a "Entrar". Si hay demo interactiva, es **programática**: guiones predefinidos con su resultado precalculado en código (sin input libre que vaya a un modelo).
2. **Dashboard de usuario (`/app`)**, con login: la persona protegida o un familiar hace el **setup** (a quién protege, teléfonos de confianza, familiares que reciben la alerta) y ve **sus** alertas.
3. **Dashboard de administrador / gobierno (`/admin`)**, con login y rol admin: ve la data de la red (el grafo de `/red`, feed de alertas, stats por provincia y modalidad, buscador de alias/CBU).

## Decisiones técnicas (ya tomadas)
- **Auth: Clerk** (cambio de Damian 13:25, reemplaza a Supabase Auth). `@clerk/nextjs`: `<ClerkProvider>` en el layout, `clerkMiddleware` en `web/middleware.ts` que protege `/app(.*)` y `/admin(.*)`, `<SignIn/>` y `<SignUp/>` en `/entrar`, `<UserButton/>` en el header. Variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` (agregalas a `.env.example`; **Damian crea la app en clerk.com y carga las keys en `web/.env.local` y en Vercel**. Pedíselo apenas arranques, es lo que bloquea).
- **Supabase no conoce a Clerk** (no se configura la integración third-party: no hay tiempo). La base queda cerrada para `anon` y **todas las lecturas y escrituras de la web van server-side** (server components / route handlers) con `SUPABASE_SERVICE_ROLE_KEY`, **siempre después** de `auth()` de Clerk y del chequeo de rol. Un solo helper `web/lib/supabase-admin.ts` (server-only, `import 'server-only'`) y helpers `requireUser()` / `requireAdmin()` en `web/lib/auth.ts`.
- **Roles:** variable server-only `ADMIN_EMAILS` (coma). `requireAdmin()` = el email primario de `currentUser()` está en la lista. Sin tabla de perfiles. Cualquier otro usuario logueado es "usuario".
- **Setup del usuario:** tabla nueva `protegidos (id bigserial, owner text /* Clerk userId */, nombre text, telefono text /* normalizado con normalizar('telefono', …) */, contactos_confianza text[], familiares text[], provincia text, created_at)`, índice en `owner`. Sin policies para anon/authenticated: solo service role. La web siempre filtra por `owner = userId` de Clerk.
- **Alertas en vivo sin Realtime del browser:** como el browser ya no tiene acceso a Supabase, el feed de `/admin` y de `/app` hace polling cada 3-5 s a una route server-side (`/admin/api/alertas`, `/app/api/alertas`) que chequea la sesión. Si sobra tiempo después del freeze, recién ahí evaluar la integración nativa Clerk ↔ Supabase para Realtime.
- **Ver "sus" alertas:** `alertas.protegido` hoy es un nombre de texto. Para filtrar sin cambiar el contrato: agregar columna nullable `alertas.protegido_id bigint references protegidos(id)` (agregar, nunca renombrar). Para la demo alcanza con: el worker (o un update a mano) setea `protegido_id` del protegido de la demo. Si no entra, el dashboard de usuario muestra alertas donde `alertas.protegido = protegidos.nombre` del dueño.
- **Cierre de la base (P0):**
  - `revoke select` de `anon` y `authenticated` en `reportes`, `entidades`, `reporte_entidad`, `alertas`; borrar las policies `*_select_publico`.
  - `revoke execute` de `anon` y `authenticated` en `grafo`, `resumen_entidad`, `normalizar`, `detectar_tipo`, `entidad_canonica`, `modalidad_label`. Solo `service_role` (la web server-side y el worker).
  - Tabla `protegidos` y columna `alertas.protegido_id` con RLS habilitado y sin policies (solo service role).
  - Todo en un archivo nuevo `supabase/auth.sql` (idempotente, como `schema.sql`), aplicado en prod con el MCP de Supabase o el SQL editor. No tocar `schema.sql` / `functions.sql` salvo las líneas de grants a `anon`.
  - **Orden de deploy:** el revoke rompe la web vieja (lee con anon). Aplicalo recién cuando la web nueva (server-side) esté deployada en Vercel, o en el mismo momento.
- **LLM fuera de lo público (P0):**
  - El browser nunca llama al worker. Sacar `NEXT_PUBLIC_WORKER_URL` del cliente. Si el dashboard de usuario necesita "probar un mensaje", va por una route server-side (`/app/api/analizar`) que exige sesión y llama al worker con `WORKER_URL` + header `X-Mula-Token` (server-only).
  - Worker: `POST /analizar` exige `X-Mula-Token` siempre (no solo con `enviar_whatsapp`), y CORS deja de ser `*`. **Ojo: hay cambios sin commitear en `worker/src/*` de otro chat** ("Detección de estafas en Mula AI" / "Latencia de alerta del worker"). No toques el worker hasta coordinar con ese chat; si hay que tocarlo, que lo haga ese chat o esperá a que commitee.
  - `/me-estafaron` + `/api/extraer`: pasa a estar detrás de login (dentro de `/app`). La route exige sesión.
- **Rutas finales:**
  - Públicas: `/` (landing), `/entrar` (login + registro).
  - Usuario: `/app` (resumen + sus alertas en vivo), `/app/setup` (alta/edición del protegido), `/app/me-estafaron`, `/app/verificar`.
  - Admin: `/admin` (grafo + feed + stats), `/admin/verificar`.
  - Borrar o redirigir a `/`: `/simulador`, `/red`, `/verificar`, `/me-estafaron` públicas. Header según sesión y rol.
- **Cuentas de demo:** una admin (gobierno, su email en `ADMIN_EMAILS`) y una de familiar con el protegido "Abuela Marta" ya cargado (fila en `protegidos` con `owner` = su Clerk userId). Damian las crea en el dashboard de Clerk (o por la Backend API con `CLERK_SECRET_KEY` desde un script local). **Las contraseñas no van al repo (es público).** Que Damian las pase en el submit.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` dejan de usarse en el cliente: borrá `web/lib/supabase.ts` (browser) y todo import desde componentes `"use client"`.

## Plan de trabajo (paralelizable)
Contrato primero: la tanda A define tablas y policies; B, C y D arrancan en paralelo contra ese contrato (escrito en este archivo) sin esperar a que A esté aplicado.

| # | Prioridad | Tarea | Modelo sugerido | Toca |
|---|---|---|---|---|
| A | P0 | `supabase/auth.sql` (protegidos, `alertas.protegido_id`, revokes), aplicar en prod **cuando B+C estén deployados**, actualizar `scripts/smoke-prod.mjs` (ahora **anon NO lee** `alertas` ni ejecuta `grafo` → debe dar 401/403/vacío) | Opus | `supabase/`, `scripts/` |
| B | P0 | Clerk en la web: `@clerk/nextjs`, `middleware.ts`, `/entrar`, header con `<UserButton/>` y links según rol, `web/lib/auth.ts` (`requireUser`/`requireAdmin`), `web/lib/supabase-admin.ts` (server-only). Landing `/` sin DB ni LLM (contenido estático + demo programática con 3-4 guiones precalculados reutilizando el look del simulador actual) | Opus | `web/` |
| C | P1 | `/admin`: mover `RedView`/`Graph`/`AlertFeed` adentro; datos del grafo y alertas por server component / route con `requireAdmin()` + service role; feed por polling; stats simples (reportes por provincia y modalidad) | Sonnet (spec cerrado) | `web/app/admin`, `web/components` |
| D | P2 | `/app` + `/app/setup` (form del protegido, alertas propias en vivo), mover `/me-estafaron` y `/verificar` adentro con sesión obligatoria en sus routes | Opus | `web/app/app`, routes |
| E | P0, después de B | Sacar `NEXT_PUBLIC_WORKER_URL` del cliente; worker exige token en `/analizar` (coordinar con el chat del worker) | Sonnet | `web/`, `worker/src/http.ts` |

B, C y D tocan `web/`: repartí archivos para que no se pisen (C solo `web/app/admin/**`, D solo `web/app/app/**`; el header y el middleware son de B).

## Verificación (innegociable, antes de decir listo)
- `npm run check web` y `npm run check prod` en verde (con el smoke actualizado).
- En incógnito contra Vercel: `/` carga sin requests a Supabase ni al worker (DevTools → Network, o Playwright headless contando requests a `supabase.co` y al worker = 0).
- `curl` con la anon key a `/rest/v1/alertas` → sin datos. `rpc/grafo` con anon → error.
- Login admin (Clerk) → `/admin` muestra el grafo con `juli.martinez.mp` (~23 reportes). Login familiar → `/app` muestra solo sus alertas; `/admin` lo rebota. Sin sesión, `/app` y `/admin` (y sus `/api`) redirigen a `/entrar` o dan 401.
- `grep -r "SERVICE_ROLE\|supabase-admin" web/components` vacío (service role nunca en un componente de cliente); el bundle de `.next/static` no contiene la service key ni `ADMIN_EMAILS`.
- Screenshots desktop **y** mobile de `/`, `/entrar`, `/app`, `/admin`.
- El flujo de WhatsApp del worker sigue andando (usa service role, no lo afecta el revoke): mandar la estafa de prueba y ver la alerta en `/admin` en vivo.

## Reglas
- Las de `CLAUDE.md`: TDD donde haya lógica, `npm run check`, push directo a `main` con `git pull --rebase` antes, nunca leer ni commitear `.env*`.
- Contrato de Supabase: solo agregar. Actualizá la sección "Contrato Supabase" de `CLAUDE.md` con las tablas, la columna y el cambio de RLS (anon ya no lee), y avisale al amigo (dueño de `web/`) que cambió.
- Hay otros chats abiertos en este mismo checkout ("Web Vercel para el jurado", "URL HTTPS pública del worker", "Latencia de alerta del worker", "Preparación entrega hackatón", "Detección de estafas"). Antes de lanzar subagentes, leé con `orca terminal read` qué está tocando cada uno y frená o reasigná lo que choque con este plan (sobre todo "Web Vercel para el jurado": esa web pública es justo lo que cambia).
- Actualizá `PROGRESS.md` ("Próximo paso" y "Qué falta probar") a medida que cierres tareas, y el guion de la demo (`docs/demo/guion.md`) para que muestre landing → login familiar → setup → alerta → login gobierno → grafo.
