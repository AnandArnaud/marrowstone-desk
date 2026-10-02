# marrowstone-desk

Marrowstone Desk is a small help desk for B2B teams: organizations with admins and agents, queues,
tickets with SLA timers and threads, a customer portal, API keys and a help center. A marketing site
(home, pricing, customers) lives in the same app.

**Stack:** Next.js 15 (App Router, TypeScript). Plain SQL through `lib/db.ts`: a local SQLite file
in development, MySQL 8 in production (`docs/adr/0001-database.md`).

It is realistic but intentionally small. There is no product analytics; the only model calls are the
nightly summarizer (`jobs/summarize.ts`) and the assistant (`lib/assistant.ts`: the visitor Q&A at `/ask`
and the reply drafter in the inbox), both gpt-4o through the OpenAI SDK; outbound email goes to a relay
URL or, in development, to `data/outbox.jsonl`; the activity log is written but has no screen.

## Layout

- `app/` pages: marketing (`/`, `/pricing`, `/customers`, `/ask`), help center (`/help`, `/help/[slug]`),
  sign-in (`/login`), agent inbox (`/app`, `/app/tickets/[id]`, `/app/settings`), customer portal
  (`/portal`, `/portal/new`, `/portal/tickets/[id]`)
- `app/api/` routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET|POST /api/tickets`,
  `GET|PATCH /api/tickets/[id]`, `POST /api/tickets/[id]/messages`, `GET /api/tickets/[id]/status`,
  `POST /api/tickets/[id]/draft`, `POST /api/tickets/[id]/rating`, `POST /api/assistant`,
  `GET|POST|PATCH /api/members`, `GET|POST|PATCH /api/api-keys`, `GET /api/export` (CSV)
- `lib/` database access, auth and sessions, tickets, activity log, help-center loader, the assistant, outbound mail
- `db/` schemas (MySQL and SQLite), the deterministic sample dataset, the seed and export scripts
- `jobs/` scheduled scripts (`summarize.ts`)
- `data/backlog.jsonl` 2,000 historical tickets with their threads; `data/leads.csv` 500 inbound leads
- `kb/` the 40 help-center articles
- `brand/` brand guidelines, colours and the logo

## Running it

```bash
npm install
npm run seed  # creates data/marrowstone.db
npm run dev   # http://localhost:3000
```

Sign in as any seeded user (`db/README.md`); the password is `marrowstone`.

## API

Create an API key under `/app/settings` as an admin, then:

```bash
curl -H "Authorization: Bearer msk_..." http://localhost:3000/api/tickets?status=open
curl -H "Authorization: Bearer msk_..." -H "content-type: application/json" \
  -d '{"subject":"Invoice question","body":"The March invoice has the wrong total."}' \
  http://localhost:3000/api/tickets
```
