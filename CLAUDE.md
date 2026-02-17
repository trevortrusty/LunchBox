# Lunchbox — Shift & Task Management SaaS

## Project Overview
Production-ready SaaS for retail shift and task management. Built with Next.js App Router (JS),
PostgreSQL, Prisma 7, iron-session, and Tailwind CSS v4.

## Key Commands

```bash
# Start PostgreSQL (host networking)
docker run --rm --network=host -e POSTGRES_USER=lunchbox -e POSTGRES_PASSWORD=lunchbox_dev \
  -e POSTGRES_DB=lunchbox -d --name lunchbox_postgres_host postgres:16-alpine

# DB migrations
npx prisma migrate dev --name <name>

# Generate Prisma client
npx prisma generate

# Seed database
node prisma/seed.js

# Dev server
npm run dev
```

## Architecture

### Tech Stack
- **Next.js 16** App Router, JS (not TypeScript)
- **Prisma 7** with `@prisma/adapter-pg` (required in v7; url not in schema.prisma)
- **PostgreSQL** via Docker (host networking due to environment constraints)
- **iron-session** v8 for cookie-based auth
- **Tailwind CSS v4** (CSS-first config, no tailwind.config.js)
- **sonner** for toast notifications
- **date-fns** for date formatting

### Prisma 7 Notes (IMPORTANT)
- The datasource `url` is NOT in `prisma/schema.prisma` (Prisma 7 breaking change)
- Migration config is in `prisma.config.ts` (uses `dotenv/config` + `DATABASE_URL`)
- Runtime client uses `@prisma/adapter-pg`: see `lib/db/prisma.js`
- Always run `npx prisma generate` after schema changes

### Next.js 16 Notes
- `proxy.js` at root (NOT `middleware.js`) — Next.js 16 renamed the convention
- Export function named `proxy` (not `middleware`)

### Directory Structure
```
app/
  (auth)/login, register    - Public auth pages
  (dashboard)/              - Protected dashboard with tab nav
    shifts/                 - Shift management
    tasks/                  - Task management
  api/                      - API routes (Next.js App Router)
    auth/login|register|logout|me
    shifts/[id]/rest-periods/[restId]
    tasks/[id]
    associates|departments|roles|shops|reminders
lib/
  db/prisma.js              - Prisma singleton with pg adapter
  auth/session.js           - iron-session config
  auth/password.js          - bcrypt PIN helpers
  business/
    rest-scheduler.js       - Pure fn: generateRestSchedule(start, end)
    rest-state-machine.js   - transitionRestStatus, shouldAutoDue
    role-takeover.js        - executeRoleSwap, executeReturn
    reminder-service.js     - useReminderService hook (polls /api/reminders)
components/
  auth/LoginForm, RegisterForm
  shifts/ShiftTracker, ShiftTable, ShiftRow
  shifts/SendToBreakModal, ReturnFromBreakModal, ChangeRoleModal
  shifts/AssignTaskModal, CreateShiftModal
  tasks/TaskTracker, TaskBoard, TaskCard, CreateTaskModal
  ui/Modal, Button
```

### Data Model
- **Shop** is the multi-tenant isolation boundary (shopId on all records)
- **Shift** has self-relation `ShiftCoverage` via `temporarilyCoveringShiftId` (unique)
- **RestPeriod** links to relief associate via `relievedByAssociateId`
- Key enums: ShiftStatus, RestType, RestStatus, TaskStatus

### Auth Flow
- Sessions stored in encrypted cookie (`lunchbox_session`)
- Session shape: `{ userId, shopId, departmentId, username }`
- Middleware protects `/shifts` and `/tasks` routes
- Dashboard layout checks `/api/auth/me` on mount for client-side validation

### Rest Period Business Logic
- `generateRestSchedule`: pure function, no DB, returns timed rest entries
  - < 4h: no rests
  - 4–5.99h: 1 break at midpoint
  - 6–7.49h: break at +2h, lunch at end-2h (redistribute if gap < 60min)
  - 7.5h+: break +2h, lunch +4h, break end-2h
- `executeRoleSwap`: atomic TX — sends associate to break, optionally assigns relief
- `executeReturn`: atomic TX — returns associate, restores relief's original role
- No relief chains: relief associate cannot itself be covering another shift

### Row Colors (ShiftRow)
- Blue: associate has OUT rest period (on break)
- Amber: has DUE rest period
- Green: all rest periods COMPLETED
- White: default

## Test Credentials (after seed)
- Username: `supervisor`, PIN: `1234`
- Shop: Main Street Market
- 5 associates, 3 active shifts with rest periods, 3 pending tasks

## Environment Variables
```
DATABASE_URL="postgresql://lunchbox:lunchbox_dev@localhost:5432/lunchbox"
SESSION_SECRET="a-very-long-secret-key-at-least-32-characters-long-please-change-this"
NODE_ENV="development"
```
