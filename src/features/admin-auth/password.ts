import "server-only";
import { scrypt as scryptCallback, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

async function derive(password: string, salt: string) {
  return await scrypt(`${password}:${secret()}`, salt, KEY_LENGTH) as Buffer;
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await derive(password, salt);
  return `scrypt$${salt}$${hash.toString("base64url")}`;
}

export async function verifyAdminPassword(password: string, storedHash?: string) {
  const [, salt, encodedHash] = storedHash?.split("$") ?? [];
  if (!salt || !encodedHash || !storedHash?.startsWith("scrypt$")) {
    await derive(password, "invalid-admin-user");
    return false;
  }
  const expected = Buffer.from(encodedHash, "base64url");
  const actual = await derive(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
