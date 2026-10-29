import { createHmac, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCallback);
const username = "__rusee_e2e_admin__";
const { DATABASE_URL, ADMIN_SESSION_SECRET } = process.env;
if (!DATABASE_URL || !ADMIN_SESSION_SECRET || ADMIN_SESSION_SECRET.length < 32) throw new Error("Local database and session secret are required.");
const databaseUrl = new URL(DATABASE_URL);
if (process.env.NODE_ENV === "production" || !["127.0.0.1", "localhost"].includes(databaseUrl.hostname) || databaseUrl.pathname !== "/next_kimono") throw new Error("Admin browser fixture is restricted to the local next_kimono database.");
const password = createHmac("sha256", ADMIN_SESSION_SECRET).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);
const connection = await mysql.createConnection(DATABASE_URL);

async function remove() {
  const [rows] = await connection.execute("SELECT id FROM admin_users WHERE username=?", [username]);
  const id = rows[0]?.id;
  if (!id) return;
  await connection.execute("DELETE FROM admin_sessions WHERE admin_user_id=?", [id]);
  await connection.execute("DELETE FROM admin_audit_events WHERE admin_user_id=?", [id]);
  await connection.execute("DELETE FROM admin_users WHERE id=?", [id]);
}

try {
  await connection.beginTransaction();
  await remove();
  if (!process.argv.includes("--cleanup")) {
    const salt = randomBytes(16).toString("base64url");
    const key = Buffer.from(await scrypt(`${password}:${ADMIN_SESSION_SECRET}`, salt, 64));
    await connection.execute("INSERT INTO admin_users (username,password_hash,role,active) VALUES (?,?,'owner',true)", [username, `scrypt$${salt}$${key.toString("base64url")}`]);
  }
  await connection.commit();
  console.log(process.argv.includes("--cleanup") ? "Local admin browser fixture removed." : "Local admin browser fixture prepared without printing credentials.");
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
