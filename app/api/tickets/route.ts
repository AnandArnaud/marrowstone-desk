import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createTicket, listTickets } from "@/lib/tickets";
import { answer, failure, readBody } from "../_lib";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const tickets = await listTickets(user, {
      status: url.searchParams.get("status") ?? undefined,
      queue: url.searchParams.get("queue") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 50),
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { data, isForm } = await readBody(request);
    if (!data.subject?.trim() || !data.body?.trim()) throw new Error("subject and body are required");
    const ticket = await createTicket(user, {
      subject: data.subject.trim(), body: data.body.trim(), priority: data.priority, queueSlug: data.queue,
      channel: request.headers.get("authorization") ? "api" : "portal",
    });
    const home = user.role === "customer" ? "/portal" : "/app";
    return answer(request, isForm, { ticket }, `${home}/tickets/${ticket.id}`, 201);
  } catch (error) {
    return failure(error);
  }
}
