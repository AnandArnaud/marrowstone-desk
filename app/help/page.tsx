import Link from "next/link";
import { listArticles } from "@/lib/kb";

export default function Help() {
  const articles = listArticles();
  const sections = [...new Set(articles.map((article) => article.section))];
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px" }}>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Help center</h1>
      <p style={{ color: "#4A5661", margin: "0 0 32px" }}>Short answers to the questions teams ask in their first month.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {sections.map((section) => (
          <section key={section}>
            <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{section}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
              {articles.filter((article) => article.section === section).map((article) => (
                <li key={article.slug}>
                  <Link href={`/help/${article.slug}`} style={{ color: "#1F5F7A", fontSize: 14 }}>{article.title}</Link>
                  <div style={{ color: "#6B7780", fontSize: 13 }}>{article.summary}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
