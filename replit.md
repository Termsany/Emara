# EMARA | عمارة

SaaS web app for managing interior architecture & design projects, built for the Egyptian market. Arabic RTL UI, EGP currency.

## Stack
- **Monorepo**: pnpm workspaces
- **Backend**: Node + Express + Drizzle ORM + PostgreSQL (`artifacts/api-server`)
- **Frontend (internal)**: React + Vite + wouter + shadcn/ui + TanStack Query (`artifacts/emara`)
- **Client portal**: Same React app, separate routes `/portal/*`
- **API contract**: OpenAPI 3 spec at `lib/api-spec`, generates Zod schemas + React Query hooks via Orval into `lib/api-client-react`
- **Auth**: Cookie session (express-session) with bcrypt password hashing

## Roles (7)
admin, sales, designer, draftsman, qs (quantity surveyor), accountant, client

## Demo Login (password: `password123`)
- admin@emara.com
- sales@emara.com
- designer@emara.com
- draftsman@emara.com
- qs@emara.com
- accountant@emara.com
- ahmed.client@example.com (client portal)

## Features
- **Internal**: Dashboard with KPIs, Projects (auto-generated workflow stages), Clients, Quotations (per-sqm pricing), Files library, Approvals queue, Payments tracking, BOQ (Bill of Quantities), User management
- **Client portal** (`/portal`): Project progress visualization, file viewing, quotation review, payment status, comment threads, approve/reject/request-revision actions on stages
- 3 demo projects: Villa التجمع, Apartment الشيخ زايد, Clinic المعادي

## Routes
- `/` Dashboard, `/projects`, `/projects/:id`, `/clients`, `/clients/:id`
- `/quotations`, `/approvals`, `/payments`, `/boq`, `/files`, `/users`, `/settings`
- `/login`, `/portal`, `/portal/projects/:id`

## Commands
- `pnpm --filter @workspace/emara typecheck` — frontend typecheck
- `pnpm --filter @workspace/api-server typecheck` — backend typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/schemas
- `pnpm --filter @workspace/db push` — apply Drizzle schema to DB
- Workflow `artifacts/emara: web` runs the Vite dev server
- Workflow `artifacts/api-server: API Server` runs Express
