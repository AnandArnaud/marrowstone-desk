import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/lib/auth";
import { rateTicket } from "@/lib/tickets";
import { answer, failure, readBody } from "../../../_lib";

// A customer rates their own resolved ticket, 1 to 5, from the portal or the resolution email.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    requireRole(user, "customer");
    const { id } = await params;
    const { data, isForm } = await readBody(request);
    const score = Number(data.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error("score must be 1 to 5");
    const ticket = await rateTicket(user, id, score);
    if (!ticket) return NextResponse.json({ error: "ticket not found" }, { status: 404 });
    return answer(request, isForm, { ticket }, `/portal/tickets/${id}`);
  } catch (error) {
    return failure(error);
  }
}
