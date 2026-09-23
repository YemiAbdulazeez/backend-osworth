import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function tempPassword(): string {
  const bytes = randomBytes(10);
  let out = "Ow-";
  for (let index = 0; index < 10; index += 1) {
    out += ALPHABET[bytes[index]! % ALPHABET.length];
  }
  return out;
}
