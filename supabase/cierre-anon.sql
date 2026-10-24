-- Mula AI — cierre de anon (idempotente). Aplicar DESPUÉS de auth.sql y SOLO cuando la web
-- nueva (lecturas server-side con service role tras Clerk) esté deployada en Vercel: rompe la
-- web vieja, que lee con la anon key. Lo decide el orquestador.
-- Deja a anon/authenticated sin acceso a nada; service_role (web server-side, worker, seed) sigue.

drop policy if exists reportes_select_publico        on public.reportes;
drop policy if exists entidades_select_publico       on public.entidades;
drop policy if exists reporte_entidad_select_publico on public.reporte_entidad;
drop policy if exists alertas_select_publico         on public.alertas;

revoke all
  on public.reportes, public.entidades, public.reporte_entidad, public.alertas
  from anon, authenticated;
grant all
  on public.reportes, public.entidades, public.reporte_entidad, public.alertas
  to service_role;

revoke all on sequence
  public.reportes_id_seq, public.entidades_id_seq, public.alertas_id_seq
  from anon, authenticated;
grant usage, select on sequence
  public.reportes_id_seq, public.entidades_id_seq, public.alertas_id_seq
  to service_role;

revoke execute on function
  public.grafo(),
  public.resumen_entidad(text, text),
  public.normalizar(text, text),
  public.detectar_tipo(text),
  public.entidad_canonica(text, text),
  public.modalidad_label(text)
  from public, anon, authenticated;
grant execute on function
  public.grafo(),
  public.resumen_entidad(text, text),
  public.normalizar(text, text),
  public.detectar_tipo(text),
  public.entidad_canonica(text, text),
  public.modalidad_label(text)
  to service_role;

-- `alertas` sigue en la publication supabase_realtime (sin select, anon no recibe nada).

notify pgrst, 'reload schema';
