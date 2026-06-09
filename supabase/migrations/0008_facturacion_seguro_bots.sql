-- ─────────────────────────────────────────────────────────────
-- 0008_facturacion_seguro_bots.sql
--   • pagos.factura_electronica (bool)
--   • apartamentos.asegurado (bool)
--   • Multi-bot: credenciales de Telegram por usuario + admin designado.
--     - telegram_bot_token: token del bot del usuario (SECRETO; write-only en API).
--     - telegram_chat_id: chat al que se envían sus notificaciones.
--     - recibe_todos_pagos: admin designado que recibe TODOS los pagos.
-- ─────────────────────────────────────────────────────────────

alter table pagos        add column if not exists factura_electronica boolean not null default false;
alter table apartamentos add column if not exists asegurado           boolean not null default false;

alter table usuarios add column if not exists telegram_bot_token  text;
alter table usuarios add column if not exists telegram_chat_id    text;
alter table usuarios add column if not exists recibe_todos_pagos  boolean not null default false;
