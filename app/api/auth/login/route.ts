import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  const user = await signIn(email, password, ip);
  const url = new URL(request.url);
  if (!user) return NextResponse.redirect(new URL("/login?error=1", url), 303);
  const target = next.startsWith("/") ? next : user.role === "customer" ? "/portal" : "/app";
  return NextResponse.redirect(new URL(target, url), 303);
}
