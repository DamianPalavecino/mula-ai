-- Mula AI — funciones RPC (contrato en CLAUDE.md)
-- Re-ejecutable. Correr DESPUÉS de schema.sql.
--
-- Contrato:        normalizar, detectar_tipo, resumen_entidad, registrar_reporte, registrar_alerta, grafo
-- Helpers (extra): entidad_canonica, modalidad_label, limpiar_sintetico (solo service_role, la usa el seed)

-- ---------------------------------------------------------------------------
-- detectar_tipo(valor) → 'cbu' | 'cvu' | 'telefono' | 'alias'
-- ---------------------------------------------------------------------------
create or replace function public.detectar_tipo(valor text)
returns text
language plpgsql
immutable
parallel safe
as $$
declare
  s text := trim(detectar_tipo.valor);
  d text;
begin
  if s is null or s = '' then
    return null;
  end if;
  d := regexp_replace(s, '\D', '', 'g');
  if s ~ '^[0-9[:space:].-]+$' and length(d) = 22 then
    return case when d like '000%' then 'cvu' else 'cbu' end;
  end if;
  if s ~ '^\+?[0-9[:space:]()-]+$' and length(d) between 8 and 13 then
    return 'telefono';
  end if;
  return 'alias';
end;
$$;

-- ---------------------------------------------------------------------------
-- normalizar(tipo, valor) → valor normalizado (no valida; ver entidad_canonica)
--   alias:    minúsculas, sin espacios, sin puntuación al principio/final
--   cbu/cvu:  solo dígitos
--   telefono: solo dígitos, sin 00/54, sin 9 de celular, sin 0 ni 15 locales → 10 dígitos
--   tipo null/desconocido → usa detectar_tipo
-- ---------------------------------------------------------------------------
create or replace function public.normalizar(tipo text, valor text)
returns text
language plpgsql
immutable
parallel safe
as $$
declare
  t text := lower(trim(coalesce(normalizar.tipo, '')));
  v text := normalizar.valor;
  d text;
begin
  if v is null then
    return null;
  end if;
  if t not in ('alias', 'cbu', 'cvu', 'telefono') then
    t := public.detectar_tipo(v);
  end if;

  if t = 'alias' then
    v := lower(v);
    v := regexp_replace(v, '[[:space:] ​]+', '', 'g');
    v := regexp_replace(v, '^[[:punct:]]+', '');
    v := regexp_replace(v, '[[:punct:]]+$', '');
    return nullif(v, '');
  end if;

  if t in ('cbu', 'cvu') then
    return nullif(regexp_replace(v, '\D', '', 'g'), '');
  end if;

  -- telefono (acepta también JIDs de WhatsApp: 5493415551234@s.whatsapp.net)
  if position('@' in v) > 0 then
    v := split_part(split_part(v, '@', 1), ':', 1);
  end if;
  d := regexp_replace(v, '\D', '', 'g');
  if d like '00%' then
    d := substr(d, 3);                                  -- prefijo internacional 00
  end if;
  if d like '54%' and length(d) >= 12 then
    d := substr(d, 3);                                  -- código de país
  end if;
  if d like '9%' and length(d) in (11, 13) then
    d := substr(d, 2);                                  -- 9 de celular
  end if;
  if d like '0%' then
    d := substr(d, 2);                                  -- 0 de larga distancia
  end if;
  if length(d) = 12 then                                -- área + 15 + número
    if d like '11%' and substr(d, 3, 2) = '15' then
      d := substr(d, 1, 2) || substr(d, 5);             -- área de 2 (AMBA)
    elsif substr(d, 4, 2) = '15' then
      d := substr(d, 1, 3) || substr(d, 6);             -- área de 3
    elsif substr(d, 5, 2) = '15' then
      d := substr(d, 1, 4) || substr(d, 7);             -- área de 4
    end if;
  end if;
  return nullif(d, '');
end;
$$;

-- ---------------------------------------------------------------------------
-- entidad_canonica(tipo, valor) → (tipo_norm, valor_norm, valida)
--   tipo null/desconocido → detectar_tipo. cbu/cvu se re-deriva por el prefijo 000.
--   valida: alias ^[a-z0-9.-]{6,20}$ · cbu/cvu 22 dígitos · telefono 10 dígitos
-- ---------------------------------------------------------------------------
create or replace function public.entidad_canonica(
  tipo text, valor text,
  out tipo_norm text, out valor_norm text, out valida boolean)
