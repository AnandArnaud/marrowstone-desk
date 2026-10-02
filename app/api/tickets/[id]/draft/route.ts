import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/lib/auth";
import { assistantConfigured, draftReply } from "@/lib/assistant";
import { getTicket } from "@/lib/tickets";
import { failure } from "../../../_lib";

// Drafts the next reply for the agent; the ticket page posts here and shows the draft in the reply box.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    requireRole(user, "admin", "agent");
    const { id } = await params;
    if (!(await getTicket(user, id))) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
    const isForm = !(request.headers.get("content-type") ?? "").includes("application/json");
    if (!assistantConfigured()) {
      if (isForm) return NextResponse.redirect(new URL(`/app/tickets/${id}?draft_error=unconfigured`, request.url), 303);
      return NextResponse.json({ error: "assistant not configured" }, { status: 503 });
    }
    const draft = await draftReply(id);
    if (isForm) return NextResponse.redirect(new URL(`/app/tickets/${id}?draft=${encodeURIComponent(draft)}`, request.url), 303);
    return NextResponse.json({ draft });
  } catch (error) {
    return failure(error);
  }
}
