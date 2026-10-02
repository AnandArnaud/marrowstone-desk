import type { Row } from "@/lib/db";
import type { TicketRow } from "@/lib/tickets";

export const STATUS_COLOR: Record<string, string> = { open: "#1F5F7A", pending: "#8A6D1F", resolved: "#2E7D5B", closed: "#6B7780" };
export const PRIORITY_COLOR: Record<string, string> = { low: "#6B7780", normal: "#1E2A32", high: "#8A6D1F", urgent: "#C2503D" };

export function Pill({ text, color }: { text: string; color: string }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, color, border: `1px solid ${color}`, textTransform: "capitalize" }}>{text}</span>;
}

export function TicketThread({ ticket, messages, replyPath, draft }: { ticket: TicketRow; messages: Row[]; replyPath: string; draft?: string }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: "#6B7780", fontSize: 13 }}>#{ticket.number}</span>
        <Pill text={ticket.status} color={STATUS_COLOR[ticket.status] ?? "#6B7780"} />
        <Pill text={ticket.priority} color={PRIORITY_COLOR[ticket.priority] ?? "#1E2A32"} />
        <span style={{ color: "#6B7780", fontSize: 13 }}>{ticket.queue_name}</span>
      </div>
      <h1 style={{ fontSize: 24, letterSpacing: "-0.02em", margin: "0 0 18px" }}>{ticket.subject}</h1>
      <div style={{ display: "grid", gap: 10 }}>
        {messages.map((message) => (
          <div key={String(message.id)} style={{ background: message.author_type === "system" ? "transparent" : "#fff", border: message.author_type === "system" ? "none" : "1px solid #D9DFE3", borderRadius: 10, padding: message.author_type === "system" ? "4px 14px" : 14 }}>
            <div style={{ fontSize: 12, color: "#6B7780", marginBottom: 6 }}>
              <strong style={{ color: "#1E2A32" }}>{String(message.author_name ?? (message.author_type === "system" ? "System" : "Unknown"))}</strong>
              {" · "}{String(message.author_type)}{" · "}{String(message.created_at)}
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5, color: message.author_type === "system" ? "#6B7780" : "inherit" }}>{String(message.body)}</div>
          </div>
        ))}
      </div>
      <form method="post" action={replyPath} style={{ marginTop: 18, display: "grid", gap: 10 }}>
        <textarea name="body" required rows={draft ? 8 : 4} defaultValue={draft} placeholder="Write a reply" style={{ padding: 12, border: "1px solid #D9DFE3", borderRadius: 8, fontFamily: "inherit", fontSize: 14 }} />
        <div>
          <button type="submit" style={{ background: "#1F5F7A", color: "#fff", border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 600, cursor: "pointer" }}>Send reply</button>
        </div>
      </form>
    </div>
  );
}
