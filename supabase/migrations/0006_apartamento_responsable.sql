-- ─────────────────────────────────────────────────────────────
-- 0006_apartamento_responsable.sql — Responsable (asesor/admin) a
-- cargo de cada apartamento.
--
-- Decisiones (2026-06-09):
--   • Cada apartamento tiene UN responsable (usuario asesor/admin).
--   • responsable_id NOT NULL → backfill de los 4 actuales al asesor
--     tefaruiz (reasignable luego desde el CRUD).
--   • Reemplaza el modelo N:N: se elimina la tabla usuarios_apartamentos
--     (estaba vacía tras el TRUNCATE de 0004) y su pantalla "Asignar".
--   • El scoping de asesores pasa a basarse en apartamentos.responsable_id.
-- ─────────────────────────────────────────────────────────────

alter table apartamentos
  add column if not exists responsable_id uuid references usuarios(id) on delete restrict;

-- Backfill: asignar los apartamentos sin responsable al asesor tefaruiz.
update apartamentos
set responsable_id = (select id from usuarios where lower(usuario) = 'tefaruiz' limit 1)
where responsable_id is null;

alter table apartamentos alter column responsable_id set not null;
create index if not exists idx_apto_responsable on apartamentos(responsable_id);

-- El modelo N:N ya no se usa: el responsable vive en la propia fila del apto.
drop table if exists usuarios_apartamentos;
