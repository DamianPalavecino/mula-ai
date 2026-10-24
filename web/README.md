# Mula AI — web

Next.js 16 (App Router, TypeScript, Tailwind 4). Lee la red de Supabase con la anon key; nunca escribe.

- `/` — qué es y cómo se configura.
- `/simulador` — dos celulares (estafador y abuela): manda el texto a `POST ${NEXT_PUBLIC_WORKER_URL}/analizar` y muestra la alerta y el aviso al grupo familiar. Sin la variable, o si el worker falla, usa un mock local (`lib/simulador.ts`). Versión compacta en el hero de `/`.
- `/verificar` — "antes de pagar": `resumen_entidad(valor)`. Acepta `?valor=` en la URL.
- `/red` — grafo de `grafo()` + feed de `alertas` en vivo (Realtime, INSERT).

## Correr local

```bash
cd web
npm install
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
npm run dev
```

Con Supabase local, los valores salen de `supabase status -o env` (en la raíz del repo).
También podés ponerlos en un archivo de entorno local de Next (está en `.gitignore`).

## Variables

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (pública). **Nunca** la service role. |
| `NEXT_PUBLIC_WORKER_URL` | URL pública del worker (VPS), sin `/analizar`; tiene que ser HTTPS (la web está en Vercel). Opcional: sin ella el simulador usa el mock. |

Sin variables la web buildea igual y las páginas muestran "Falta configurar Supabase".

## Deploy en Vercel

1. Importar el repo en Vercel.
2. **Root Directory: `web`** (framework Next.js, se detecta solo).
3. Cargar las dos variables de arriba en Settings → Environment Variables.
4. Deploy. Si se cambian las variables, hay que redeployar (son `NEXT_PUBLIC_`, se embeben en el build).

## Código

- `npm test` — tests de `lib/simulador.ts` con `node --test` (sin dependencias). Los corre `npm run check` en la raíz.
- `lib/supabase.ts` — cliente browser (o `null` si faltan variables).
- `lib/tipos.ts` — tipos del contrato (ver `CLAUDE.md` en la raíz) y labels de modalidades.
- `components/VerifyForm.tsx`, `ResumenCard.tsx` — consulta y resultado.
- `components/RedView.tsx` — estado de `/red`; `Graph.tsx` (canvas, import dinámico sin SSR) y `AlertFeed.tsx` (Realtime).
