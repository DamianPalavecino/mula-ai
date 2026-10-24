# Estado del agente: me-estafaron

Lo actualiza el agente después de cada paso (commit + push). Si se corta, el siguiente (Codex) retoma desde acá.

## Hecho
- `/me-estafaron` en `main` y andando de punta a punta en local contra Supabase prod (capturas de `docs/demo/capturas/` → 200 en ~25 s; `juli.martinez.mp` 24 reportes / 5 prov, teléfono 11/6, CVU 7/3; denuncia con párrafo "Antecedentes").
- Archivos: `web/app/me-estafaron/page.tsx`, `web/components/MeEstafaronForm.tsx`, `web/components/MeEstafaronResultado.tsx`, `web/app/api/extraer/route.ts` (OpenRouter, `EXTRACTOR_MODEL` default `anthropic/claude-sonnet-5.5`, rate limit 5/min/IP), `web/app/me-estafaron/registrar/route.ts` (`registrar_reporte` con `fuente: 'victima'`, necesita `SUPABASE_SERVICE_ROLE_KEY`, 3/10 min/IP), `web/lib/meEstafaron.ts` (+ `.test.ts`), `web/lib/extraccion.ts`, `web/lib/supabase-server.ts`.
- Tests: `npm test` en `web/` (node:test, 9 casos), sumado a `npm run check` (feature `web`). Último check verde.
- `.env.example` y `CLAUDE.md` ("Detalles de implementación") actualizados.
- Probar local sin leer secretos: `cd web && node --env-file=../.env --env-file=.env.local node_modules/next/dist/bin/next start -p 3456` (después de `npm run build`), y `curl -X POST localhost:3456/api/extraer -F "imagenes=@../docs/demo/capturas/chat.png;type=image/png" -F "imagenes=@../docs/demo/capturas/comprobante.png;type=image/png" -F provincia="Santa Fe"`.

## En curso (exactamente dónde quedó: archivo, comando, qué faltaba)
- Nada a medio hacer. Todo commiteado y pusheado.

## Próximo paso
- Cuando el humano cargue las variables en Vercel: abrir `<URL Vercel>/me-estafaron`, subir las 2 capturas de demo y verificar que las cuentas salen en rojo. Marcar en `PROGRESS.md`.
- Opcional, con OK del humano: probar "Sumar mi caso a la red" (suma 1 reporte `victima` a `juli.martinez.mp`) y después borrar ese reporte por `reporte_id` (CLI: `/c/Users/dami_/AppData/Local/Programs/Supabase/supabase.exe`, antes `supabase link --project-ref <ref>`).

## Bloqueos / qué necesita del humano
- Vercel: cargar `OPENROUTER_API_KEY` (obligatoria) y, si se quiere el botón "Sumar mi caso a la red", `SUPABASE_SERVICE_ROLE_KEY`. Las dos **sin** `NEXT_PUBLIC_`. Redeployar.
- Link "Me estafaron" en `web/components/Header.tsx` (no es de este agente): agregar `{ href: "/me-estafaron", label: "Me estafaron" }` a `LINKS`.
- Decidir si se prueba "Sumar a la red" contra prod (ensucia el conteo de la demo si no se borra después).
