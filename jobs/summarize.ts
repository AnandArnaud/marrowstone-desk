// Nightly: write a short summary, root cause, category and sentiment for every resolved ticket
// that does not have one yet. Runs from cron on the app host:
//
//   OPENAI_API_KEY=... node jobs/summarize.ts [--limit 200] [--dry-run]
//
// The app reads ticket_summaries on the ticket page; the shape of each row is the contract.

import OpenAI from "openai";
import { execute, now, query, type Row } from "../lib/db.ts";

const MODEL = "gpt-4o";
const CATEGORIES = ["billing", "access", "integration", "data", "performance", "mobile", "reporting", "how-to", "other"];

type Summary = { summary: string; root_cause: string | null; category: string; sentiment: "positive" | "neutral" | "negative" };

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || 200;
const dryRun = args.includes("--dry-run");

async function main() {
  const tickets = await query<Row>(
    `SELECT t.id, t.subject, t.body, t.created_at, t.resolved_at FROM tickets t
     LEFT JOIN ticket_summaries s ON s.ticket_id = t.id
     WHERE t.status IN ('resolved', 'closed') AND s.ticket_id IS NULL ORDER BY t.resolved_at DESC LIMIT ?`,
    [limit],
  );
  if (tickets.length === 0) {
    console.log("nothing to summarize");
    return;
  }
  const client = new OpenAI();
  let written = 0;
  for (const ticket of tickets) {
    const messages = await query<Row>("SELECT author_type, body FROM messages WHERE ticket_id = ? ORDER BY created_at", [ticket.id]);
    const thread = messages.map((message) => `${message.author_type}: ${message.body}`).join("\n");
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize support tickets for the team's weekly review. Answer with JSON: " +
            `{"summary": one or two sentences, "root_cause": short phrase or null, "category": one of ${CATEGORIES.join("|")}, "sentiment": positive|neutral|negative}.`,
        },
        { role: "user", content: `Subject: ${ticket.subject}\n\n${thread}` },
      ],
    });
    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as Partial<Summary>;
    const summary: Summary = {
      summary: String(parsed.summary ?? "").trim() || ticket.subject as string,
      root_cause: parsed.root_cause ? String(parsed.root_cause) : null,
      category: CATEGORIES.includes(String(parsed.category)) ? String(parsed.category) : "other",
      sentiment: parsed.sentiment === "positive" || parsed.sentiment === "negative" ? parsed.sentiment : "neutral",
    };
    if (dryRun) {
      console.log(ticket.id, JSON.stringify(summary));
      continue;
    }
    await execute(
      "INSERT INTO ticket_summaries (ticket_id, summary, root_cause, category, sentiment, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [ticket.id, summary.summary, summary.root_cause, summary.category, summary.sentiment, MODEL, now()],
    );
    written += 1;
  }
  console.log(`summarized ${written} of ${tickets.length} tickets with ${MODEL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
