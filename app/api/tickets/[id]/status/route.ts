import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTicket } from "@/lib/tickets";
import { failure } from "../../../_lib";

// The small read the status widget needs: status, priority, last update. API key or session.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const ticket = await getTicket(user, id);
    if (!ticket) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
    return NextResponse.json({
      id: ticket.id, number: ticket.number, status: ticket.status, priority: ticket.priority,
      updated_at: ticket.updated_at, resolved_at: ticket.resolved_at,
    });
  } catch (error) {
    return failure(error);
  }
}
