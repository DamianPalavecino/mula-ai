-- Mula AI — tests de normalización (solo funciones puras, no escribe nada).
-- Local: docker exec -i supabase_db_mula-ai psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests.sql
-- Falla con la primera aserción rota; si pasa todo imprime "tests.sql: ok".
do $$
declare
  c record;
begin
  -- detectar_tipo: lo de siempre
  assert public.detectar_tipo('juli.martinez.mp') = 'alias', 'alias con punto';
  assert public.detectar_tipo('0000003100012345678901') = 'cvu', 'cvu';
  assert public.detectar_tipo('+54 9 341 555-1234') = 'telefono', 'telefono';
  assert public.detectar_tipo('03415551234') = 'telefono', 'telefono 11 dígitos con 0';

  -- cuit: 11 dígitos, prefijo válido y dígito verificador
  assert public.detectar_tipo('20-12345678-6') = 'cuit', 'cuit con guiones';
  assert public.detectar_tipo('20123456786') = 'cuit', 'cuit pegado';
  assert public.detectar_tipo('20123456785') = 'telefono', 'cuit con dv roto no es cuit';
  assert public.normalizar('cuit', '20-12345678-6') = '20123456786', 'normaliza cuit';
  select * into c from public.entidad_canonica('cuit', '20.12345678.6');
  assert c.tipo_norm = 'cuit' and c.valor_norm = '20123456786' and c.valida, 'cuit canónico';
  select * into c from public.entidad_canonica('cuit', '20123456785');
  assert not c.valida, 'cuit con dv roto es inválido';
  select * into c from public.entidad_canonica('cuit', '99123456786');
  assert not c.valida, 'cuit con prefijo raro es inválido';
  select * into c from public.entidad_canonica(null, 'CUIT 27-28033514-8');
  assert c.tipo_norm = 'cuit' and c.valor_norm = '27280335148' and c.valida, 'cuit con texto pegado';

  -- link: host sin esquema ni www; plataformas compartidas conservan el path
  assert public.detectar_tipo('https://www.ANSES-Beneficio.com/cobrar?id=3') = 'link', 'url con esquema';
  assert public.detectar_tipo('www.premios-ya.com.ar') = 'link', 'url con www';
  assert public.detectar_tipo('anses-beneficio.com') = 'link', 'dominio pelado .com';
  assert public.detectar_tipo('inversiones-top.online/registro') = 'link', 'dominio con path';
  assert public.normalizar('link', 'https://www.ANSES-Beneficio.com/cobrar?id=3') = 'anses-beneficio.com', 'link → host';
  assert public.normalizar('link', 'http://anses-beneficio.com:8080/') = 'anses-beneficio.com', 'link sin puerto';
  assert public.normalizar('link', 'bit.ly/AbC12?utm=x') = 'bit.ly/AbC12', 'acortador conserva path';
  assert public.normalizar('link', 'https://link.mercadopago.com.ar/estafa1/') = 'link.mercadopago.com.ar/estafa1', 'link de pago conserva path';
  select * into c from public.entidad_canonica('link', 'https://www.anses-beneficio.com/x');
  assert c.tipo_norm = 'link' and c.valor_norm = 'anses-beneficio.com' and c.valida, 'link canónico';
  select * into c from public.entidad_canonica('link', 'hola');
  assert not c.valida, 'link sin dominio es inválido';
  select * into c from public.entidad_canonica('link', 'https://www.anses.gob.ar/tramites');
  assert not c.valida, 'dominio oficial no entra a la red';
  select * into c from public.entidad_canonica('link', 'https://www.mercadopago.com.ar');
  assert not c.valida, 'plataforma sin path no entra a la red';

  -- wa.me / api.whatsapp.com → teléfono
  select * into c from public.entidad_canonica(null, 'https://wa.me/5493415551234');
  assert c.tipo_norm = 'telefono' and c.valor_norm = '3415551234' and c.valida, 'wa.me → telefono';
  select * into c from public.entidad_canonica('link', 'api.whatsapp.com/send?phone=5491122104471');
  assert c.tipo_norm = 'telefono' and c.valor_norm = '1122104471' and c.valida, 'api.whatsapp → telefono';

  raise notice 'tests.sql: ok';
end;
$$;
