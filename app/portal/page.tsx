import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listTickets } from "@/lib/tickets";
import { Pill, STATUS_COLOR } from "@/components/ticket-thread";

export const dynamic = "force-dynamic";

export default async function Portal() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/portal");
  const tickets = await listTickets(user, { limit: 100 });
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, letterSpacing: "-0.02em", margin: 0 }}>Your tickets with {user.orgName}</h1>
        <Link href="/portal/new" style={{ marginLeft: "auto", background: "#1F5F7A", color: "#fff", padding: "8px 14px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>New ticket</Link>
      </div>
      {tickets.length === 0 ? <p style={{ color: "#6B7780" }}>No tickets yet.</p> : null}
      <div style={{ display: "grid", gap: 10 }}>
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/portal/tickets/${ticket.id}`} style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 10, padding: 14, textDecoration: "none", color: "inherit", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ color: "#6B7780", fontSize: 13 }}>#{ticket.number}</span>
            <strong style={{ flex: 1 }}>{ticket.subject}</strong>
            <Pill text={ticket.status} color={STATUS_COLOR[ticket.status] ?? "#6B7780"} />
            <span style={{ color: "#6B7780", fontSize: 13 }}>{ticket.updated_at}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
