-- Marrowstone Desk — canonical schema (MySQL 8). The SQLite twin is schema.sqlite.sql.

CREATE TABLE organizations (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(64)  NOT NULL UNIQUE,
  plan        VARCHAR(16)  NOT NULL DEFAULT 'team',
  created_at  DATETIME     NOT NULL
);

CREATE TABLE users (
  id             VARCHAR(32)  NOT NULL PRIMARY KEY,
  org_id         VARCHAR(32)  NOT NULL,
  email          VARCHAR(190) NOT NULL UNIQUE,
  name           VARCHAR(120) NOT NULL,
  role           VARCHAR(16)  NOT NULL, -- admin | agent | customer
  password_hash  VARCHAR(255) NOT NULL,
  created_at     DATETIME     NOT NULL,
  last_login_at  DATETIME     NULL,
  CONSTRAINT fk_users_org FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE sessions (
  id          VARCHAR(64)  NOT NULL PRIMARY KEY,
  user_id     VARCHAR(32)  NOT NULL,
  created_at  DATETIME     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE api_keys (
  id            VARCHAR(32)  NOT NULL PRIMARY KEY,
  org_id        VARCHAR(32)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  prefix        VARCHAR(12)  NOT NULL,
  key_hash      VARCHAR(64)  NOT NULL UNIQUE,
  created_by    VARCHAR(32)  NOT NULL,
  created_at    DATETIME     NOT NULL,
  last_used_at  DATETIME     NULL,
  revoked_at    DATETIME     NULL,
  CONSTRAINT fk_api_keys_org FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE queues (
  id      VARCHAR(32) NOT NULL PRIMARY KEY,
  org_id  VARCHAR(32) NOT NULL,
  name    VARCHAR(80) NOT NULL,
  slug    VARCHAR(64) NOT NULL,
  UNIQUE KEY uq_queues_org_slug (org_id, slug),
  CONSTRAINT fk_queues_org FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE tickets (
  id                     VARCHAR(32)  NOT NULL PRIMARY KEY,
  org_id                 VARCHAR(32)  NOT NULL,
  queue_id               VARCHAR(32)  NOT NULL,
  number                 INT          NOT NULL,
  subject                VARCHAR(255) NOT NULL,
  body                   TEXT         NOT NULL,
  status                 VARCHAR(16)  NOT NULL, -- open | pending | resolved | closed
  priority               VARCHAR(16)  NOT NULL, -- low | normal | high | urgent
  channel                VARCHAR(16)  NOT NULL, -- email | portal | api
  requester_id           VARCHAR(32)  NOT NULL,
  assignee_id            VARCHAR(32)  NULL,
  created_at             DATETIME     NOT NULL,
  updated_at             DATETIME     NOT NULL,
  first_response_due_at  DATETIME     NOT NULL,
  resolution_due_at      DATETIME     NOT NULL,
  first_responded_at     DATETIME     NULL,
  resolved_at            DATETIME     NULL,
  csat_score             TINYINT      NULL,
  UNIQUE KEY uq_tickets_org_number (org_id, number),
  KEY ix_tickets_org_status (org_id, status),
  KEY ix_tickets_queue (queue_id),
  KEY ix_tickets_requester (requester_id),
  CONSTRAINT fk_tickets_org FOREIGN KEY (org_id) REFERENCES organizations(id),
  CONSTRAINT fk_tickets_queue FOREIGN KEY (queue_id) REFERENCES queues(id),
  CONSTRAINT fk_tickets_requester FOREIGN KEY (requester_id) REFERENCES users(id)
);

CREATE TABLE messages (
  id           VARCHAR(32) NOT NULL PRIMARY KEY,
  ticket_id    VARCHAR(32) NOT NULL,
  author_id    VARCHAR(32) NULL,
  author_type  VARCHAR(16) NOT NULL, -- agent | customer | system
  body         TEXT        NOT NULL,
  created_at   DATETIME    NOT NULL,
  KEY ix_messages_ticket (ticket_id, created_at),
  CONSTRAINT fk_messages_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE tags (
  id      VARCHAR(32) NOT NULL PRIMARY KEY,
  org_id  VARCHAR(32) NOT NULL,
  name    VARCHAR(64) NOT NULL,
  UNIQUE KEY uq_tags_org_name (org_id, name),
  CONSTRAINT fk_tags_org FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE ticket_tags (
  ticket_id  VARCHAR(32) NOT NULL,
  tag_id     VARCHAR(32) NOT NULL,
  PRIMARY KEY (ticket_id, tag_id),
  CONSTRAINT fk_ticket_tags_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  CONSTRAINT fk_ticket_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE ticket_summaries (
  ticket_id   VARCHAR(32)  NOT NULL PRIMARY KEY,
  summary     TEXT         NOT NULL,
  root_cause  VARCHAR(255) NULL,
  category    VARCHAR(64)  NOT NULL,
  sentiment   VARCHAR(16)  NOT NULL,
  model       VARCHAR(64)  NOT NULL,
  created_at  DATETIME     NOT NULL,
  CONSTRAINT fk_summaries_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- Written on every sensitive action (sign-in, role change, API key, export). Read by nobody yet.
CREATE TABLE activity_events (
  id           VARCHAR(32)  NOT NULL PRIMARY KEY,
  org_id       VARCHAR(32)  NOT NULL,
  actor_id     VARCHAR(32)  NULL,
  action       VARCHAR(64)  NOT NULL,
  target_type  VARCHAR(32)  NOT NULL,
  target_id    VARCHAR(64)  NOT NULL,
  ip           VARCHAR(45)  NULL,
  metadata     JSON         NULL,
  created_at   DATETIME     NOT NULL,
  KEY ix_activity_org_created (org_id, created_at),
  CONSTRAINT fk_activity_org FOREIGN KEY (org_id) REFERENCES organizations(id)
);
