-- Marrowstone Desk — SQLite twin of schema.sql, used for development and CI. Keep the two in step.

CREATE TABLE IF NOT EXISTS organizations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'team',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES organizations(id),
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  last_login_at  TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL REFERENCES organizations(id),
  name          TEXT NOT NULL,
  prefix        TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  created_by    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  last_used_at  TEXT,
  revoked_at    TEXT
);

CREATE TABLE IF NOT EXISTS queues (
  id      TEXT PRIMARY KEY,
  org_id  TEXT NOT NULL REFERENCES organizations(id),
  name    TEXT NOT NULL,
  slug    TEXT NOT NULL,
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS tickets (
  id                     TEXT PRIMARY KEY,
  org_id                 TEXT NOT NULL REFERENCES organizations(id),
  queue_id               TEXT NOT NULL REFERENCES queues(id),
  number                 INTEGER NOT NULL,
  subject                TEXT NOT NULL,
  body                   TEXT NOT NULL,
  status                 TEXT NOT NULL,
  priority               TEXT NOT NULL,
  channel                TEXT NOT NULL,
  requester_id           TEXT NOT NULL REFERENCES users(id),
  assignee_id            TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  first_response_due_at  TEXT NOT NULL,
  resolution_due_at      TEXT NOT NULL,
  first_responded_at     TEXT,
  resolved_at            TEXT,
  csat_score             INTEGER,
  UNIQUE (org_id, number)
);
CREATE INDEX IF NOT EXISTS ix_tickets_org_status ON tickets (org_id, status);
CREATE INDEX IF NOT EXISTS ix_tickets_queue ON tickets (queue_id);
CREATE INDEX IF NOT EXISTS ix_tickets_requester ON tickets (requester_id);

CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY,
  ticket_id    TEXT NOT NULL REFERENCES tickets(id),
  author_id    TEXT,
  author_type  TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_messages_ticket ON messages (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS tags (
  id      TEXT PRIMARY KEY,
  org_id  TEXT NOT NULL REFERENCES organizations(id),
  name    TEXT NOT NULL,
  UNIQUE (org_id, name)
);

CREATE TABLE IF NOT EXISTS ticket_tags (
  ticket_id  TEXT NOT NULL REFERENCES tickets(id),
  tag_id     TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (ticket_id, tag_id)
);

CREATE TABLE IF NOT EXISTS ticket_summaries (
  ticket_id   TEXT PRIMARY KEY REFERENCES tickets(id),
  summary     TEXT NOT NULL,
  root_cause  TEXT,
  category    TEXT NOT NULL,
  sentiment   TEXT NOT NULL,
  model       TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

-- Written on every sensitive action (sign-in, role change, API key, export). Read by nobody yet.
CREATE TABLE IF NOT EXISTS activity_events (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL REFERENCES organizations(id),
  actor_id     TEXT,
  action       TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT NOT NULL,
  ip           TEXT,
  metadata     TEXT,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_activity_org_created ON activity_events (org_id, created_at);
