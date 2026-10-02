import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, listMembers } from "@/lib/auth";
import { query, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/app/settings");
  if (user.role === "customer") redirect("/portal");
  const params = await searchParams;
  const [members, keys, customers] = await Promise.all([
    listMembers(user.orgId),
    query<Row>("SELECT id, name, prefix, created_at, last_used_at, revoked_at FROM api_keys WHERE org_id = ? ORDER BY created_at DESC", [user.orgId]),
    query<Row>("SELECT COUNT(*) AS n FROM users WHERE org_id = ? AND role = 'customer'", [user.orgId]),
  ]);
  const isAdmin = user.role === "admin";

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px", display: "grid", gap: 28 }}>
      <div>
        <Link href="/app" style={{ fontSize: 13, color: "#6B7780" }}>← Inbox</Link>
        <h1 style={{ fontSize: 24, letterSpacing: "-0.02em", margin: "10px 0 0" }}>{user.orgName} settings</h1>
        <p style={{ color: "#6B7780", fontSize: 14, margin: "6px 0 0" }}>{String(customers[0]?.n ?? 0)} customer accounts use the portal.</p>
      </div>

      <section style={card}>
        <h2 style={heading}>Team</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <tbody>
            {members.map((member) => (
              <tr key={String(member.id)} style={{ borderBottom: "1px solid #EEF1F3" }}>
                <td style={cell}><strong>{String(member.name)}</strong><br /><span style={{ color: "#6B7780" }}>{String(member.email)}</span></td>
                <td style={cell}>{String(member.role)}</td>
                <td style={{ ...cell, color: "#6B7780" }}>last sign-in {String(member.last_login_at ?? "never")}</td>
                <td style={cell}>
                  {isAdmin && String(member.id) !== user.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <form method="post" action="/api/members?_method=PATCH">
                        <input type="hidden" name="id" value={String(member.id)} />
                        <input type="hidden" name="role" value={member.role === "admin" ? "agent" : "admin"} />
                        <button type="submit" style={smallButton}>Make {member.role === "admin" ? "agent" : "admin"}</button>
                      </form>
                      <form method="post" action="/api/members?_method=PATCH">
                        <input type="hidden" name="id" value={String(member.id)} />
                        <input type="hidden" name="remove" value="1" />
                        <button type="submit" style={{ ...smallButton, color: "#C2503D" }}>Remove</button>
                      </form>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin ? (
          <form method="post" action="/api/members" style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <input name="name" required placeholder="Full name" style={field} />
            <input name="email" type="email" required placeholder="email@company.com" style={field} />
            <select name="role" defaultValue="agent" style={field}><option value="agent">agent</option><option value="admin">admin</option></select>
            <button type="submit" style={button}>Invite</button>
          </form>
        ) : null}
      </section>

      {isAdmin ? (
        <section style={card}>
          <h2 style={heading}>API keys</h2>
          {params.created ? (
            <p style={{ background: "#F4F6F7", border: "1px solid #D9DFE3", borderRadius: 8, padding: 12, fontSize: 13 }}>
              New key, shown once: <code>{params.created}</code>
            </p>
          ) : null}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {keys.map((key) => (
                <tr key={String(key.id)} style={{ borderBottom: "1px solid #EEF1F3", color: key.revoked_at ? "#6B7780" : "inherit" }}>
                  <td style={cell}><strong>{String(key.name)}</strong> <code style={{ color: "#6B7780" }}>{String(key.prefix)}…</code></td>
                  <td style={{ ...cell, color: "#6B7780" }}>created {String(key.created_at)}{key.last_used_at ? ` · last used ${String(key.last_used_at)}` : ""}{key.revoked_at ? ` · revoked ${String(key.revoked_at)}` : ""}</td>
                  <td style={cell}>
                    {key.revoked_at ? null : (
                      <form method="post" action="/api/api-keys?_method=PATCH">
                        <input type="hidden" name="id" value={String(key.id)} />
                        <button type="submit" style={{ ...smallButton, color: "#C2503D" }}>Revoke</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form method="post" action="/api/api-keys" style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <input name="name" required placeholder="Key name (what will use it)" style={{ ...field, flex: 1 }} />
            <button type="submit" style={button}>Create key</button>
          </form>
          <p style={{ color: "#6B7780", fontSize: 13, marginBottom: 0 }}>
            Send the key as <code>Authorization: Bearer msk_…</code> to <code>/api/tickets</code>, <code>/api/tickets/:id</code> and <code>/api/tickets/:id/status</code>.
          </p>
        </section>
      ) : null}
    </main>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 20 };
const heading: React.CSSProperties = { fontSize: 16, margin: "0 0 12px" };
const cell: React.CSSProperties = { padding: "10px 8px", verticalAlign: "top" };
const field: React.CSSProperties = { padding: "8px 10px", border: "1px solid #D9DFE3", borderRadius: 8, background: "#fff", fontSize: 14 };
const button: React.CSSProperties = { background: "#1F5F7A", color: "#fff", border: 0, borderRadius: 8, padding: "9px 14px", fontWeight: 600, cursor: "pointer" };
const smallButton: React.CSSProperties = { background: "none", border: "1px solid #D9DFE3", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12, color: "inherit" };
