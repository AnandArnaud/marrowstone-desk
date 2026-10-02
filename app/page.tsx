import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px" }}>
      <section style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
          Support that keeps its promises.
        </h1>
        <p style={{ fontSize: 18, color: "#4A5661", margin: "0 0 28px" }}>
          Queues, SLAs, a customer portal and an API, for teams that answer every ticket themselves.
          No bots answering for you, no per-seat surprises.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/pricing" style={{ background: "#1F5F7A", color: "#fff", padding: "12px 18px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>See pricing</Link>
          <Link href="/login" style={{ border: "1px solid #D9DFE3", padding: "12px 18px", borderRadius: 8, textDecoration: "none", color: "inherit" }}>Sign in</Link>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 72 }}>
        {[
          ["Queues and SLAs", "Route by channel or topic. First-response and resolution timers per priority, visible on every ticket."],
          ["Customer portal", "Customers sign in, see their own tickets and reply in place. Nothing leaves your account."],
          ["API and exports", "Create and update tickets from your own systems with an API key. Export everything as CSV."],
        ].map(([title, text]) => (
          <div key={title} style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{title}</h3>
            <p style={{ margin: 0, color: "#4A5661", fontSize: 14, lineHeight: 1.5 }}>{text}</p>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 72, background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 28 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>What customers say</h2>
        <p style={{ margin: 0, color: "#6B7780", fontSize: 14 }}>
          Customer quotes and ratings will appear here.
        </p>
      </section>
    </main>
  );
}
