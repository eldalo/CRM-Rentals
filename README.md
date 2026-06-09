# Arriendos — cobro de arriendos de apartamentos

Monorepo para registrar pagos de arriendo, ver el estado mensual por apartamento
y recibir alertas de morosos por Telegram.

- **api/** — NestJS (API) → Render (free).
- **webapp/** — Next.js App Router + Tailwind → Vercel (free).
- **supabase/** — migraciones SQL + función `morosos_del_dia` + seed.

> **Estado:** Fase 1 (DB + dashboard + registro manual + cron de alertas) **+**
> Fase 2 (subida de comprobante + OCR que pre-llena el form). Completas.

---

## 1. Arquitectura y reglas

### Fechas de corte (regla central)
- `fecha_corte(periodo)` = día `dia_corte` del mes del periodo. Si el mes no tiene ese
  día (corte 31 en febrero) → **último día del mes**.
- `fecha_limite` = `fecha_corte` + 5 días calendario.
- **Alerta a Diego** (`moroso_diego`): el día `fecha_limite − 1` si NO hay pago `confirmado`.
- **Alerta a la admin** (`moroso_admin`): el día `fecha_limite` si NO hay pago `confirmado`.

La lógica vive en **`api/src/fechas/fechas.service.ts`** (fuente de verdad, con tests
Jest). La función SQL `morosos_del_dia` es un espejo para consultas manuales.

### Flujo
1. Inquilino paga y manda comprobante por WhatsApp (fuera del sistema).
2. Diego registra el pago en el frontend → backend `POST /pagos` → aviso a Telegram.
3. Un cron externo pega 1×/día en `POST /jobs/daily-check`:
   - calcula morosos del día y avisa a Diego (corte+4) y a la admin (corte+5);
   - mantiene vivos el backend (Render) y la DB (Supabase).

---

## 2. Supabase (DB + Storage)

1. Crear proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutar en orden:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_funcs.sql`
   - (opcional) `supabase/seed.sql` — 3 aptos de ejemplo con cortes 15/30/31.
3. **Storage** → crear bucket `comprobantes` (**privado**). Guarda las imágenes
   de comprobantes; el backend genera una URL firmada (1 año) al subir.
4. **Settings → API**: copiar `Project URL` y la `service_role key` (para el backend).

---

## 3. Variables de entorno

Cada paquete trae su `env.example`. Copiarlo a `.env` (backend) y `.env.local` (frontend).

| Variable | Dónde | Qué es |
|---|---|---|
| `SUPABASE_URL` | backend | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | clave service_role (**secreta**) |
| `SUPABASE_STORAGE_BUCKET` | backend | `comprobantes` |
| `TELEGRAM_BOT_TOKEN` | backend | token del bot (BotFather) |
| `TELEGRAM_CHAT_ID_DIEGO` | backend | chat_id de Diego |
| `TELEGRAM_CHAT_ID_ADMIN` | backend | chat_id de la administradora |
| `TELEGRAM_WEBHOOK_SECRET` | backend | secreto del webhook de Telegram |
| `DAILY_CHECK_SECRET` | backend + frontend | secreto del cron diario |
| `API_KEY` | backend + frontend | API key compartida; el frontend la envía server-side en `X-Api-Key` |
| `APP_TIMEZONE` | backend | `America/Bogota` |
| `FRONTEND_URL` | backend | origen permitido por CORS |
| `ADMIN_PASSWORD` | frontend | password del panel |
| `SESSION_SECRET` | frontend | valor de la cookie de sesión |
| `BACKEND_URL` | frontend | URL del backend para los proxies server-side (`api/backend`, `api/cron`) |
| `OCR_PROVIDER` | backend | `gemini` (free) o `openai` |
| `OCR_API_KEY` | backend | API key del proveedor de OCR |
| `OCR_MODEL` | backend | opcional; default `gemini-2.0-flash` |

---

## 4. Desarrollo local

Requisitos: Node 20+, pnpm 9 (`npm i -g pnpm`).

```bash
cd arriendos
pnpm install

# Backend (http://localhost:3001)
cp api/env.example api/.env   # y completar valores
pnpm dev:api

# Frontend (http://localhost:3000)
cp webapp/env.example webapp/.env.local
pnpm dev:webapp
```

Tests de la lógica de fechas:

```bash
pnpm test            # corre api/src/fechas/fechas.service.spec.ts
```

---

## 5. Bot de Telegram

1. **Crear el bot**: en Telegram, hablar con [@BotFather](https://t.me/BotFather) →
   `/newbot` → nombre y username. Copiar el **token** → `TELEGRAM_BOT_TOKEN`.
2. **Obtener tu chat_id**:
   - Enviar cualquier mensaje al bot.
   - Abrir `https://api.telegram.org/bot<TOKEN>/getUpdates` en el navegador.
   - Buscar `"chat":{"id":NNN}` → ese `NNN` es tu `chat_id`.
   - Repetir con la administradora (que también debe escribirle al bot primero).
   - Completar `TELEGRAM_CHAT_ID_DIEGO` y `TELEGRAM_CHAT_ID_ADMIN`.
3. **Registrar el webhook** (para los botones confirmar/rechazar):

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://<TU-BACKEND>.onrender.com/webhooks/telegram" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```

   Telegram enviará ese secreto en el header `X-Telegram-Bot-Api-Secret-Token`,
   que el backend valida.

---

## 5b. OCR de comprobantes (Fase 2)

El form de "Registrar pago" permite tomar foto / subir el comprobante. El backend
lo sube a Supabase Storage y corre OCR para pre-llenar **monto, fecha y referencia**.
El proveedor está detrás de la interface `OcrProvider` (`api/src/ocr/`) y se
elige con `OCR_PROVIDER`.

### Gemini (recomendado, free)
1. Ir a [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key**
   (no pide tarjeta).
2. En el backend: `OCR_PROVIDER=gemini`, `OCR_API_KEY=<la key>` (opcional `OCR_MODEL=gemini-2.0-flash`).

### OpenAI (alterno, de pago)
`OCR_PROVIDER=openai`, `OCR_API_KEY=sk-...` (opcional `OCR_MODEL=gpt-4o-mini`).

> Cambiar de proveedor = cambiar 1–2 variables de entorno. Sin tocar código.

## 6. Deploy backend (Render)

1. Subir el repo a GitHub.
2. Render → **New → Blueprint** → seleccionar el repo (usa `render.yaml`).
3. Completar las env vars marcadas `sync: false` en el dashboard de Render.
4. Deploy. La URL queda como `https://arriendos-backend.onrender.com`.
5. Registrar el webhook de Telegram con esa URL (paso 5.3).

> Render free duerme tras 15 min de inactividad. El cron diario lo despierta.

---

## 7. Deploy frontend (Vercel)

1. Vercel → **New Project** → importar el repo → **Root Directory = `webapp`**.
2. Env vars: `ADMIN_PASSWORD`, `SESSION_SECRET`, `BACKEND_URL`, `API_KEY`,
   `DAILY_CHECK_SECRET` (todas server-side; ninguna `NEXT_PUBLIC_`).
3. Deploy.

---

## 8. Cron diario

El job se dispara **desde fuera** (Render free no tiene cron confiable).

> ⚠️ **Cold start:** Render free duerme tras 15 min; cuando el cron llega, el
> backend tarda 30–60 s en despertar. El trigger debe tolerar esa espera.

### Opción A — cron-job.org (**recomendado**)
Timeout configurable + reintentos, ideal para el cold start de Render.
Crear un job diario que haga:

```
POST https://<TU-BACKEND>.onrender.com/jobs/daily-check
Header: X-Daily-Check-Secret: <DAILY_CHECK_SECRET>
```

Subir el timeout del job a ~60 s y activar reintentos.

### Opción B — Vercel Cron (incluido, de respaldo)
`webapp/vercel.json` define un cron diario que pega en `/api/cron`, el cual
reenvía a `POST /jobs/daily-check` con el header secreto. La ruta declara
`maxDuration = 60` para aguantar el cold start.

```json
{ "crons": [{ "path": "/api/cron", "schedule": "0 12 * * *" }] }
```

`0 12 * * *` = **12:00 UTC = 7:00 AM en Bogotá**. (Vercel Cron free corre 1×/día.)

> La alerta del día se recupera sola: el job usa umbrales `>=` con idempotencia,
> así que si un día falla, el siguiente run exitoso envía lo pendiente.

> Cualquiera de las dos mantiene vivos el backend y la DB de Supabase
> (que se pausa tras ~7 días inactiva).

### Probar el job con una fecha forzada

```bash
curl -X POST https://<TU-BACKEND>/jobs/daily-check \
  -H "X-Daily-Check-Secret: <DAILY_CHECK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"fecha":"2026-02-04"}'
```

---

## 9. Endpoints (backend)

Todos los endpoints exigen el header `X-Api-Key: $API_KEY`, salvo los marcados
como **público** (validan su propio secreto o no exponen datos). El frontend
no llama al backend directo: pasa por el proxy `app/api/backend`, que inyecta
la key server-side.

| Método | Ruta | Auth | Uso |
|---|---|---|---|
| GET | `/health` | público | healthcheck |
| GET | `/estado?periodo=YYYY-MM` | `X-Api-Key` | estado de todos los aptos (semáforo) |
| GET/POST/PATCH/DELETE | `/apartamentos` | `X-Api-Key` | CRUD apartamentos |
| GET/POST/PATCH/DELETE | `/inquilinos` | `X-Api-Key` | CRUD inquilinos |
| POST | `/pagos` | `X-Api-Key` | registrar pago (+ aviso Telegram) |
| POST | `/pagos/ocr` | `X-Api-Key` | multipart `file`: sube a Storage + OCR → `{comprobante_url, sugerencia}` |
| POST | `/jobs/daily-check` | `X-Daily-Check-Secret` | cron (público para ApiKeyGuard; valida su propio secreto) |
| POST | `/webhooks/telegram` | `X-Telegram-Bot-Api-Secret-Token` | botones confirmar/rechazar (valida su propio secreto) |

---

## 10. Seguridad — notas

- El panel (frontend) está protegido por password compartido (cookie de sesión).
- La `service_role key` de Supabase **solo** vive en el backend.
- Los secretos de cron y webhook viajan en headers y se validan server-side.
- **API key del backend:** un guard global (`ApiKeyGuard`) exige `X-Api-Key == API_KEY`
  en todos los endpoints CRUD/pagos/OCR. Bloquea requests directos (curl/Postman),
  no solo navegadores como hacía CORS. Excepciones (`@Public`): `/health`,
  `/webhooks/telegram` y `/jobs/daily-check`, que validan su propio secreto.
- **La key nunca llega al navegador:** el frontend llama a su proxy server-side
  `app/api/backend/[...path]`, que inyecta `X-Api-Key` desde `API_KEY` (sin
  `NEXT_PUBLIC_`). El proxy queda detrás del gate de sesión del middleware.
- **Siguiente nivel (opcional):** migrar a Supabase Auth + RLS para auth por
  usuario. Ver [Roadmap](#roadmap).

---

## Roadmap

- ✅ **Fase 1** — DB + dashboard + registro manual + cron de alertas Telegram.
- ✅ **Fase 2** — `POST /pagos/ocr` sube la imagen a Storage y corre OCR
  (interface `OcrProvider`, proveedor configurable por `OCR_PROVIDER`),
  pre-llenando monto/fecha/referencia en el form.
- ✅ Hardening de auth del backend — API key compartida (`ApiKeyGuard` global +
  proxy server-side en el frontend). RLS/Supabase Auth queda como mejora futura.
- ⬜ Fallback de notificaciones por email (Resend).
