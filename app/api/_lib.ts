import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

/** Route handlers accept JSON or an HTML form; a form post is answered with a redirect. */
export async function readBody(request: Request): Promise<{ data: Record<string, string>; isForm: boolean }> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(json)) data[key] = value === null || value === undefined ? "" : String(value);
    return { data, isForm: false };
  }
  const form = await request.formData().catch(() => new FormData());
  const data: Record<string, string> = {};
  form.forEach((value, key) => { data[key] = String(value); });
  return { data, isForm: true };
}

export function answer(request: Request, isForm: boolean, payload: unknown, redirectTo: string, status = 200) {
  if (isForm) return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  return NextResponse.json(payload, { status });
}

export function failure(error: unknown) {
  if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status: 400 });
}
