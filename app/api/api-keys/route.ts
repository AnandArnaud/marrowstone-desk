import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireRole, requireUser } from "@/lib/auth";
import { execute, now, query } from "@/lib/db";
import { newId } from "@/lib/ids";
import { recordActivity } from "@/lib/activity";
import { answer, failure, readBody } from "../_lib";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, "admin");
    const keys = await query("SELECT id, name, prefix, created_at, last_used_at, revoked_at FROM api_keys WHERE org_id = ? ORDER BY created_at DESC", [user.orgId]);
    return NextResponse.json({ keys });
  } catch (error) {
    return failure(error);
  }
}

// The secret is shown once, in the response; only its hash is stored. A form posting with
// ?_method=PATCH revokes instead (HTML forms cannot PATCH or DELETE).
export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get("_method") === "PATCH") return revoke(request);
  try {
    const user = await requireUser(request);
    requireRole(user, "admin");
    const { data, isForm } = await readBody(request);
    const name = data.name?.trim() || "Untitled key";
    const secret = `msk_${randomBytes(18).toString("hex")}`;
    const id = newId("key");
    await execute("INSERT INTO api_keys (id, org_id, name, prefix, key_hash, created_by, created_at, last_used_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)", [id, user.orgId, name, secret.slice(0, 12), createHash("sha256").update(secret).digest("hex"), user.id, now()]);
    await recordActivity({ orgId: user.orgId, actorId: user.id, action: "api_key.created", targetType: "api_key", targetId: id, metadata: { name } });
    return answer(request, isForm, { id, name, secret }, `/app/settings?created=${encodeURIComponent(secret)}`, 201);
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  return revoke(request);
}

export async function PATCH(request: Request) {
  return revoke(request);
}

async function revoke(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, "admin");
    const { data, isForm } = await readBody(request);
    const result = await execute("UPDATE api_keys SET revoked_at = ? WHERE id = ? AND org_id = ? AND revoked_at IS NULL", [now(), data.id, user.orgId]);
    if (result.rowsAffected === 0) throw new Error("key not found");
    await recordActivity({ orgId: user.orgId, actorId: user.id, action: "api_key.revoked", targetType: "api_key", targetId: data.id });
    return answer(request, isForm, { ok: true }, "/app/settings");
  } catch (error) {
    return failure(error);
  }
}
