import { NextResponse } from "next/server";
import { listMembers, requireRole, requireUser } from "@/lib/auth";
import { execute, now, queryOne } from "@/lib/db";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/passwords";
import { recordActivity } from "@/lib/activity";
import { answer, failure, readBody } from "../_lib";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, "admin", "agent");
    return NextResponse.json({ members: await listMembers(user.orgId) });
  } catch (error) {
    return failure(error);
  }
}

// Invite: creates the account with a temporary password the admin passes on. HTML forms cannot
// PATCH, so a form posting with ?_method=PATCH is routed to the role change below.
export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get("_method") === "PATCH") return PATCH(request);
  try {
    const user = await requireUser(request);
    requireRole(user, "admin");
    const { data, isForm } = await readBody(request);
    const email = data.email?.trim().toLowerCase();
    const name = data.name?.trim();
    const role = data.role === "admin" ? "admin" : "agent";
    if (!email || !name) throw new Error("name and email are required");
    if (await queryOne("SELECT id FROM users WHERE email = ?", [email])) throw new Error("a user with that email already exists");
    const id = newId("usr");
    const password = data.password?.trim() || `welcome-${newId("", 6).slice(1)}`;
    await execute("INSERT INTO users (id, org_id, email, name, role, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)", [id, user.orgId, email, name, role, hashPassword(password), now()]);
    await recordActivity({ orgId: user.orgId, actorId: user.id, action: "user.invited", targetType: "user", targetId: id, metadata: { role } });
    return answer(request, isForm, { member: { id, email, name, role }, temporary_password: password }, "/app/settings", 201);
  } catch (error) {
    return failure(error);
  }
}

// Role change or removal.
export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, "admin");
    const { data, isForm } = await readBody(request);
    const target = await queryOne("SELECT id, role FROM users WHERE id = ? AND org_id = ? AND role <> 'customer'", [data.id, user.orgId]);
    if (!target) throw new Error("member not found");
    if (data.remove === "1" || data.remove === "true") {
      await execute("DELETE FROM sessions WHERE user_id = ?", [target.id]);
      await execute("UPDATE users SET role = 'customer' WHERE id = ?", [target.id]);
      await recordActivity({ orgId: user.orgId, actorId: user.id, action: "user.removed", targetType: "user", targetId: String(target.id) });
    } else if (data.role === "admin" || data.role === "agent") {
      await execute("UPDATE users SET role = ? WHERE id = ?", [data.role, target.id]);
      await recordActivity({ orgId: user.orgId, actorId: user.id, action: "user.role_changed", targetType: "user", targetId: String(target.id), metadata: { from: target.role, to: data.role } });
    } else {
      throw new Error("nothing to change");
    }
    return answer(request, isForm, { ok: true }, "/app/settings");
  } catch (error) {
    return failure(error);
  }
}
