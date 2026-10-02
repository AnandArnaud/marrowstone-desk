# 0001 — Database

- **Status:** Accepted
- **Date:** 2024-09-16
- **Deciders:** Platform
- **Related:** `db/schema.sql`, `db/schema.sqlite.sql`, `lib/db.ts`

## Context

Marrowstone Desk stores organizations, users, queues, tickets, messages, tags, API keys and the
activity log in one relational database. The application talks to it through `lib/db.ts` with
plain SQL and positional parameters.

- **Production** runs **MySQL 8** on a single RDS primary with one read replica
  (`db/schema.sql` is the canonical schema). Integrations and customer exports depend on MySQL
  wire compatibility, so that stays a hard requirement.
- **Development and CI** run the same SQL against a local **SQLite** file
  (`db/schema.sqlite.sql`) so a checkout works with no services. The SQL is kept to the subset
  both engines share; a column type that differs is declared in both schema files.

## Where it hurts (as of 2026-Q3)

- The primary is at its ceiling at peak (ticket writes plus the activity log plus message search),
  and the next instance size doubles the bill.
- Two failovers this year took the app down for several minutes each.
- `messages` and `activity_events` grow without bound; archiving is manual.
- Reporting queries run against the replica and still slow it down, so they are rationed.

## Decision

Keep plain SQL and the two-schema layout. Anything that changes where the data lives must keep
`lib/db.ts` as the one access path and keep the integrations' MySQL compatibility.

## Consequences

- Schema changes are written twice (MySQL and SQLite) until the layout changes.
- Operational pain above is open; no follow-up decision has been recorded yet.
