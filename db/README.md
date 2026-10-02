# Database

- `schema.sql` — the canonical schema, MySQL 8 (production).
- `schema.sqlite.sql` — the same schema for the local SQLite file used in development and CI.
- `generate.ts` — the deterministic sample dataset (three organizations, 2,000 tickets).
- `seed.ts` — creates the schema and loads the dataset: `npm run seed`.
- `export-backlog.ts` — writes the same tickets to `data/backlog.jsonl`.

## Seeded sign-ins

Every seeded user's password is `marrowstone`. Staff addresses follow `first.last@<org>.example.com`;
the first two users of each organization are admins, the rest are agents. Customers sign in to the
portal with their own addresses (listed on the admin page under each organization).

| Organization | Slug | Example admin |
| --- | --- | --- |
| Northgate Freight | northgate | the first `@northgate.example.com` user in `users` |
| Bluefin Payroll | bluefin | the first `@bluefin.example.com` user |
| Larkspur Clinics | larkspur | the first `@larkspur.example.com` user |

`SELECT email FROM users WHERE role = 'admin'` lists them. One API key per organization is seeded
(`msk_<slug>_...`); the secret is derived from the organization id in `seed.ts`.
