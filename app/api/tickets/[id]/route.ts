import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/lib/auth";
import { getTicket, listMessages, updateTicket } from "@/lib/tickets";
import { answer, failure, readBody } from "../../_lib";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const ticket = await getTicket(user, id);
    if (!ticket) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
    return NextResponse.json({ ticket, messages: await listMessages(id) });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return update(request, params);
}

// HTML forms cannot PATCH; the ticket page posts here with the same fields.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return update(request, params);
}

async function update(request: Request, params: Promise<{ id: string }>) {
  try {
    const user = await requireUser(request);
    requireRole(user, "admin", "agent");
    const { id } = await params;
    const { data, isForm } = await readBody(request);
    const ticket = await updateTicket(user, id, {
      status: data.status || undefined,
      priority: data.priority || undefined,
      assigneeId: "assignee_id" in data ? data.assignee_id || null : undefined,
    });
    if (!ticket) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
    return answer(request, isForm, { ticket }, `/app/tickets/${id}`);
  } catch (error) {
    return failure(error);
  }
}
