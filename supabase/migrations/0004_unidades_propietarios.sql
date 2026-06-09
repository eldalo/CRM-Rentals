-- ─────────────────────────────────────────────────────────────
-- 0004_unidades_propietarios.sql — Unidades + Propietarios y
-- reestructura de Apartamentos.
--
-- Decisiones (2026-06-09):
--   • Nuevas tablas `unidades` (edificio/conjunto) y `propietarios`.
--   • `apartamentos` pasa a referenciar unidad + propietario:
--       unidad text  → numero text           (etiqueta del apto, p.ej. "2415")
--       activo boolean → estado boolean        (consistencia con las otras tablas)
--       + unidad_id, propietario_id (FK NOT NULL), actualizado_en + trigger.
--   • Unicidad: un apto físico existe UNA vez por unidad → UNIQUE(unidad_id, numero).
--   • Soft delete en las tres tablas: eliminar = estado=false (no se lista).
--   • WIPE & RESEED: los 4 apartamentos previos eran datos de prueba; se truncan
--     (cascade limpia pagos/inquilinos/alertas/usuarios_apartamentos) y se
--     siembra un set coherente demo (reemplazable desde el CRUD).
-- ─────────────────────────────────────────────────────────────

-- ── Unidades ──────────────────────────────────────────────────
create table if not exists unidades (
  id                     uuid primary key default gen_random_uuid(),
  nombre                 text not null,
  direccion              text not null,
  nombre_administrador   text,
  contacto_administrador text,
  estado                 boolean not null default true,  -- false = desactivada (no se borra)
  creado_en              timestamptz not null default now(),
  actualizado_en         timestamptz not null default now()
);

-- Regla de negocio: no repetir nombre+dirección (case-insensitive).
create unique index if not exists idx_unidades_nombre_direccion
  on unidades (lower(nombre), lower(direccion));

drop trigger if exists trg_unidades_actualizado on unidades;
create trigger trg_unidades_actualizado
  before update on unidades
  for each row execute function set_actualizado_en();

-- ── Propietarios ──────────────────────────────────────────────
create table if not exists propietarios (
  id              uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  celular         text,
  email           text,
  estado          boolean not null default true,  -- false = desactivado (no se borra)
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

drop trigger if exists trg_propietarios_actualizado on propietarios;
create trigger trg_propietarios_actualizado
  before update on propietarios
  for each row execute function set_actualizado_en();

-- ── Reestructura de Apartamentos ──────────────────────────────
-- WIPE: vacía apartamentos y, en cascada, todo lo que lo referencia
-- (pagos, inquilinos, alertas_enviadas, usuarios_apartamentos).
truncate table apartamentos cascade;

-- Renombrar columnas existentes a la nueva nomenclatura.
alter table apartamentos rename column unidad to numero;
alter table apartamentos rename column activo to estado;

-- El UNIQUE de una sola columna (heredado de `unidad text unique`) ya no aplica.
alter table apartamentos drop constraint if exists apartamentos_unidad_key;

-- Nuevas columnas. La tabla está vacía: los NOT NULL sin default son seguros.
alter table apartamentos
  add column if not exists unidad_id      uuid not null references unidades(id) on delete restrict,
  add column if not exists propietario_id uuid not null references propietarios(id) on delete restrict,
  add column if not exists actualizado_en timestamptz not null default now();

-- Un apto físico (numero) existe una sola vez dentro de su unidad.
create unique index if not exists idx_apto_unidad_numero on apartamentos (unidad_id, numero);
create index if not exists idx_apto_unidad      on apartamentos (unidad_id);
create index if not exists idx_apto_propietario on apartamentos (propietario_id);

drop trigger if exists trg_apartamentos_actualizado on apartamentos;
create trigger trg_apartamentos_actualizado
  before update on apartamentos
  for each row execute function set_actualizado_en();

-- ── Seed demo coherente (reemplazable desde el CRUD) ──────────
insert into unidades (nombre, direccion, nombre_administrador, contacto_administrador) values
  ('Vivenza', 'Calle 100 # 15-20', 'Carlos Admin',  '3001112233'),
  ('Allegro', 'Carrera 7 # 45-10', 'Marta Admin',   '3004445566')
on conflict do nothing;

insert into propietarios (nombre_completo, celular, email) values
  ('Mike Propietario', '3007778899', 'mike@example.com'),
  ('Ana Propietaria',  '3009990011', 'ana@example.com')
on conflict do nothing;

insert into apartamentos (unidad_id, numero, canon, dia_corte, propietario_id, estado)
select u.id, v.numero, v.canon, v.dia_corte, p.id, true
from (values
  ('Vivenza', 'Mike Propietario', '2415', 1500000::numeric, 15),
  ('Vivenza', 'Ana Propietaria',  '1802', 1800000::numeric, 30),
  ('Allegro', 'Mike Propietario', '707',  2000000::numeric, 5),
  ('Allegro', 'Ana Propietaria',  '512',  1500000::numeric, 28)
) as v(unidad_nombre, prop_nombre, numero, canon, dia_corte)
join unidades u     on u.nombre = v.unidad_nombre
join propietarios p on p.nombre_completo = v.prop_nombre
on conflict do nothing;
