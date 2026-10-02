// The two places the app calls a model from the request path: the visitor-facing assistant on the
// marketing site (answers from our own copy) and the reply drafter in the agent inbox. Both go
// through the OpenAI SDK, as jobs/summarize.ts does.
import OpenAI from "openai";
import { query, queryOne, type Row } from "./db";
import { listArticles } from "./kb";

const MODEL = "gpt-4o";

const PRODUCT_COPY = `Marrowstone Desk is a help desk for small B2B teams: queues, SLAs, a customer portal and an API, for teams that answer every ticket themselves. No bots answering for customers, no per-seat surprises.
Plans, per agent per month, customers on the portal always free:
- Starter, $19: 1 queue, email and portal channels, 30-day history, community support.
- Team, $39: unlimited queues, SLAs and priorities, API access and CSV export, email support.
- Business, $69: everything in Team, custom roles, customer portal branding, priority support.
Sales: sales@marrowstone.example, a person answers within a business day.`;

export function assistantConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function answerVisitor(question: string): Promise<string> {
  const index = listArticles().map((article) => `- ${article.title}: ${article.summary}`).join("\n");
  const client = new OpenAI();
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are the sales assistant on the Marrowstone Desk website. Answer in two to four plain sentences using only the product copy and the help-center index below. " +
          "If the answer is not in them, say so and point to sales@marrowstone.example. Never invent features, customers, ratings or comparisons with other products.\n\n" +
          `${PRODUCT_COPY}\n\nHelp center:\n${index}`,
      },
      { role: "user", content: question },
    ],
  });
  return response.choices[0]?.message?.content?.trim() || "I do not have an answer for that yet; sales@marrowstone.example will.";
}

export async function draftReply(ticketId: string): Promise<string> {
  const ticket = await queryOne<Row>("SELECT subject, body, priority FROM tickets WHERE id = ?", [ticketId]);
  if (!ticket) throw new Error("ticket not found");
  const messages = await query<Row>("SELECT author_type, body FROM messages WHERE ticket_id = ? AND author_type <> 'system' ORDER BY created_at", [ticketId]);
  const thread = [`customer: ${ticket.body}`, ...messages.map((message) => `${message.author_type}: ${message.body}`)].join("\n\n");
  const client = new OpenAI();
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You draft the next reply for a support agent at Marrowstone Desk. Write what the agent would send: short, specific to the thread, polite, plain text, no subject line, no signature. " +
          "If the thread lacks the information needed to resolve the issue, ask for exactly what is missing.",
      },
      { role: "user", content: `Subject: ${ticket.subject}\nPriority: ${ticket.priority}\n\n${thread}` },
    ],
  });
  return response.choices[0]?.message?.content?.trim() || "";
}
