import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Marrowstone Desk",
  description: "A help desk for small B2B teams.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif", background: "#F4F6F7", color: "#1E2A32" }}>
        <header style={{ borderBottom: "1px solid #D9DFE3", background: "#FFFFFF" }}>
          <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: "#1F5F7A", display: "inline-block" }} />
              <strong style={{ letterSpacing: "-0.02em", fontSize: 18 }}>Marrowstone Desk</strong>
            </Link>
            <div style={{ marginLeft: "auto", display: "flex", gap: 18, fontSize: 14, alignItems: "center" }}>
              <Link href="/pricing" style={{ color: "inherit" }}>Pricing</Link>
              <Link href="/customers" style={{ color: "inherit" }}>Customers</Link>
              <Link href="/help" style={{ color: "inherit" }}>Help</Link>
              {user ? (
                <>
                  <Link href={user.role === "customer" ? "/portal" : "/app"} style={{ color: "inherit" }}>
                    {user.role === "customer" ? "My tickets" : "Inbox"}
                  </Link>
                  <span style={{ color: "#6B7780" }}>{user.name}</span>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" style={{ background: "none", border: "1px solid #D9DFE3", borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: "inherit" }}>Sign out</button>
                  </form>
                </>
              ) : (
                <Link href="/login" style={{ background: "#1F5F7A", color: "#fff", padding: "8px 14px", borderRadius: 6, textDecoration: "none" }}>Sign in</Link>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
