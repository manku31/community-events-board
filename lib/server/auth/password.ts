import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// OWASP scrypt profile: N=2^15, r=8, p=3 (32 MiB per password operation).
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$32768$8$3$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  const parts = encoded?.split("$");
  const valid = parts?.length === 6 && parts[0] === "scrypt" && parts[1] === "32768"
    && parts[2] === "8" && parts[3] === "3" && /^[a-f0-9]{32}$/.test(parts[4])
    && /^[a-f0-9]{128}$/.test(parts[5]);
  // Unknown users still pay the same hashing cost; do not reveal account existence.
  const salt = valid ? Buffer.from(parts[4], "hex") : Buffer.alloc(16);
  const expected = valid ? Buffer.from(parts[5], "hex") : Buffer.alloc(64);
  const key = await derive(password, salt);
  return timingSafeEqual(key, expected) && Boolean(valid);
}
