import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listQueues, listTickets } from "@/lib/tickets";
import { Pill, PRIORITY_COLOR, STATUS_COLOR } from "@/components/ticket-thread";

export const dynamic = "force-dynamic";

export default async function Inbox({ searchParams }: { searchParams: Promise<{ status?: string; queue?: string; q?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/app");
  if (user.role === "customer") redirect("/portal");
  const params = await searchParams;
  const [tickets, queues] = await Promise.all([listTickets(user, { status: params.status, queue: params.queue, q: params.q, limit: 100 }), listQueues(user.orgId)]);

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, letterSpacing: "-0.02em", margin: 0 }}>{user.orgName} inbox</h1>
        <span style={{ color: "#6B7780", fontSize: 14 }}>{tickets.length} shown</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 14 }}>
          <Link href="/app/settings" style={{ color: "inherit" }}>Settings</Link>
          <a href="/api/export" style={{ color: "inherit" }}>Export CSV</a>
        </div>
      </div>
      <form method="get" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select name="status" defaultValue={params.status ?? ""} style={selectStyle}>
          <option value="">All statuses</option>
          {["open", "pending", "resolved", "closed"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select name="queue" defaultValue={params.queue ?? ""} style={selectStyle}>
          <option value="">All queues</option>
          {queues.map((queue) => <option key={String(queue.id)} value={String(queue.slug)}>{String(queue.name)}</option>)}
        </select>
        <input name="q" defaultValue={params.q ?? ""} placeholder="Search subject or body" style={{ ...selectStyle, flex: 1 }} />
        <button type="submit" style={{ border: "1px solid #D9DFE3", background: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Filter</button>
      </form>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #D9DFE3", borderRadius: 10, overflow: "hidden" }}>
        <thead>
          <tr style={{ textAlign: "left", fontSize: 12, color: "#6B7780" }}>
            {["#", "Subject", "Status", "Priority", "Queue", "Requester", "Assignee", "Updated"].map((header) => <th key={header} style={{ padding: "10px 12px", borderBottom: "1px solid #D9DFE3", fontWeight: 600 }}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} style={{ fontSize: 14, borderBottom: "1px solid #EEF1F3" }}>
              <td style={cell}>{ticket.number}</td>
              <td style={cell}><Link href={`/app/tickets/${ticket.id}`} style={{ color: "inherit", fontWeight: 600 }}>{ticket.subject}</Link></td>
              <td style={cell}><Pill text={ticket.status} color={STATUS_COLOR[ticket.status] ?? "#6B7780"} /></td>
              <td style={cell}><Pill text={ticket.priority} color={PRIORITY_COLOR[ticket.priority] ?? "#1E2A32"} /></td>
              <td style={cell}>{ticket.queue_name}</td>
              <td style={cell}>{ticket.requester_name}</td>
              <td style={cell}>{ticket.assignee_name ?? <span style={{ color: "#6B7780" }}>unassigned</span>}</td>
              <td style={{ ...cell, color: "#6B7780", fontVariantNumeric: "tabular-nums" }}>{ticket.updated_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const selectStyle: React.CSSProperties = { padding: "8px 10px", border: "1px solid #D9DFE3", borderRadius: 8, background: "#fff", fontSize: 14 };
const cell: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
