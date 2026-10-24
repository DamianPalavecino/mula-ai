-- Mula AI — schema (contrato en CLAUDE.md)
-- Re-ejecutable: pegar entero en el SQL editor de Supabase. Después correr functions.sql.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.reportes (
  id          bigserial primary key,
  fuente      text not null,
  modalidad   text not null default 'otro',
  provincia   text,
  monto       numeric,
  texto       text,
  riesgo      int,
  confianza   int,
  senales     text[] not null default '{}',
  suplanta_a  text,
  remitente   text,
  created_at  timestamptz not null default now(),
  constraint reportes_fuente_chk    check (fuente in ('whatsapp', 'victima', 'sintetico')),
  constraint reportes_modalidad_chk check (modalidad in (
    'familiar_numero_nuevo', 'accidente_o_comisaria', 'falso_organismo', 'premio_o_sorteo',
    'falso_comprador', 'falsa_venta', 'inversion', 'otro')),
  constraint reportes_riesgo_chk    check (riesgo is null or riesgo between 0 and 100),
  constraint reportes_confianza_chk check (confianza is null or confianza between 0 and 100),
  constraint reportes_monto_chk     check (monto is null or monto >= 0)
);

create table if not exists public.entidades (
  id                bigserial primary key,
  tipo              text not null,
  valor_normalizado text not null,
  created_at        timestamptz not null default now(),
  constraint entidades_tipo_chk check (tipo in ('alias', 'cbu', 'cvu', 'telefono')),
  constraint entidades_tipo_valor_key unique (tipo, valor_normalizado)
);

create table if not exists public.reporte_entidad (
  reporte_id bigint not null references public.reportes (id) on delete cascade,
  entidad_id bigint not null references public.entidades (id) on delete cascade,
  primary key (reporte_id, entidad_id)
);

create table if not exists public.alertas (
  id              bigserial primary key,
  reporte_id      bigint references public.reportes (id) on delete cascade,
  protegido       text,
  riesgo          int,
  modalidad       text,
  mensaje_persona text,
  mensaje_familia text,
  enviada_a       text[] not null default '{}',
  entidad_ids     bigint[] not null default '{}',
  created_at      timestamptz not null default now(),
  constraint alertas_riesgo_chk    check (riesgo is null or riesgo between 0 and 100),
  constraint alertas_modalidad_chk check (modalidad is null or modalidad in (
    'familiar_numero_nuevo', 'accidente_o_comisaria', 'falso_organismo', 'premio_o_sorteo',
    'falso_comprador', 'falsa_venta', 'inversion', 'otro'))
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index if not exists reportes_created_at_idx       on public.reportes (created_at desc);
create index if not exists reportes_fuente_idx           on public.reportes (fuente);
create index if not exists reportes_modalidad_idx        on public.reportes (modalidad);
create index if not exists reporte_entidad_entidad_idx   on public.reporte_entidad (entidad_id);
create index if not exists alertas_created_at_idx        on public.alertas (created_at desc);
create index if not exists alertas_reporte_id_idx        on public.alertas (reporte_id);

-- ---------------------------------------------------------------------------
-- RLS: anon/authenticated solo leen. Escrituras solo service_role (vía RPC).
-- ---------------------------------------------------------------------------

alter table public.reportes        enable row level security;
alter table public.entidades       enable row level security;
alter table public.reporte_entidad enable row level security;
alter table public.alertas         enable row level security;

drop policy if exists reportes_select_publico        on public.reportes;
drop policy if exists entidades_select_publico       on public.entidades;
drop policy if exists reporte_entidad_select_publico on public.reporte_entidad;
drop policy if exists alertas_select_publico         on public.alertas;

create policy reportes_select_publico        on public.reportes        for select to anon, authenticated using (true);
create policy entidades_select_publico       on public.entidades       for select to anon, authenticated using (true);
create policy reporte_entidad_select_publico on public.reporte_entidad for select to anon, authenticated using (true);
create policy alertas_select_publico         on public.alertas         for select to anon, authenticated using (true);

-- Privilegios de tabla (además de RLS): anon/authenticated solo SELECT.
revoke insert, update, delete, truncate, references, trigger
  on public.reportes, public.entidades, public.reporte_entidad, public.alertas
  from anon, authenticated;
grant select
  on public.reportes, public.entidades, public.reporte_entidad, public.alertas
  to anon, authenticated;
grant all
  on public.reportes, public.entidades, public.reporte_entidad, public.alertas
  to service_role;
revoke usage, update on sequence
  public.reportes_id_seq, public.entidades_id_seq, public.alertas_id_seq
  from anon, authenticated;
grant usage, select on sequence
  public.reportes_id_seq, public.entidades_id_seq, public.alertas_id_seq
  to service_role;

-- ---------------------------------------------------------------------------
-- Realtime: la web escucha INSERT en alertas.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alertas'
  ) then
    alter publication supabase_realtime add table public.alertas;
  end if;
end
$$;
