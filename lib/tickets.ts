import { execute, now, query, queryOne, type Row } from "./db";
import { newId } from "./ids";
import type { CurrentUser } from "./auth";
import { appUrl, sendMail } from "./mail";

export type TicketRow = {
  id: string; number: number; subject: string; body: string; status: string; priority: string; channel: string;
  queue_name: string; queue_id: string; requester_name: string; requester_email: string; requester_id: string;
  assignee_name: string | null; assignee_id: string | null; created_at: string; updated_at: string;
  first_response_due_at: string; resolution_due_at: string; first_responded_at: string | null; resolved_at: string | null; csat_score: number | null;
};

const SELECT = `SELECT t.id, t.number, t.subject, t.body, t.status, t.priority, t.channel, t.queue_id, q.name AS queue_name,
  t.requester_id, r.name AS requester_name, r.email AS requester_email, t.assignee_id, a.name AS assignee_name,
  t.created_at, t.updated_at, t.first_response_due_at, t.resolution_due_at, t.first_responded_at, t.resolved_at, t.csat_score
  FROM tickets t JOIN queues q ON q.id = t.queue_id JOIN users r ON r.id = t.requester_id LEFT JOIN users a ON a.id = t.assignee_id`;

const SLA_HOURS: Record<string, [number, number]> = { urgent: [1, 8], high: [4, 24], normal: [8, 72], low: [24, 168] };

export async function listTickets(user: CurrentUser, filters: { status?: string; queue?: string; q?: string; limit?: number } = {}): Promise<TicketRow[]> {
  const clauses = ["t.org_id = ?"];
  const params: unknown[] = [user.orgId];
  // Customers only ever see their own tickets; staff see the organization's.
  if (user.role === "customer") { clauses.push("t.requester_id = ?"); params.push(user.id); }
  if (filters.status) { clauses.push("t.status = ?"); params.push(filters.status); }
  if (filters.queue) { clauses.push("q.slug = ?"); params.push(filters.queue); }
  if (filters.q) { clauses.push("(t.subject LIKE ? OR t.body LIKE ?)"); params.push(`%${filters.q}%`, `%${filters.q}%`); }
  params.push(Math.min(Math.max(filters.limit ?? 50, 1), 200));
  return query<TicketRow>(`${SELECT} WHERE ${clauses.join(" AND ")} ORDER BY t.updated_at DESC LIMIT ?`, params);
}

export async function getTicket(user: CurrentUser, id: string): Promise<TicketRow | null> {
  const ticket = await queryOne<TicketRow>(`${SELECT} WHERE t.id = ? AND t.org_id = ?`, [id, user.orgId]);
  if (!ticket) return null;
  if (user.role === "customer" && ticket.requester_id !== user.id) return null;
  return ticket;
}

export async function listMessages(ticketId: string) {
  return query<Row>(
    "SELECT m.id, m.author_type, m.body, m.created_at, u.name AS author_name FROM messages m LEFT JOIN users u ON u.id = m.author_id WHERE m.ticket_id = ? ORDER BY m.created_at",
    [ticketId],
  );
}

export async function listQueues(orgId: string) {
  return query<Row>("SELECT id, name, slug FROM queues WHERE org_id = ? ORDER BY name", [orgId]);
}

export async function createTicket(user: CurrentUser, input: { subject: string; body: string; priority?: string; queueSlug?: string; channel?: string }): Promise<TicketRow> {
  const queue = input.queueSlug
    ? await queryOne<Row>("SELECT id FROM queues WHERE org_id = ? AND slug = ?", [user.orgId, input.queueSlug])
    : await queryOne<Row>("SELECT id FROM queues WHERE org_id = ? ORDER BY name LIMIT 1", [user.orgId]);
  if (!queue) throw new Error("unknown queue");
  const priority = input.priority && SLA_HOURS[input.priority] ? input.priority : "normal";
  const [firstDue, resolveDue] = SLA_HOURS[priority];
  const next = await queryOne<Row>("SELECT COALESCE(MAX(number), 1000) + 1 AS n FROM tickets WHERE org_id = ?", [user.orgId]);
  const id = newId("tk");
  const createdAt = now();
  const due = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString().slice(0, 19).replace("T", " ");
  await execute(
    "INSERT INTO tickets (id, org_id, queue_id, number, subject, body, status, priority, channel, requester_id, assignee_id, created_at, updated_at, first_response_due_at, resolution_due_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, NULL, ?, ?, ?, ?)",
    [id, user.orgId, queue.id, Number(next?.n ?? 1001), input.subject, input.body, priority, input.channel ?? "portal", user.id, createdAt, createdAt, due(firstDue), due(resolveDue)],
  );
  await execute("INSERT INTO messages (id, ticket_id, author_id, author_type, body, created_at) VALUES (?, ?, ?, ?, ?, ?)", [newId("msg"), id, user.id, user.role === "customer" ? "customer" : "agent", input.body, createdAt]);
  return (await getTicket(user, id))!;
}

