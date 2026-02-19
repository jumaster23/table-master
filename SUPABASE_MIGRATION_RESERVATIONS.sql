-- Ejecuta este script en Supabase SQL Editor.
-- Objetivo: unificar columnas de reservations a snake_case y evitar errores de schema cache.

begin;

-- 1) Crear columnas canónicas si faltan
alter table if exists public.reservations
  add column if not exists guest_name text,
  add column if not exists party_size integer,
  add column if not exists date date,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists duration_mins integer,
  add column if not exists table_id text,
  add column if not exists status text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

-- 2) Backfill desde variantes camelCase/snake/legacy si existen
-- guest_name
update public.reservations
set guest_name = coalesce(guest_name, "guestName")
where guest_name is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='guestName'
  );

update public.reservations
set guest_name = coalesce(guest_name, guestname)
where guest_name is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='guestname'
  );

-- party_size
update public.reservations
set party_size = coalesce(party_size, "partySize")
where party_size is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='partySize'
  );

-- start_time / end_time
update public.reservations
set start_time = coalesce(start_time, "startTime")
where start_time is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='startTime'
  );

update public.reservations
set end_time = coalesce(end_time, "endTime")
where end_time is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='endTime'
  );

-- duration_mins
update public.reservations
set duration_mins = coalesce(duration_mins, "durationMins")
where duration_mins is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='durationMins'
  );

update public.reservations
set duration_mins = coalesce(duration_mins, duration)
where duration_mins is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='duration'
  );

-- table_id desde tableId/table_ids/tableIds
update public.reservations
set table_id = coalesce(table_id, "tableId")
where table_id is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='tableId'
  );

update public.reservations
set table_id = coalesce(table_id, table_ids[1])
where table_id is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='table_ids'
  );

update public.reservations
set table_id = coalesce(table_id, "tableIds"[1])
where table_id is null
  and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='reservations' and column_name='tableIds'
  );

-- status / notes
update public.reservations
set status = coalesce(status, "status")
where status is null;

update public.reservations
set notes = coalesce(notes, '')
where notes is null;

-- 3) Defaults y saneamiento
alter table if exists public.reservations
  alter column duration_mins set default 90,
  alter column status set default 'CONFIRMED',
  alter column notes set default '';

update public.reservations
set duration_mins = 90
where duration_mins is null or duration_mins <= 0;

update public.reservations
set status = upper(status)
where status is not null;

update public.reservations
set status = 'CONFIRMED'
where status is null or trim(status) = '';

-- 4) Índices útiles
create index if not exists idx_reservations_date on public.reservations(date);
create index if not exists idx_reservations_table_id on public.reservations(table_id);
create index if not exists idx_reservations_start_time on public.reservations(start_time);

commit;

-- Verificación rápida (opcional):
-- select id, guest_name, party_size, date, start_time, end_time, duration_mins, table_id, status
-- from public.reservations
-- order by created_at desc
-- limit 20;
