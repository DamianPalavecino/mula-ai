# supabase/

Contrato en `../CLAUDE.md`. Dos archivos SQL, ambos re-ejecutables:

- `schema.sql` — tablas, checks, índices, RLS (anon solo lee) y `alertas` en la publicación de Realtime.
- `functions.sql` — RPC: `normalizar`, `detectar_tipo`, `resumen_entidad`, `registrar_reporte`, `registrar_alerta`, `grafo` (+ helpers `entidad_canonica`, `modalidad_label`, `limpiar_sintetico`).

## Proyecto real

1. SQL editor → pegar `schema.sql` → Run.
2. SQL editor → pegar `functions.sql` → Run.

Nada más: Realtime ya queda activo para `alertas` (la publicación `supabase_realtime` la agrega `schema.sql`). Si cambiás algo, volvé a correr los dos en ese orden.

## Seed

```bash
npm install          # en la raíz del repo
npm run seed         # usa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (entorno o archivo de entorno de la raíz)
```

Borra solo lo sintético (`fuente = 'sintetico'`, sus alertas y las entidades que quedan huérfanas) y siembra 180 reportes de los últimos 90 días. Termina imprimiendo `resumen_entidad('juli.martinez.mp')` (23 reportes, 5 provincias) y falla si no da.

Contra el local, sin tocar el archivo de entorno:

```bash
eval "$(supabase status -o env | grep -E '^(API_URL|SERVICE_ROLE_KEY)=')"
SUPABASE_URL=$API_URL SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY npm run seed
```

## Local

```bash
supabase start                      # desde la raíz; API en http://127.0.0.1:54321, Studio en :54323
docker exec -i supabase_db_mula-ai psql -U postgres < supabase/schema.sql
docker exec -i supabase_db_mula-ai psql -U postgres < supabase/functions.sql
docker exec -i supabase_db_mula-ai psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests.sql   # normalización (alias, cuit, link…)
supabase status -o env              # API_URL, ANON_KEY, SERVICE_ROLE_KEY
supabase stop                       # cuando termines
```

Llamadas desde supabase-js: `rpc('registrar_reporte', { payload })`, `rpc('resumen_entidad', { valor, tipo })`, `rpc('grafo')`.