language plpgsql
immutable
parallel safe
as $$
begin
  tipo_norm := lower(trim(coalesce(entidad_canonica.tipo, '')));
  if tipo_norm not in ('alias', 'cbu', 'cvu', 'telefono') then
    tipo_norm := public.detectar_tipo(entidad_canonica.valor);
  end if;
  valor_norm := public.normalizar(tipo_norm, entidad_canonica.valor);
  if tipo_norm in ('cbu', 'cvu') and valor_norm ~ '^\d{22}$' then
    tipo_norm := case when valor_norm like '000%' then 'cvu' else 'cbu' end;
  end if;
  valida := coalesce(case tipo_norm
    when 'alias'    then valor_norm ~ '^[a-z0-9.-]{6,20}$'
    when 'cbu'      then valor_norm ~ '^\d{22}$'
    when 'cvu'      then valor_norm ~ '^\d{22}$'
    when 'telefono' then valor_norm ~ '^\d{10}$'
  end, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- modalidad_label(modalidad) → texto humano (lo usa grafo)
-- ---------------------------------------------------------------------------
create or replace function public.modalidad_label(modalidad text)
returns text
language sql
immutable
parallel safe
as $$
  select case modalidad_label.modalidad
    when 'familiar_numero_nuevo' then 'Familiar número nuevo'
    when 'accidente_o_comisaria' then 'Accidente o comisaría'
    when 'falso_organismo'       then 'Falso organismo'
    when 'premio_o_sorteo'       then 'Premio o sorteo'
    when 'falso_comprador'       then 'Falso comprador'
    when 'falsa_venta'           then 'Falsa venta'
    when 'inversion'             then 'Inversión'
    else 'Otro'
  end
$$;

-- ---------------------------------------------------------------------------
-- resumen_entidad(valor, tipo default null) → jsonb
-- ---------------------------------------------------------------------------
create or replace function public.resumen_entidad(valor text, tipo text default null)
returns jsonb
language plpgsql
stable
as $$
declare
  c   record;
  eid bigint;
  res jsonb;
begin
  select * into c from public.entidad_canonica(resumen_entidad.tipo, resumen_entidad.valor);

  select e.id into eid
  from public.entidades e
  where e.tipo = c.tipo_norm and e.valor_normalizado = c.valor_norm;

  if eid is null then
    return jsonb_build_object(
      'entidad_id', null,
      'tipo', c.tipo_norm,
      'valor_normalizado', c.valor_norm,
      'encontrada', false,
      'reportes', 0,
      'provincias', '[]'::jsonb,
      'modalidades', '[]'::jsonb,
      'ultimo', null,
      'monto_total', 0);
  end if;

  select jsonb_build_object(
    'entidad_id', eid,
    'tipo', c.tipo_norm,
    'valor_normalizado', c.valor_norm,
    'encontrada', true,
    'reportes', count(rp.id),
    'provincias', coalesce(jsonb_agg(distinct rp.provincia order by rp.provincia)
                           filter (where rp.provincia is not null), '[]'::jsonb),
    'modalidades', coalesce(jsonb_agg(distinct rp.modalidad order by rp.modalidad)
                            filter (where rp.modalidad is not null), '[]'::jsonb),
    'ultimo', max(rp.created_at),
    'monto_total', coalesce(sum(rp.monto), 0))
  into res
  from public.reporte_entidad re
  join public.reportes rp on rp.id = re.reporte_id
  where re.entidad_id = eid;

  return res;
end;
$$;

-- ---------------------------------------------------------------------------
-- registrar_reporte(payload) → { reporte_id, entidades: [resumen_entidad...] }   (service_role)
--   Extra opcional en payload: created_at (ISO) para backdatear (lo usa el seed).
--   Entidades: [{tipo, valor}] (tipo opcional) o strings sueltos. Inválidas se ignoran.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_reporte(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p          jsonb := coalesce(registrar_reporte.payload, '{}'::jsonb);
  v_fuente   text  := lower(trim(p->>'fuente'));
  v_mod      text  := lower(trim(coalesce(nullif(p->>'modalidad', ''), 'otro')));
  v_monto    numeric;
  v_riesgo   int;
  v_conf     int;
  v_senales  text[] := '{}';
  v_rem      text;
  v_created  timestamptz := now();
  v_rid      bigint;
  v_eid      bigint;
  ids        bigint[] := '{}';
  ent        jsonb;
  c          record;
  resumenes  jsonb;
begin
  if v_fuente is null or v_fuente not in ('whatsapp', 'victima', 'sintetico') then
    raise exception 'registrar_reporte: fuente inválida (%)', p->>'fuente' using errcode = '22023';
  end if;
  if v_mod not in ('familiar_numero_nuevo', 'accidente_o_comisaria', 'falso_organismo', 'premio_o_sorteo',
                   'falso_comprador', 'falsa_venta', 'inversion', 'otro') then
    v_mod := 'otro';
  end if;

  v_monto := case jsonb_typeof(p->'monto')
    when 'number' then abs((p->>'monto')::numeric)
    when 'string' then nullif(regexp_replace(p->>'monto', '\D', '', 'g'), '')::numeric
  end;
  if (p->>'riesgo') ~ '^\s*-?\d+(\.\d+)?\s*$' then
    v_riesgo := least(100, greatest(0, round((p->>'riesgo')::numeric)))::int;
  end if;
  if (p->>'confianza') ~ '^\s*-?\d+(\.\d+)?\s*$' then
    v_conf := least(100, greatest(0, round((p->>'confianza')::numeric)))::int;
  end if;
  if jsonb_typeof(p->'senales') = 'array' then
    v_senales := array(select jsonb_array_elements_text(p->'senales'));
  end if;
  if nullif(trim(p->>'remitente'), '') is not null then
    v_rem := public.normalizar('telefono', p->>'remitente');
  end if;
  if nullif(p->>'created_at', '') is not null then
    v_created := (p->>'created_at')::timestamptz;
  end if;

  insert into public.reportes
    (fuente, modalidad, provincia, monto, texto, riesgo, confianza, senales, suplanta_a, remitente, created_at)
  values
    (v_fuente, v_mod, nullif(trim(p->>'provincia'), ''), v_monto, p->>'texto', v_riesgo, v_conf,
     v_senales, nullif(trim(p->>'suplanta_a'), ''), v_rem, v_created)
  returning id into v_rid;

  if jsonb_typeof(p->'entidades') = 'array' then
    for ent in select x from jsonb_array_elements(p->'entidades') as t(x) loop
      if jsonb_typeof(ent) = 'object' then
        select * into c from public.entidad_canonica(ent->>'tipo', ent->>'valor');
      elsif jsonb_typeof(ent) = 'string' then
        select * into c from public.entidad_canonica(null, ent #>> '{}');
      else
        continue;
      end if;
      continue when not c.valida;

      insert into public.entidades as e (tipo, valor_normalizado)
      values (c.tipo_norm, c.valor_norm)
      on conflict (tipo, valor_normalizado) do update set tipo = excluded.tipo
      returning e.id into v_eid;

      insert into public.reporte_entidad (reporte_id, entidad_id)
      values (v_rid, v_eid)
      on conflict do nothing;

      if not (v_eid = any(ids)) then
        ids := ids || v_eid;
      end if;
    end loop;
  end if;

  select coalesce(jsonb_agg(public.resumen_entidad(e.valor_normalizado, e.tipo) order by x.ord), '[]'::jsonb)
  into resumenes
  from unnest(ids) with ordinality as x(id, ord)
  join public.entidades e on e.id = x.id;

  return jsonb_build_object('reporte_id', v_rid, 'entidades', resumenes);
end;
$$;

-- ---------------------------------------------------------------------------
-- registrar_alerta(payload) → { alerta_id }   (service_role)
-- ---------------------------------------------------------------------------
create or replace function public.registrar_alerta(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p       jsonb := coalesce(registrar_alerta.payload, '{}'::jsonb);
  v_mod   text  := lower(trim(nullif(p->>'modalidad', '')));
  v_riesgo int;
  v_id    bigint;
begin
  if v_mod is not null and v_mod not in ('familiar_numero_nuevo', 'accidente_o_comisaria', 'falso_organismo',
      'premio_o_sorteo', 'falso_comprador', 'falsa_venta', 'inversion', 'otro') then
    v_mod := 'otro';
  end if;
  if (p->>'riesgo') ~ '^\s*-?\d+(\.\d+)?\s*$' then
    v_riesgo := least(100, greatest(0, round((p->>'riesgo')::numeric)))::int;
  end if;

  insert into public.alertas
    (reporte_id, protegido, riesgo, modalidad, mensaje_persona, mensaje_familia, enviada_a, entidad_ids)
  values (
    nullif(p->>'reporte_id', '')::bigint,
    p->>'protegido',
    v_riesgo,
    v_mod,
    p->>'mensaje_persona',
    p->>'mensaje_familia',
    case when jsonb_typeof(p->'enviada_a') = 'array'
         then array(select jsonb_array_elements_text(p->'enviada_a')) else '{}'::text[] end,
    case when jsonb_typeof(p->'entidad_ids') = 'array'
         then array(select x::bigint from jsonb_array_elements_text(p->'entidad_ids') as t(x)) else '{}'::bigint[] end
  )
  returning id into v_id;

  return jsonb_build_object('alerta_id', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- grafo() → { nodes: [...], links: [...] }
--   Nodos entidad: solo las que tienen ≥1 reporte. Nodos reporte: solo los que tienen ≥1 entidad.
-- ---------------------------------------------------------------------------
create or replace function public.grafo()
returns jsonb
language sql
stable
as $$
  with ent as (
    select e.id, e.tipo, e.valor_normalizado, count(*)::int as n
    from public.entidades e
    join public.reporte_entidad re on re.entidad_id = e.id
    group by e.id
  ),
  rep as (
    select r.id, r.modalidad, r.provincia, r.fuente, r.created_at
    from public.reportes r
    where exists (select 1 from public.reporte_entidad re where re.reporte_id = r.id)
  )
  select jsonb_build_object(
    'nodes',
      coalesce((select jsonb_agg(jsonb_build_object(
                  'id', 'e_' || ent.id,
                  'tipo', ent.tipo,
                  'label', ent.valor_normalizado,
                  'reportes', ent.n) order by ent.id) from ent), '[]'::jsonb)
      ||
      coalesce((select jsonb_agg(jsonb_build_object(
                  'id', 'r_' || rep.id,
                  'tipo', 'reporte',
                  'label', public.modalidad_label(rep.modalidad),
                  'modalidad', rep.modalidad,
                  'provincia', rep.provincia,
                  'fuente', rep.fuente,
                  'created_at', rep.created_at) order by rep.id) from rep), '[]'::jsonb),
    'links',
      coalesce((select jsonb_agg(jsonb_build_object(
                  'source', 'r_' || re.reporte_id,
                  'target', 'e_' || re.entidad_id) order by re.reporte_id, re.entidad_id)
                from public.reporte_entidad re), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- limpiar_sintetico() → borra reportes sintéticos, sus alertas y las entidades que quedan huérfanas
--   (service_role; la usa `npm run seed`)
-- ---------------------------------------------------------------------------
create or replace function public.limpiar_sintetico()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rids  bigint[];
  eids  bigint[];
  n_al  int := 0;
  n_rep int := 0;
  n_ent int := 0;
begin
  select coalesce(array_agg(id), '{}') into rids from public.reportes where fuente = 'sintetico';
  select coalesce(array_agg(distinct entidad_id), '{}') into eids
  from public.reporte_entidad where reporte_id = any(rids);

  delete from public.alertas where reporte_id = any(rids);
  get diagnostics n_al = row_count;
  delete from public.reportes where id = any(rids);           -- reporte_entidad cae en cascada
  get diagnostics n_rep = row_count;
  delete from public.entidades e
  where e.id = any(eids)
    and not exists (select 1 from public.reporte_entidad re where re.entidad_id = e.id);
  get diagnostics n_ent = row_count;

  return jsonb_build_object('reportes', n_rep, 'alertas', n_al, 'entidades', n_ent);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------
revoke execute on function
  public.registrar_reporte(jsonb),
  public.registrar_alerta(jsonb),
  public.limpiar_sintetico()
  from public, anon, authenticated;
grant execute on function
  public.registrar_reporte(jsonb),
  public.registrar_alerta(jsonb),
  public.limpiar_sintetico()
  to service_role;

grant execute on function
  public.normalizar(text, text),
  public.detectar_tipo(text),
  public.entidad_canonica(text, text),
  public.modalidad_label(text),
  public.resumen_entidad(text, text),
  public.grafo()
  to anon, authenticated, service_role;

-- PostgREST: recargar el schema cache para que las RPC nuevas aparezcan ya.
notify pgrst, 'reload schema';
