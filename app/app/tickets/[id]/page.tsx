import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser, listMembers } from "@/lib/auth";
import { getTicket, listMessages } from "@/lib/tickets";
import { queryOne, type Row } from "@/lib/db";
import { TicketThread } from "@/components/ticket-thread";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ draft?: string; draft_error?: string }> }) {
  const user = await currentUser();
  const { id } = await params;
  const { draft, draft_error } = await searchParams;
  if (!user) redirect(`/login?next=/app/tickets/${id}`);
  if (user.role === "customer") redirect(`/portal/tickets/${id}`);
  const ticket = await getTicket(user, id);
  if (!ticket) notFound();
  const [messages, members, summary] = await Promise.all([
    listMessages(id),
    listMembers(user.orgId),
    queryOne<Row>("SELECT summary, root_cause, category, sentiment, model FROM ticket_summaries WHERE ticket_id = ?", [id]),
  ]);

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 28 }}>
      <div>
        <Link href="/app" style={{ fontSize: 13, color: "#6B7780" }}>← Inbox</Link>
        <div style={{ height: 10 }} />
        <TicketThread ticket={ticket} messages={messages} replyPath={`/api/tickets/${id}/messages`} draft={draft} />
        <form method="post" action={`/api/tickets/${id}/draft`} style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#6B7780" }}>
          <button type="submit" style={{ background: "none", border: "1px solid #D9DFE3", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#1E2A32", fontWeight: 600 }}>Draft a reply with the assistant</button>
          {draft_error ? <span style={{ color: "#C2503D" }}>The assistant is not configured (OPENAI_API_KEY is missing).</span> : <span>Drafts from the thread; edit before sending.</span>}
        </form>
      </div>
      <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <form method="post" action={`/api/tickets/${id}`} style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 10, padding: 14, display: "grid", gap: 10, fontSize: 14 }}>
          <label>Status
            <select name="status" defaultValue={ticket.status} style={fieldStyle}>
              {["open", "pending", "resolved", "closed"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>Priority
            <select name="priority" defaultValue={ticket.priority} style={fieldStyle}>
              {["low", "normal", "high", "urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </label>
          <label>Assignee
            <select name="assignee_id" defaultValue={ticket.assignee_id ?? ""} style={fieldStyle}>
              <option value="">Unassigned</option>
              {members.map((member) => <option key={String(member.id)} value={String(member.id)}>{String(member.name)}</option>)}
            </select>
          </label>
          <button type="submit" style={{ background: "#1F5F7A", color: "#fff", border: 0, borderRadius: 8, padding: "9px 12px", fontWeight: 600, cursor: "pointer" }}>Update</button>
        </form>
        <div style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 10, padding: 14, fontSize: 13, color: "#4A5661", display: "grid", gap: 6 }}>
          <div><strong style={{ color: "#1E2A32" }}>Requester</strong><br />{ticket.requester_name}<br />{ticket.requester_email}</div>
          <div><strong style={{ color: "#1E2A32" }}>Channel</strong> {ticket.channel}</div>
          <div><strong style={{ color: "#1E2A32" }}>Opened</strong> {ticket.created_at}</div>
          <div><strong style={{ color: "#1E2A32" }}>First response due</strong> {ticket.first_response_due_at}{ticket.first_responded_at ? ` (answered ${ticket.first_responded_at})` : ""}</div>
          <div><strong style={{ color: "#1E2A32" }}>Resolution due</strong> {ticket.resolution_due_at}{ticket.resolved_at ? ` (resolved ${ticket.resolved_at})` : ""}</div>
          {ticket.csat_score ? <div><strong style={{ color: "#1E2A32" }}>Rating</strong> {ticket.csat_score} / 5</div> : null}
        </div>
        {summary ? (
          <div style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 10, padding: 14, fontSize: 13, color: "#4A5661" }}>
            <strong style={{ color: "#1E2A32" }}>Summary</strong>
            <p style={{ margin: "6px 0" }}>{String(summary.summary)}</p>
            <div>{String(summary.category)} · {String(summary.sentiment)}{summary.root_cause ? ` · ${String(summary.root_cause)}` : ""}</div>
          </div>
        ) : null}
      </aside>
    </main>
  );
}

const fieldStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: 4, padding: "8px 10px", border: "1px solid #D9DFE3", borderRadius: 8, background: "#fff", fontSize: 14 };
