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
    </main>
  );
}
