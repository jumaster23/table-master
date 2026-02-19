-- Seed inicial para la app de mesas.
-- Es idempotente: usa upsert para no duplicar registros.

begin;

insert into public.areas (id, name, slug, max_tables, is_vip)
values
  ('area-terraza', 'Terraza', 'terraza', 12, false),
  ('area-patio', 'Patio', 'patio', 12, false),
  ('area-lobby', 'Lobby', 'lobby', 10, false),
  ('area-bar', 'Bar', 'bar', 10, false),
  ('area-vip', 'Salones VIP', 'vip', 8, true)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  max_tables = excluded.max_tables,
  is_vip = excluded.is_vip;

insert into public.tables (id, number, capacity, table_type, is_vip_special, vip_pair_key, is_active, area_id)
values
  ('t-terr-1', 'T1', 4, 'STANDARD', false, null, true, 'area-terraza'),
  ('t-terr-2', 'T2', 4, 'STANDARD', false, null, true, 'area-terraza'),
  ('t-patio-1', 'P1', 2, 'CIRCULAR', false, null, true, 'area-patio'),
  ('t-patio-2', 'P2', 4, 'STANDARD', false, null, true, 'area-patio'),
  ('t-lobby-1', 'L1', 4, 'STANDARD', false, null, true, 'area-lobby'),
  ('t-lobby-2', 'L2', 6, 'STANDARD', false, null, true, 'area-lobby'),
  ('t-bar-1', 'B1', 2, 'CIRCULAR', false, null, true, 'area-bar'),
  ('t-bar-2', 'B2', 2, 'CIRCULAR', false, null, true, 'area-bar'),
  ('t-vip-a', 'Cuadrada A', 3, 'VIP_SQUARE', true, 'VIP_AB', true, 'area-vip'),
  ('t-vip-b', 'Cuadrada B', 3, 'VIP_SQUARE', true, 'VIP_AB', true, 'area-vip')
on conflict (id) do update
set
  number = excluded.number,
  capacity = excluded.capacity,
  table_type = excluded.table_type,
  is_vip_special = excluded.is_vip_special,
  vip_pair_key = excluded.vip_pair_key,
  is_active = excluded.is_active,
  area_id = excluded.area_id;

commit;

-- Verificación rápida:
-- select count(*) as areas from public.areas;
-- select count(*) as tables from public.tables;
