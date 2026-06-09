-- ─────────────────────────────────────────────────────────────
-- 0001_init.sql — Esquema base: enums, tablas, índices.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- Enums
do $$ begin
  create type estado_pago as enum ('pendiente','confirmado','rechazado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_alerta as enum ('moroso_diego','moroso_admin');
exception when duplicate_object then null; end $$;

-- Apartamentos
create table if not exists apartamentos (
  id uuid primary key default gen_random_uuid(),
  unidad text not null unique,
  canon numeric(12,2) not null,
  dia_corte int not null check (dia_corte between 1 and 31),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Inquilinos
create table if not exists inquilinos (
  id uuid primary key default gen_random_uuid(),
  apartamento_id uuid not null references apartamentos(id) on delete cascade,
  nombre text not null,
  telefono_whatsapp text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_inquilinos_apto on inquilinos(apartamento_id);

-- Pagos (1 por apartamento/periodo)
create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  apartamento_id uuid not null references apartamentos(id) on delete cascade,
  periodo text not null check (periodo ~ '^\d{4}-\d{2}$'),
  fecha_limite date not null,
  monto numeric(12,2),
  comprobante_url text,
  estado estado_pago not null default 'pendiente',
  recibido_en timestamptz not null default now(),
  confirmado_en timestamptz,
  constraint uq_pago_apto_periodo unique (apartamento_id, periodo)
);
create index if not exists idx_pagos_periodo on pagos(periodo);
create index if not exists idx_pagos_estado on pagos(estado);

-- Alertas enviadas (idempotencia: no repetir avisos)
create table if not exists alertas_enviadas (
  id uuid primary key default gen_random_uuid(),
  apartamento_id uuid not null references apartamentos(id) on delete cascade,
  periodo text not null,
  tipo tipo_alerta not null,
  enviada_en timestamptz not null default now(),
  constraint uq_alerta unique (apartamento_id, periodo, tipo)
);
