export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "72px 24px" }}>
      <h1 style={{ fontSize: 28, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Sign in</h1>
      <p style={{ color: "#4A5661", margin: "0 0 24px", fontSize: 14 }}>Agents and admins sign in here. Customers use the same form and land in their portal.</p>
      {params.error ? <p style={{ color: "#C2503D", fontSize: 14 }}>Wrong email or password.</p> : null}
      <form method="post" action="/api/auth/login" style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="next" value={params.next ?? ""} />
        <input name="email" type="email" required placeholder="you@company.com" style={inputStyle} />
        <input name="password" type="password" required placeholder="Password" style={inputStyle} />
        <button type="submit" style={{ background: "#1F5F7A", color: "#fff", border: 0, borderRadius: 8, padding: "12px 16px", fontWeight: 600, cursor: "pointer" }}>Sign in</button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = { padding: "12px 14px", border: "1px solid #D9DFE3", borderRadius: 8, fontSize: 15, background: "#fff" };
