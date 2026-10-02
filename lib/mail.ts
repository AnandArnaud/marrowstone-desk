import { appendFile, mkdir } from "node:fs/promises";
import { now } from "./db";

export type Mail = { to: string; subject: string; text: string };

// Outbound email. With MAIL_RELAY_URL set, each message is posted there as JSON; without it
// (development, CI) messages are appended to data/outbox.jsonl so the templates can be read.
export async function sendMail(mail: Mail): Promise<void> {
  const record = { ...mail, sent_at: now() };
  const relay = process.env.MAIL_RELAY_URL;
  if (relay) {
    const response = await fetch(relay, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record) });
    if (!response.ok) throw new Error(`mail relay answered ${response.status}`);
    return;
  }
  await mkdir("data", { recursive: true });
  await appendFile("data/outbox.jsonl", `${JSON.stringify(record)}\n`);
}

export function appUrl(path: string): string {
  return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}
