import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { execute, now, query, queryOne, type Row } from "./db";
import { verifyPassword } from "./passwords";
import { recordActivity } from "./activity";

export type Role = "admin" | "agent" | "customer";
export type CurrentUser = { id: string; orgId: string; email: string; name: string; role: Role; orgName: string; orgSlug: string };

const SESSION_COOKIE = "ms_session";
const SESSION_HOURS = 24 * 14;

export async function signIn(email: string, password: string, ip: string | null): Promise<CurrentUser | null> {
  const row = await queryOne<Row>(
    "SELECT u.id, u.org_id, u.email, u.name, u.role, u.password_hash, o.name AS org_name, o.slug AS org_slug FROM users u JOIN organizations o ON o.id = u.org_id WHERE u.email = ?",
    [email.trim().toLowerCase()],
  );
  if (!row || !verifyPassword(password, String(row.password_hash))) return null;
  const sessionId = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_HOURS * 3_600_000);
  await execute("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", [sessionId, row.id, now(), expires.toISOString().slice(0, 19).replace("T", " ")]);
  await execute("UPDATE users SET last_login_at = ? WHERE id = ?", [now(), row.id]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: "lax", path: "/", expires });
  const user = toCurrentUser(row);
  await recordActivity({ orgId: user.orgId, actorId: user.id, action: "user.signed_in", targetType: "user", targetId: user.id, ip });
  return user;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (sessionId) await execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const row = await queryOne<Row>(
    "SELECT u.id, u.org_id, u.email, u.name, u.role, o.name AS org_name, o.slug AS org_slug, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id JOIN organizations o ON o.id = u.org_id WHERE s.id = ?",
    [sessionId],
  );
  if (!row) return null;
  if (String(row.expires_at).replace(" ", "T") < new Date().toISOString()) return null;
  return toCurrentUser(row);
}

/** Route handlers: a session cookie, or an API key as `Authorization: Bearer msk_...`. */
export async function requireUser(request?: Request): Promise<CurrentUser> {
  const bearer = request?.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? (await headers()).get("authorization")?.replace(/^Bearer\s+/i, "");
  if (bearer && bearer.startsWith("msk_")) {
    const keyHash = createHash("sha256").update(bearer).digest("hex");
    const row = await queryOne<Row>(
      "SELECT k.id AS key_id, u.id, u.org_id, u.email, u.name, u.role, o.name AS org_name, o.slug AS org_slug FROM api_keys k JOIN users u ON u.id = k.created_by JOIN organizations o ON o.id = k.org_id WHERE k.key_hash = ? AND k.revoked_at IS NULL",
      [keyHash],
    );
    if (!row) throw new AuthError(401, "invalid api key");
    await execute("UPDATE api_keys SET last_used_at = ? WHERE id = ?", [now(), row.key_id]);
    return toCurrentUser(row);
  }
  const user = await currentUser();
  if (!user) throw new AuthError(401, "sign in required");
  return user;
}

export function requireRole(user: CurrentUser, ...roles: Role[]): void {
  if (!roles.includes(user.role)) throw new AuthError(403, "not allowed");
}

export class AuthError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export async function listMembers(orgId: string) {
  return query<Row>("SELECT id, email, name, role, created_at, last_login_at FROM users WHERE org_id = ? AND role <> 'customer' ORDER BY role, name", [orgId]);
}

function toCurrentUser(row: Row): CurrentUser {
  return {
    id: String(row.id), orgId: String(row.org_id), email: String(row.email), name: String(row.name),
    role: String(row.role) as Role, orgName: String(row.org_name), orgSlug: String(row.org_slug),
  };
}
