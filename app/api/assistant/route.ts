import { NextResponse } from "next/server";
import { answerVisitor, assistantConfigured } from "@/lib/assistant";
import { failure, readBody } from "../_lib";

// The marketing site's assistant. Public, like the pages it answers from.
export async function POST(request: Request) {
  try {
    const { data } = await readBody(request);
    const question = data.question?.trim();
    if (!question) throw new Error("question is required");
    if (!assistantConfigured()) return NextResponse.json({ error: "assistant not configured" }, { status: 503 });
    return NextResponse.json({ question, answer: await answerVisitor(question) });
  } catch (error) {
    return failure(error);
  }
}
