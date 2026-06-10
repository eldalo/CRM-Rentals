-- ─────────────────────────────────────────────────────────────
-- seed_usuarios.sql — Usuarios iniciales del sistema de login.
-- Passwords con hash bcrypt (bcryptjs, cost 12). Idempotente: no duplica
-- si ya existe el usuario o el email (comparación case-insensitive).
-- Aplicar DESPUÉS de la migración 0003_auth.sql.
-- ─────────────────────────────────────────────────────────────

insert into usuarios (usuario, email, password, nombre_completo, rol, puesto, estado)
select v.usuario, v.email, v.password, v.nombre, v.rol::rol_usuario, v.puesto::puesto_usuario, true
from (values
  ('diegolondono',     'dlondonom@gmail.com',    '$2b$12$bGevaPie4FHIIrkX4O9k8.bbylU/AnTQ8oG.3jtCgyLPl2Tdn6ZUG', 'Diego Londoño',     'superadmin', 'Administrador'),
  ('tefaruiz',         'tefa.ruiz.94@gmail.com', '$2b$12$jacQ5AgZ53nupMEt6KkzgO.4p8OqQEqJTfvqfF9e22Zon6GlFLP9e', 'Estefanía Ruiz',    'user',       'Asesor'),
  ('estefaniamorales', 'estefawrist@gmail.com',  '$2b$12$ar9SEP8AwPVVKq2b9o/95OMW9gLtAc8o3m8jJI1WRPIDlAcD3QGCK', 'Estefanía Morales', 'admin',      'Administrador')
) as v(usuario, email, password, nombre, rol, puesto)
where not exists (
  select 1 from usuarios u
  where lower(u.usuario) = lower(v.usuario)
     or lower(u.email)   = lower(v.email)
);
