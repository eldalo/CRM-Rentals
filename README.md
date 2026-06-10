# Rental Management CRM

Monorepo to manage apartment rentals: register payments, track the monthly
status per apartment, manage units, owners, tenants and users, and send
payment / overdue notifications via Telegram bots.

- **api/** — NestJS REST API (TypeScript).
- **webapp/** — Next.js (App Router) + Tailwind CSS frontend.
- **supabase/** — SQL migrations for the Postgres schema.

---

## Tech stack

| Layer | Stack |
|-------|-------|
| API | NestJS, TypeScript, class-validator, Jest |
| Frontend | Next.js (App Router), React, Tailwind CSS, TanStack Query/Table, Radix UI, Phosphor Icons, Sonner |
| Database | Postgres (SQL migrations) |
| Notifications | Telegram Bot API |

---

## Monorepo layout

```
.
├── api/                 # NestJS API
│   └── src/
│       ├── apartamentos/ unidades/ propietarios/ inquilinos/  # CRUD modules
│       ├── usuarios/ auth/                                     # users + JWT auth
│       ├── pagos/ estado/ jobs/                                # payments, monthly status, daily check
│       ├── telegram/ webhooks/                                 # bot notifications
│       ├── common/                                             # guards, scope, pagination
│       └── config/ fechas/ ocr/                                # config, date logic, OCR
├── webapp/              # Next.js frontend
│   ├── app/             # routes + UI components
│   └── lib/             # API client + React Query hooks
└── supabase/
    └── migrations/      # ordered SQL migrations
```

---

## Domain model

- **Unit** — a building/complex (name, address, administrator contact).
- **Owner** — apartment owner (1 owner → many apartments).
- **Apartment** — belongs to a unit + owner, has a rent amount, cut-off day, an
  *assigned* user (advisor/admin) and an insured flag.
- **Tenant** — person record linked to an apartment.
- **Payment** — one per apartment + period (`YYYY-MM`), with status and an
  electronic-invoice flag.
- **User** — login account with a role: `super_admin`, `admin`, `asesor`
  (advisor). Each user can configure their own notification bot.

### Roles & scope

- **super_admin / admin**: see and manage everything.
- **asesor (advisor)**: only sees/manages the apartments they are responsible
  for (and their tenants/payments). When an advisor creates an apartment they
  are set as the responsible user automatically.

### Cut-off dates (core rule)

- `cut_date(period)` = day `cut_day` of the period's month. If the month has no
  such day (e.g. day 31 in February) → last day of the month.
- `due_date` = `cut_date` + 5 calendar days.
- Overdue alerts fire around the due date for apartments without a confirmed
  payment, and are routed to the responsible advisor's bot.

Date logic lives in `api/src/fechas/fechas.service.ts` (source of truth, covered
by Jest tests).

---

## Notifications (Telegram)

Each user can configure their own bot (token + chat id) from the Users section.

- A registered payment notifies the **responsible advisor's** bot and the
  designated **admin** bot (the user flagged to receive all payments).
- The daily check sends each advisor **their own** overdue list to their bot.
- Bot tokens are **write-only**: stored but never returned by the API.

---

## Local development

Requirements: Node.js 20+ and `pnpm`.

```bash
pnpm install

# run each app (separate terminals)
pnpm dev:api      # API
pnpm dev:webapp   # frontend
```

### Environment variables

Both apps read configuration from environment variables. Copy the provided
example files and fill them with your own values:

```bash
cp api/env.example api/.env
cp webapp/env.example webapp/.env.local
```

See each `env.example` for the full list of variables and what they do.
Never commit real environment files or secrets.

### Database

Apply the SQL migrations in `supabase/migrations/` in order against your
Postgres database.

---

## Scripts

Root:

| Script | Action |
|--------|--------|
| `pnpm dev:api` | API in watch mode |
| `pnpm dev:webapp` | frontend in dev mode |
| `pnpm build` | build API + frontend |
| `pnpm test` | run API tests |

API (`api/`):

| Script | Action |
|--------|--------|
| `pnpm build` | compile (`nest build`) |
| `pnpm start:prod` | run compiled API |
| `pnpm test` | Jest |

---

## API surface (high level)

| Resource | Endpoints |
|----------|-----------|
| `auth` | `POST /auth/login`, `GET /auth/me` |
| `usuarios` | CRUD (admin/super_admin), paginated |
| `unidades` / `propietarios` / `apartamentos` / `inquilinos` | CRUD, paginated, soft-delete |
| `pagos` | register payment, OCR helper |
| `estado` | monthly status per apartment |
| `jobs` | daily overdue check |

Lists are paginated and use soft-delete (records are deactivated, not removed).
Authentication is JWT-based; advisor scope is enforced per request.
