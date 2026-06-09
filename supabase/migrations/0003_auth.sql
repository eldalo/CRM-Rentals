-- ─────────────────────────────────────────────────────────────
-- 0003_auth.sql — Autenticación multi-usuario con roles.
--
-- Reemplaza el password único compartido por usuarios reales.
-- Login por usuario O email (case-insensitive). Los usuarios NO se
-- borran: se desactivan (estado=false).
-- ─────────────────────────────────────────────────────────────

-- Rol del usuario
do $$ begin
  create type rol_usuario as enum ('super_admin','admin','asesor');
exception when duplicate_object then null; end $$;

-- Usuarios que pueden ingresar al sistema
create table if not exists usuarios (
  id              uuid primary key default gen_random_uuid(),
  usuario         text not null,
  email           text not null,
  password        text not null,                  -- hash bcrypt, NUNCA texto plano
  nombre_completo text not null,
  estado          boolean not null default true,  -- false = desactivado (no se borra)
  ultimo_login    timestamptz,
  rol             rol_usuario not null default 'asesor',
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- Unicidad case-insensitive: login por usuario o email sin importar mayúsculas
create unique index if not exists idx_usuarios_usuario_lower on usuarios (lower(usuario));
create unique index if not exists idx_usuarios_email_lower   on usuarios (lower(email));

-- Mantiene actualizado_en en cada UPDATE (no existía convención previa)
create or replace function set_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end; $$;

drop trigger if exists trg_usuarios_actualizado on usuarios;
create trigger trg_usuarios_actualizado
  before update on usuarios
  for each row execute function set_actualizado_en();

-- Tabla intermedia: apartamentos a cargo de un asesor (N:N)
-- apartamentos→inquilinos ya existe (FK inquilinos.apartamento_id en 0001).
create table if not exists usuarios_apartamentos (
  usuario_id     uuid not null references usuarios(id) on delete cascade,
  apartamento_id uuid not null references apartamentos(id) on delete cascade,
  asignado_en    timestamptz not null default now(),
  primary key (usuario_id, apartamento_id)
);
create index if not exists idx_ua_usuario     on usuarios_apartamentos(usuario_id);
create index if not exists idx_ua_apartamento on usuarios_apartamentos(apartamento_id);
