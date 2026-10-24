# Estado del agente: me-estafaron

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.

## Hecho
- Feature andando contra Supabase prod (capturas de demo → ~25 s; `juli.martinez.mp` 24/5, teléfono 11/6, CVU 7/3; denuncia con "Antecedentes").
- Otro agente la movió detrás de Clerk: página `web/app/app/me-estafaron/page.tsx` (`requireUser`), API `web/app/app/api/extraer/route.ts` y `web/app/app/api/registrar/route.ts`. `/me-estafaron` redirige a `/app/me-estafaron`.
- Rediseño (commit `4a13236`): `web/components/MeEstafaronForm.tsx` (paso a paso subir → analizando → resultado, drop grande, validación inline, botón "Usar capturas de ejemplo" que carga `web/public/demo/{chat,comprobante}.png`, pone Santa Fe y analiza solo), `web/components/MeEstafaronResultado.tsx` (banner rojo, cuentas en rojo con número grande, Copiar a ancho completo + barra fija en mobile), `web/components/MeEstafaronIconos.tsx` (SVG inline).
- Lógica pura + tests: `web/lib/meEstafaron.ts` / `.test.ts` (`validarArchivo`, `limpiarEntidades`, antecedentes, rate limit). `npm run check web` verde.

- Velocidad (commit `0b2352a`): el LLM solo extrae (esquema chico, `max_tokens` 1500, `sort: latency`, `reasoning: minimal`, timeout 20 s, default `google/gemini-3.5-flash-lite`); denuncia, pedido y pasos salen de `armarTextos()` en `web/lib/meEstafaron.ts` (con tests). Medido desde esta PC con las 2 capturas de demo (mismo request que la ruta, script en el scratchpad): LLM 3,0–4,2 s + red 0,3–0,9 s = 3,2–5,1 s. Lee bien alias, CVU, teléfono y $180.000. La cronología viene vacía y la UI ya la oculta.

## Cómo montar la sección en el dashboard (para el simulador)
- Ya está montada: `components/Panel.tsx` (pestaña `me-estafaron`) usa `<MeEstafaronForm />`; `/app/me-estafaron` redirige a `/app?tab=me-estafaron`. Anda así: el formulario trae su propio scope de colores (`me-panel`).
- Alternativa con título e ícono propios: `<MeEstafaronPanel />` (o `titulo={false}`), y en un drawer `<MeEstafaronPanel onCerrar={…} />`.
- Autocontenido: pasos, validaciones, "Usar capturas de ejemplo" (`/demo/*.png`), resultado, copiar y "Sumar a la red". Llama a `/app/api/extraer` y `/app/api/registrar`.
- Estilos: `components/MeEstafaronPanel.css` (clases `me-*`, keyframes `me-k-*`), importado por `components/MeEstafaronClases.ts`. **No usar CSS modules en web/**: la regla de turbopack de `next.config.ts` pasa todo `*.css` por Tailwind y los módulos pierden el hash (la clase queda `undefined`). Variables `--me-*` → tokens de `globals.css` (`tinta`, `texto`, `suave`, `linea`, `panel`, `papel`, `alerta*`, `seguro*`, `bosque*`, `lima`).
- La barra fija de copiar del resultado usa `sticky bottom-0`; en un contenedor con scroll propio, darle `overscroll-behavior: contain`.

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- Nada a medio hacer. Pulido según better-ui/Emil pusheado (`4ba0b1e`) y probado a 375 px con capturas (Chrome headless en Windows tiene 500 px de ancho mínimo: para simular el celu meter el contenido en un contenedor de 375 px).

## Próximo paso
- Mirarlo en el navegador a 375 px logueado (Clerk) en `/app/me-estafaron`: tocar "Usar capturas de ejemplo" y revisar el resultado. No lo pude ver: requiere sesión de Clerk.
- Cuando el simulador termine el rediseño de la paleta (`web/app/globals.css`), hacer pull y ajustar colores si hace falta (uso solo los tokens `tinta`, `texto`, `suave`, `linea`, `panel`, `fondo`, `alerta*` y un verde `#15803d` para "Copiado").

## Bloqueos / qué necesita del humano
- Medir en prod logueado: `/app/me-estafaron` → "Usar capturas de ejemplo", cronometrar hasta el resultado (objetivo ≤ 6 s). No lo pude hacer: `/app` pide sesión de Clerk.
- Revisar en Vercel si `EXTRACTOR_MODEL` está cargada: si está, pisa el default nuevo (flash-lite). Borrarla o ponerla en `google/gemini-3.5-flash-lite` y redeployar.
- Probar `/app/me-estafaron` logueado en el celu (375 px) y avisar qué no le gusta.
- Decidir si se prueba "Sumar a la red" contra prod (suma 1 reporte a `juli.martinez.mp`).
