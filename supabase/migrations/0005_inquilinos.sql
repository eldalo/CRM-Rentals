-- ─────────────────────────────────────────────────────────────
-- 0005_inquilinos.sql — Inquilino como registro independiente.
--
-- Decisiones (2026-06-09):
--   • Inquilino deja de estar ligado a un apartamento: se elimina la FK
--     apartamento_id (y su índice). Pasa a ser un registro de personas.
--   • nombre → nombre_completo. telefono_whatsapp → celular (+ más campos).
--   • Referencias personales (2), cédula, email. Soft delete con estado.
--   • CRUD para cualquier usuario autenticado (sin scoping por asesor).
--   • La tabla quedó vacía tras el TRUNCATE CASCADE de 0004 → no hay datos
--     que migrar; los cambios de esquema son seguros.
-- ─────────────────────────────────────────────────────────────

-- Quita la relación con apartamento (la columna lleva consigo la FK y el
-- índice idx_inquilinos_apto) y el campo viejo de teléfono.
alter table inquilinos drop column if exists apartamento_id;
alter table inquilinos drop column if exists telefono_whatsapp;

-- Renombra el nombre al nuevo campo.
alter table inquilinos rename column nombre to nombre_completo;

-- Nuevos campos. La tabla está vacía: el NOT NULL de estado es seguro.
alter table inquilinos
  add column if not exists celular                      text,
  add column if not exists cedula                       text,
  add column if not exists email                        text,
  add column if not exists nombre_referencia_personal   text,
  add column if not exists celular_referencia_personal  text,
  add column if not exists nombre_2_referencia_personal text,
  add column if not exists celular_2_referencia_personal text,
  add column if not exists estado                        boolean not null default true,
  add column if not exists actualizado_en                timestamptz not null default now();

drop trigger if exists trg_inquilinos_actualizado on inquilinos;
create trigger trg_inquilinos_actualizado
  before update on inquilinos
  for each row execute function set_actualizado_en();
