-- ─────────────────────────────────────────────────────────────
-- seed.sql — Datos de ejemplo: 3 aptos con cortes 15, 30 y 31.
-- ─────────────────────────────────────────────────────────────

insert into apartamentos (unidad, canon, dia_corte, activo) values
  ('101', 1500000, 15, true),
  ('202', 1800000, 30, true),
  ('303', 2000000, 31, true)
on conflict (unidad) do nothing;

insert into inquilinos (apartamento_id, nombre, telefono_whatsapp)
select a.id, v.nombre, v.tel
from (values
  ('101', 'Ana Gómez',    '+57 300 1112233'),
  ('202', 'Beto Ramírez', '+57 301 2223344'),
  ('303', 'Carla Díaz',   '+57 302 3334455')
) as v(unidad, nombre, tel)
join apartamentos a on a.unidad = v.unidad
where not exists (
  select 1 from inquilinos i where i.apartamento_id = a.id
);

-- Comprobación rápida de la lógica de fechas (ejecutar manualmente):
--   select unidad, dia_corte,
--          fecha_corte('2026-02', dia_corte) as corte_feb,
--          fecha_corte('2026-02', dia_corte) + 5 as limite_feb
--   from apartamentos order by dia_corte;
--   -> corte=31 en feb 2026 debe dar 2026-02-28 (limite 2026-03-05).
