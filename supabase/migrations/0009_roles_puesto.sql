-- ─────────────────────────────────────────────────────────────
-- 0009_roles_puesto.sql — Renombra roles + agrega "puesto".
--
-- Roles (rename 1:1, conserva datos existentes sin backfill):
--   super_admin → superadmin
--   admin       → admin   (sin cambio)
--   asesor      → user
--
-- Nuevo campo usuarios.puesto (enum, ORTOGONAL al rol):
--   Administrador | Asesor | Vendedor (Vendedor aún sin lógica).
--
-- RENAME VALUE corre dentro de transacción (PG12+). Idempotente:
-- cada paso verifica si ya se aplicó.
-- ─────────────────────────────────────────────────────────────

-- 1) Rename de valores del enum de rol.
do $$ begin
  if exists (select 1 from pg_enum e
             join pg_type t on t.oid = e.enumtypid
             where t.typname = 'rol_usuario' and e.enumlabel = 'super_admin') then
    alter type rol_usuario rename value 'super_admin' to 'superadmin';
  end if;
  if exists (select 1 from pg_enum e
             join pg_type t on t.oid = e.enumtypid
             where t.typname = 'rol_usuario' and e.enumlabel = 'asesor') then
    alter type rol_usuario rename value 'asesor' to 'user';
  end if;
end $$;

-- 2) El default de la columna era 'asesor' → ahora 'user' (sigue al rename,
--    pero lo dejamos explícito por claridad).
alter table usuarios alter column rol set default 'user';

-- 3) Enum de puesto.
do $$ begin
  create type puesto_usuario as enum ('Administrador','Asesor','Vendedor');
exception when duplicate_object then null; end $$;

-- 4) Columna puesto: nullable por ahora (semántica pendiente). Backfill explícito.
alter table usuarios add column if not exists puesto puesto_usuario;

update usuarios set puesto = 'Administrador'
  where puesto is null and rol in ('superadmin','admin');
update usuarios set puesto = 'Asesor'
  where puesto is null and rol = 'user';
