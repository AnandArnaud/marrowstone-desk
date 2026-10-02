import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function NewTicket() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/portal/new");
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "28px 24px" }}>
      <h1 style={{ fontSize: 24, letterSpacing: "-0.02em", margin: "0 0 16px" }}>New ticket</h1>
      <form method="post" action="/api/tickets" style={{ display: "grid", gap: 12 }}>
        <input name="subject" required placeholder="What is it about?" style={field} />
        <textarea name="body" required rows={6} placeholder="Tell us what happened, what you expected, and when it started." style={{ ...field, fontFamily: "inherit" }} />
        <select name="priority" defaultValue="normal" style={field}>
          {["low", "normal", "high", "urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <div>
          <button type="submit" style={{ background: "#1F5F7A", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}>Send</button>
        </div>
      </form>
    </main>
  );
}

const field: React.CSSProperties = { padding: "10px 12px", border: "1px solid #D9DFE3", borderRadius: 8, background: "#fff", fontSize: 14 };