export async function addMessage(user: CurrentUser, ticketId: string, body: string): Promise<void> {
  const ticket = await getTicket(user, ticketId);
  if (!ticket) throw new Error("ticket not found");
  const createdAt = now();
  await execute("INSERT INTO messages (id, ticket_id, author_id, author_type, body, created_at) VALUES (?, ?, ?, ?, ?, ?)", [newId("msg"), ticketId, user.id, user.role === "customer" ? "customer" : "agent", body, createdAt]);
  const firstResponse = user.role !== "customer" && !ticket.first_responded_at ? createdAt : ticket.first_responded_at;
  const status = user.role === "customer" && ticket.status === "pending" ? "open" : user.role !== "customer" && ticket.status === "open" ? "pending" : ticket.status;
  await execute("UPDATE tickets SET updated_at = ?, first_responded_at = ?, status = ? WHERE id = ?", [createdAt, firstResponse, status, ticketId]);
  if (user.role !== "customer") {
    await sendMail({
      to: ticket.requester_email,
      subject: `Re: ${ticket.subject} (#${ticket.number})`,
      text: `${body}\n\n--\n${user.name}, ${user.orgName}\nReply in the portal: ${appUrl(`/portal/tickets/${ticketId}`)}`,
    });
  }
}

export async function updateTicket(user: CurrentUser, ticketId: string, patch: { status?: string; priority?: string; assigneeId?: string | null }): Promise<TicketRow | null> {
  const ticket = await getTicket(user, ticketId);
  if (!ticket) return null;
  const sets: string[] = ["updated_at = ?"];
  const params: unknown[] = [now()];
  if (patch.status && ["open", "pending", "resolved", "closed"].includes(patch.status)) {
    sets.push("status = ?"); params.push(patch.status);
    if ((patch.status === "resolved" || patch.status === "closed") && !ticket.resolved_at) { sets.push("resolved_at = ?"); params.push(now()); }
    await execute("INSERT INTO messages (id, ticket_id, author_id, author_type, body, created_at) VALUES (?, ?, NULL, 'system', ?, ?)", [newId("msg"), ticketId, `Status changed to ${patch.status} by ${user.name}.`, now()]);
  }
  if (patch.priority && SLA_HOURS[patch.priority]) { sets.push("priority = ?"); params.push(patch.priority); }
  if (patch.assigneeId !== undefined) { sets.push("assignee_id = ?"); params.push(patch.assigneeId); }
  params.push(ticketId);
  await execute(`UPDATE tickets SET ${sets.join(", ")} WHERE id = ?`, params);
  if (patch.status === "resolved" && ticket.status !== "resolved") {
    await sendMail({
      to: ticket.requester_email,
      subject: `Your ticket #${ticket.number} is resolved`,
      text: `Hi ${ticket.requester_name},\n\n${user.name} marked "${ticket.subject}" as resolved. If it is not, reply in the portal and it reopens.\n\nHow did we do? Rate this ticket from 1 to 5: ${appUrl(`/portal/tickets/${ticketId}`)}\n\n${user.orgName} support, on Marrowstone Desk`,
    });
  }
  return getTicket(user, ticketId);
}

export async function rateTicket(user: CurrentUser, ticketId: string, score: number): Promise<TicketRow | null> {
  const ticket = await getTicket(user, ticketId);
  if (!ticket) return null;
  if (ticket.status !== "resolved" && ticket.status !== "closed") throw new Error("only a resolved ticket can be rated");
  await execute("UPDATE tickets SET csat_score = ?, updated_at = ? WHERE id = ?", [score, now(), ticketId]);
  return getTicket(user, ticketId);
}

export async function exportTickets(user: CurrentUser): Promise<string> {
  const rows = await query<TicketRow>(`${SELECT} WHERE t.org_id = ? ORDER BY t.number`, [user.orgId]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["number", "subject", "status", "priority", "queue", "requester", "assignee", "created_at", "resolved_at", "csat_score"];
  const lines = rows.map((row) => [row.number, row.subject, row.status, row.priority, row.queue_name, row.requester_email, row.assignee_name, row.created_at, row.resolved_at, row.csat_score].map(escape).join(","));
  return `${header.join(",")}\n${lines.join("\n")}\n`;
}
