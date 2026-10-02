import Link from "next/link";
import { answerVisitor, assistantConfigured } from "@/lib/assistant";

export const dynamic = "force-dynamic";

export default async function Ask({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const question = q?.trim() ?? "";
  const configured = assistantConfigured();
  const answer = question && configured ? await answerVisitor(question) : null;
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px" }}>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Ask about Marrowstone Desk</h1>
      <p style={{ color: "#4A5661", margin: "0 0 24px" }}>
        The assistant answers from our product pages and help center. For anything else, <Link href="/pricing">pricing</Link> or sales@marrowstone.example.
      </p>
      <form method="get" style={{ display: "flex", gap: 10 }}>
        <input name="q" defaultValue={question} required placeholder="How do SLA timers work on the Team plan?" style={{ flex: 1, padding: "10px 12px", border: "1px solid #D9DFE3", borderRadius: 8, fontSize: 14 }} />
        <button type="submit" style={{ background: "#1F5F7A", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}>Ask</button>
      </form>
      {question && !configured ? (
        <p style={{ marginTop: 20, color: "#C2503D", fontSize: 14 }}>The assistant is not configured on this machine (OPENAI_API_KEY is missing).</p>
      ) : null}
      {answer ? (
        <section style={{ marginTop: 24, background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: "#6B7780", marginBottom: 8 }}>You asked: {question}</div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{answer}</p>
        </section>
      ) : null}
    </main>
  );
}
