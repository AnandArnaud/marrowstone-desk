import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function newId(prefix: string, length = 12): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let index = 0; index < length; index += 1) out += ALPHABET[bytes[index] % ALPHABET.length];
  return `${prefix}_${out}`;
}
