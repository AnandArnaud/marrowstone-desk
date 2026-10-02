import { requireUser } from "@/lib/auth";
import { addMessage } from "@/lib/tickets";
import { answer, failure, readBody } from "../../../_lib";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const { data, isForm } = await readBody(request);
    if (!data.body?.trim()) throw new Error("body is required");
    await addMessage(user, id, data.body.trim());
    const home = user.role === "customer" ? "/portal" : "/app";
    return answer(request, isForm, { ok: true }, `${home}/tickets/${id}`, 201);
  } catch (error) {
    return failure(error);
  }
}
