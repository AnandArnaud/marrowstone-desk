import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type Article = { slug: string; title: string; summary: string; section: string; body: string };

const KB_DIR = path.join(process.cwd(), "kb");

// Articles are Markdown files with a small front matter block (title, summary, section).
export function listArticles(): Article[] {
  return readdirSync(KB_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readArticle(file.replace(/\.md$/, "")))
    .filter((article): article is Article => article !== null)
    .sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title));
}

export function readArticle(slug: string): Article | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  let raw: string;
  try {
    raw = readFileSync(path.join(KB_DIR, `${slug}.md`), "utf8");
  } catch {
    return null;
  }
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) return null;
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const index = line.indexOf(":");
    if (index > 0) meta[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return { slug, title: meta.title ?? slug, summary: meta.summary ?? "", section: meta.section ?? "General", body: match[2].trim() };
}
