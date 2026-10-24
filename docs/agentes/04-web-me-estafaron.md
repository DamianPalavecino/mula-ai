Sos el agente de **`/me-estafaron`** de Mula AI (hackatón shippe.ar, entrega HOY 16:00, submit 15:45). Leé `CLAUDE.md` (el contrato), `docs/spec.md`, `web/README.md`, `web/AGENTS.md` y `web/lib/`. Es Next.js 16 con App Router: antes de escribir route handlers, leé la guía en `node_modules/next/dist/docs/` si `web/AGENTS.md` lo pide. Para la API de Claude usá la skill `claude-api`.

Esta feature es la **primera que se corta**. Si a las 14:00 no anda de punta a punta, dejá la rama prolija, avisá y pará. No rompas nada de lo que ya existe.

Tocás solo:
- `web/app/me-estafaron/**`
- `web/app/api/extraer/route.ts`
- `web/components/MeEstafaron*.tsx`
- `web/lib/` (archivos nuevos)
- agregar `@anthropic-ai/sdk` a `web/package.json` si hace falta
- **agregar** líneas en `.env.example` y en "Detalles de implementación" de `CLAUDE.md`

`Header.tsx` es de otro agente: pedile al coordinador que sume el link. Nunca leas ni commitees `.env*`.

## Qué hace
Para quien ya transfirió: sube capturas del chat y del comprobante y recibe una denuncia y un pedido de bloqueo listos, vinculados al resto de los casos de la red.

1. **UI** (`/me-estafaron`): drop de hasta 4 imágenes (png/jpg, máximo 4 MB cada una, se redimensionan en el cliente), provincia (select) y un botón "Analizar".
2. **`POST /api/extraer`** (route handler, runtime node). Secretos **server-only**: `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY`, nunca con `NEXT_PUBLIC_`, que la web es pública. Con `claude-sonnet-5-5` y salida estructurada JSON extrae `{ modalidad (de las 8 del contrato), monto, fecha, entidades: [{tipo, valor}], resumen }`.
3. Consulta la red: `resumen_entidad` de cada entidad (con la anon key o la service role).
4. Redacta, en el mismo u otro llamado, la **denuncia** (texto formal para fiscalía o policía: hechos, fecha, monto, cuentas destino, y que la cuenta tiene N reportes en otras provincias) y el **pedido de bloqueo** al banco o billetera (con CBU/CVU/alias y el pedido de congelar fondos).
5. Respuesta: `{ extraccion, entidades: [resumen_entidad], denuncia, pedido_bloqueo }`. La UI los muestra con botones de copiar y descargar `.txt`, y las cuentas con su cantidad de reportes (en rojo si tienen).
6. Botón **"Sumar mi caso a la red"**, que hace `registrar_reporte` con `fuente: 'victima'`, la provincia elegida y las entidades. Solo con confirmación explícita del usuario.
7. Validaciones: tamaño, tipo, rate limit simple. Sin imágenes → 400. Si la key falta → mensaje claro, que no crashee el build.

Probalo con las capturas falsas de `docs/demo/` si el agente de demo ya las dejó. Si no, armá una de prueba. `npm run build` sin errores, commit y push en tu rama, y avisá qué variables tiene que cargar el humano en Vercel. Respondé corto, en español rioplatense.
