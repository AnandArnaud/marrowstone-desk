import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getTicket, listMessages } from "@/lib/tickets";
import { TicketThread } from "@/components/ticket-thread";

export const dynamic = "force-dynamic";

export default async function PortalTicket({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/portal/tickets/${id}`);
  const ticket = await getTicket(user, id);
  if (!ticket) notFound();
  const messages = await listMessages(id);
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 24px" }}>
      <Link href="/portal" style={{ fontSize: 13, color: "#6B7780" }}>← Your tickets</Link>
      <div style={{ height: 10 }} />
      <TicketThread ticket={ticket} messages={messages} replyPath={`/api/tickets/${id}/messages`} />
      {ticket.status === "resolved" || ticket.status === "closed" ? (
        <form method="post" action={`/api/tickets/${id}/rating`} style={{ marginTop: 24, background: "#fff", border: "1px solid #D9DFE3", borderRadius: 10, padding: 14, display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
          <span>{ticket.csat_score ? `You rated this ticket ${ticket.csat_score} / 5.` : "How did we do?"}</span>
          {[1, 2, 3, 4, 5].map((score) => (
            <button key={score} type="submit" name="score" value={score} style={{ border: "1px solid #D9DFE3", background: ticket.csat_score === score ? "#1F5F7A" : "#fff", color: ticket.csat_score === score ? "#fff" : "#1E2A32", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>{score}</button>
          ))}
        </form>
      ) : null}
    </main>
  );
}
