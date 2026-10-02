// Writes the sample ticket history to data/backlog.jsonl, one ticket per line with its thread,
// the shape the analytics team asks for when they want "all tickets" without database access.
//
//   node db/export-backlog.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { generateDataset } from "./generate.ts";

const dataset = generateDataset(2000);
const usersById = new Map(dataset.users.map((user) => [user.id, user]));
const orgsById = new Map(dataset.orgs.map((org) => [org.id, org]));

const lines = dataset.tickets.map((ticket) => {
  const org = orgsById.get(ticket.orgId)!;
  const requester = usersById.get(ticket.requesterId)!;
  return JSON.stringify({
    id: ticket.id,
    organization: org.slug,
    number: ticket.number,
    queue: org.queues.find((queue) => queue.id === ticket.queueId)?.slug ?? null,
    subject: ticket.subject,
    body: ticket.body,
    status: ticket.status,
    priority: ticket.priority,
    channel: ticket.channel,
    requester: { name: requester.name, company: requester.company ?? null },
    tags: ticket.tagIds.map((tagId) => org.tags.find((tag) => tag.id === tagId)?.name).filter(Boolean),
    created_at: ticket.createdAt,
    resolved_at: ticket.resolvedAt,
    csat_score: ticket.csatScore,
    messages: ticket.messages.map((message) => ({ author_type: message.authorType, body: message.body, created_at: message.createdAt })),
  });
});

mkdirSync("data", { recursive: true });
writeFileSync("data/backlog.jsonl", `${lines.join("\n")}\n`);
console.log(`wrote ${lines.length} tickets to data/backlog.jsonl`);
