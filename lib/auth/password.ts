import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const COST = { N: 131_072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const HASH_PATTERN = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, COST, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$131072$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string | undefined): Promise<boolean> {
  const parts = encoded?.match(HASH_PATTERN);
  // Missing users and malformed hashes still do the same expensive hash operation.
  const salt = parts ? Buffer.from(parts[1], "hex") : Buffer.alloc(16);
  const expected = parts ? Buffer.from(parts[2], "hex") : Buffer.alloc(64);
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected) && Boolean(parts);
}
