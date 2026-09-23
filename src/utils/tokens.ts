import { createHash, randomBytes } from "node:crypto";

const REFERENCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function orderReference(): string {
  const bytes = randomBytes(8);
  let out = "OSW-";
  for (let index = 0; index < 8; index += 1) {
    out += REFERENCE_ALPHABET[bytes[index]! % REFERENCE_ALPHABET.length];
  }
  return out;
}

export function newRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) throw new Error(`Invalid TTL: ${ttl}`);
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit]!;
}
