// Creates the schema and loads the sample dataset. SQLite by default (data/marrowstone.db);
// `DB_CLIENT=mysql DATABASE_URL=mysql://...` loads the same data into MySQL.
//
//   npm run seed            # fresh database
//   npm run seed -- --keep  # keep an existing database file (SQLite only)

import { mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { generateDataset } from "./generate.ts";
import { hashPassword } from "../lib/passwords.ts";

const DB_CLIENT = process.env.DB_CLIENT ?? "sqlite";
const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/marrowstone.db";
const keep = process.argv.includes("--keep");

// Every seeded user signs in with the same password (db/README.md).
const PASSWORD = "marrowstone";

async function main() {
  const dataset = generateDataset(2000);
  const started = Date.now();

  if (DB_CLIENT === "mysql") {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection({ uri: DATABASE_URL, multipleStatements: true });
    await connection.query(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
    await load((sql, params) => connection.query(sql, params).then(() => undefined), dataset);
    await connection.end();
  } else {
    const path = DATABASE_URL.replace(/^file:/, "");
    mkdirSync(path.slice(0, path.lastIndexOf("/")) || ".", { recursive: true });
    if (!keep && existsSync(path)) rmSync(path);
    const { createClient } = await import("@libsql/client");
    const client = createClient({ url: DATABASE_URL });
    await client.executeMultiple(readFileSync(new URL("./schema.sqlite.sql", import.meta.url), "utf8"));
    await client.execute("PRAGMA foreign_keys = ON");
    // One transaction for the whole load: thousands of individual commits are what makes SQLite slow.
    const tx = await client.transaction("write");
    await load((sql, params) => tx.execute({ sql, args: params as never[] }).then(() => undefined), dataset);
    await tx.commit();
    client.close();
  }

  console.log(
    `seeded ${dataset.orgs.length} organizations, ${dataset.users.length} users, ${dataset.tickets.length} tickets, ` +
      `${dataset.tickets.reduce((sum, ticket) => sum + ticket.messages.length, 0)} messages, ${dataset.events.length} activity events in ${Date.now() - started} ms`,
  );
}

type Exec = (sql: string, params: unknown[]) => Promise<void>;

async function load(exec: Exec, dataset: ReturnType<typeof generateDataset>) {
  const passwordHash = hashPassword(PASSWORD);
  for (const org of dataset.orgs) {
    await exec("INSERT INTO organizations (id, name, slug, plan, created_at) VALUES (?, ?, ?, ?, ?)", [org.id, org.name, org.slug, org.plan, org.createdAt]);
    for (const queue of org.queues) await exec("INSERT INTO queues (id, org_id, name, slug) VALUES (?, ?, ?, ?)", [queue.id, queue.orgId, queue.name, queue.slug]);
    for (const tag of org.tags) await exec("INSERT INTO tags (id, org_id, name) VALUES (?, ?, ?)", [tag.id, tag.orgId, tag.name]);
  }
  for (const user of dataset.users) {
    await exec("INSERT INTO users (id, org_id, email, name, role, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [user.id, user.orgId, user.email, user.name, user.role, passwordHash, user.createdAt, user.lastLoginAt]);
  }
  for (const org of dataset.orgs) {
    const admin = dataset.users.find((user) => user.orgId === org.id && user.role === "admin")!;
    const secret = `msk_${org.slug}_${createHash("sha256").update(org.id).digest("hex").slice(0, 24)}`;
    await exec("INSERT INTO api_keys (id, org_id, name, prefix, key_hash, created_by, created_at, last_used_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      `key_${org.slug}0001`, org.id, "Internal tools", secret.slice(0, 12), createHash("sha256").update(secret).digest("hex"), admin.id, org.createdAt, null, null,
    ]);
  }
  for (const ticket of dataset.tickets) {
    await exec(
      "INSERT INTO tickets (id, org_id, queue_id, number, subject, body, status, priority, channel, requester_id, assignee_id, created_at, updated_at, first_response_due_at, resolution_due_at, first_responded_at, resolved_at, csat_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [ticket.id, ticket.orgId, ticket.queueId, ticket.number, ticket.subject, ticket.body, ticket.status, ticket.priority, ticket.channel, ticket.requesterId, ticket.assigneeId, ticket.createdAt, ticket.updatedAt, ticket.firstResponseDueAt, ticket.resolutionDueAt, ticket.firstRespondedAt, ticket.resolvedAt, ticket.csatScore],
    );
    for (const message of ticket.messages) {
      await exec("INSERT INTO messages (id, ticket_id, author_id, author_type, body, created_at) VALUES (?, ?, ?, ?, ?, ?)", [message.id, message.ticketId, message.authorId, message.authorType, message.body, message.createdAt]);
    }
    for (const tagId of ticket.tagIds) await exec("INSERT INTO ticket_tags (ticket_id, tag_id) VALUES (?, ?)", [ticket.id, tagId]);
  }
  for (const event of dataset.events) {
    await exec("INSERT INTO activity_events (id, org_id, actor_id, action, target_type, target_id, ip, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [event.id, event.orgId, event.actorId, event.action, event.targetType, event.targetId, event.ip, JSON.stringify(event.metadata), event.createdAt]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
