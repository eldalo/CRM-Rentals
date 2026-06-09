-- ─────────────────────────────────────────────────────────────
-- 0007_inquilino_apartamento.sql — Relación inquilino → apartamento.
--
-- Decisiones (2026-06-09):
--   • Un inquilino pertenece a UN apartamento (FK apartamento_id NOT NULL).
--   • Sin scope: cualquier usuario autenticado gestiona todos los inquilinos.
--   • La tabla solo tiene tombstones de prueba (estado=false) y 0 activos;
--     se limpian para poder agregar la columna NOT NULL.
-- ─────────────────────────────────────────────────────────────

delete from inquilinos;

alter table inquilinos
  add column if not exists apartamento_id uuid not null references apartamentos(id) on delete restrict;

create index if not exists idx_inquilinos_apto on inquilinos(apartamento_id);
