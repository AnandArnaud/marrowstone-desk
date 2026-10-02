import Link from "next/link";
import { notFound } from "next/navigation";
import { listArticles, readArticle } from "@/lib/kb";

export function generateStaticParams() {
  return listArticles().map((article) => ({ slug: article.slug }));
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = readArticle(slug);
  if (!article) notFound();
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px" }}>
      <Link href="/help" style={{ fontSize: 13, color: "#6B7780" }}>← Help center</Link>
      <div style={{ color: "#6B7780", fontSize: 13, marginTop: 14 }}>{article.section}</div>
      <h1 style={{ fontSize: 30, letterSpacing: "-0.03em", margin: "4px 0 8px" }}>{article.title}</h1>
      <p style={{ color: "#4A5661", fontSize: 16, margin: "0 0 24px" }}>{article.summary}</p>
      <article style={{ background: "#fff", border: "1px solid #D9DFE3", borderRadius: 12, padding: 24, fontSize: 15, lineHeight: 1.6 }}>
        {renderMarkdown(article.body)}
      </article>
    </main>
  );
}

// The articles use headings, paragraphs, numbered and bulleted lists and bold text; that is all
// this renders, deliberately, so the help center needs no markdown dependency.
function renderMarkdown(markdown: string) {
  const blocks = markdown.split(/\n\s*\n/);
  return blocks.map((block, index) => {
    const lines = block.split("\n");
    if (block.startsWith("## ")) return <h2 key={index} style={{ fontSize: 18, margin: "18px 0 8px" }}>{block.slice(3)}</h2>;
    if (lines.every((line) => /^\d+\. /.test(line))) return <ol key={index} style={{ paddingLeft: 22 }}>{lines.map((line, item) => <li key={item}>{inline(line.replace(/^\d+\. /, ""))}</li>)}</ol>;
    if (lines.every((line) => line.startsWith("- "))) return <ul key={index} style={{ paddingLeft: 22 }}>{lines.map((line, item) => <li key={item}>{inline(line.slice(2))}</li>)}</ul>;
    return <p key={index} style={{ margin: "0 0 12px" }}>{inline(block)}</p>;
  });
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => (part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <span key={index}>{part}</span>));
}
