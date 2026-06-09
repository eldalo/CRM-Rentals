-- ─────────────────────────────────────────────────────────────
-- 0002_funcs.sql — Lógica de fechas de corte y morosos.
--
-- Regla:
--   fecha_corte(periodo) = día 'dia_corte' del mes del periodo.
--     Si el mes no tiene ese día (corte=31 en feb) → último día del mes.
--   fecha_limite = fecha_corte + 5 días calendario.
--   moroso_diego: el día (fecha_limite - 1) si NO hay pago 'confirmado'.
--   moroso_admin: el día (fecha_limite)     si NO hay pago 'confirmado'.
--
-- NOTA: la fuente de verdad de la app es backend/src/fechas/fechas.service.ts
-- (con tests Jest). Estas funciones son el espejo en SQL, entregable pedido
-- y útiles para consultas/inspección manual en la DB.
-- ─────────────────────────────────────────────────────────────

create or replace function fecha_corte(periodo text, dia_corte int)
returns date language sql immutable as $$
  with m as (
    select make_date(split_part(periodo,'-',1)::int,
                     split_part(periodo,'-',2)::int, 1) as d1
  )
  select least(
    (select d1 + (dia_corte - 1) * interval '1 day' from m),
    (select date_trunc('month', d1) + interval '1 month - 1 day' from m)
  )::date;
$$;

-- Devuelve los apartamentos que deben generar alerta en 'fecha'.
-- Considera el periodo del mes de 'fecha' y el del mes anterior, porque
-- un corte alto (29/30/31) + 5 días puede caer en el mes siguiente.
-- Usa umbrales (>=) para tolerar días en que el cron no corrió; la no
-- duplicación la garantiza la tabla alertas_enviadas (no la fecha exacta).
create or replace function morosos_del_dia(fecha date)
returns table(apartamento_id uuid, periodo text, tipo tipo_alerta)
language sql stable as $$
  with cand as (
    select a.id,
           p.periodo,
           (fecha_corte(p.periodo, a.dia_corte) + interval '5 days')::date as lim
    from apartamentos a
    cross join lateral (values
        (to_char(fecha,                       'YYYY-MM')),
        (to_char(fecha - interval '1 month',  'YYYY-MM'))
    ) p(periodo)
    where a.activo
  )
  select c.id, c.periodo, t.tipo
  from cand c
  cross join lateral (values
      ('moroso_diego'::tipo_alerta, c.lim - 1),
      ('moroso_admin'::tipo_alerta, c.lim)
  ) t(tipo, umbral)
  where fecha >= t.umbral
    and not exists (
      select 1 from pagos pg
      where pg.apartamento_id = c.id
        and pg.periodo        = c.periodo
        and pg.estado         = 'confirmado'
    );
$$;
