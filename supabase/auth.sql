-- Mula AI — auth (aditivo, idempotente). Se puede aplicar en prod sin romper la web vieja.
-- Auth es Clerk: Supabase NO conoce a los usuarios. `protegidos.owner` es el userId de Clerk
-- (text, ej. `user_2abc…`) y la web, server-side con service role y después de `auth()` de
-- Clerk, siempre filtra por `owner = userId`. Sin policies: anon/authenticated no ven nada.
-- Los revokes de las tablas viejas están en `cierre-anon.sql` (se aplica después).

create table if not exists public.protegidos (
  id                  bigserial primary key,
  owner               text not null,
  nombre              text not null,
  telefono            text,
  contactos_confianza text[] not null default '{}',
  familiares          text[] not null default '{}',
  provincia           text,
  created_at          timestamptz not null default now()
);

create index if not exists protegidos_owner_idx on public.protegidos (owner);

alter table public.protegidos enable row level security;

revoke all on public.protegidos from anon, authenticated;
grant all on public.protegidos to service_role;
revoke all on sequence public.protegidos_id_seq from anon, authenticated;
grant usage, select on sequence public.protegidos_id_seq to service_role;

-- Alertas de "su" protegido (nullable; `alertas.protegido` texto se mantiene).
alter table public.alertas
  add column if not exists protegido_id bigint references public.protegidos(id) on delete set null;

create index if not exists alertas_protegido_id_idx on public.alertas (protegido_id);

notify pgrst, 'reload schema';
