import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scrypt = promisify(scryptCallback);
const { DATABASE_URL, ADMIN_BOOTSTRAP_USERNAME, ADMIN_BOOTSTRAP_PASSWORD, ADMIN_SESSION_SECRET } = process.env;
if (!DATABASE_URL || !ADMIN_BOOTSTRAP_USERNAME || !ADMIN_BOOTSTRAP_PASSWORD || !ADMIN_SESSION_SECRET) throw new Error("Database and admin bootstrap environment values are required.");
if (ADMIN_BOOTSTRAP_PASSWORD.length < 12) throw new Error("ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters.");
if (ADMIN_SESSION_SECRET.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");

const salt = randomBytes(16).toString("base64url");
const key = Buffer.from(await scrypt(`${ADMIN_BOOTSTRAP_PASSWORD}:${ADMIN_SESSION_SECRET}`, salt, 64));
const passwordHash = `scrypt$${salt}$${key.toString("base64url")}`;
const connection = await mysql.createConnection(DATABASE_URL);
try {
  await connection.beginTransaction();
  const [result] = await connection.execute(
    `INSERT INTO admin_users (username, password_hash, role, active)
     VALUES (?, ?, 'owner', true)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), active = true, updated_at = NOW()`,
    [ADMIN_BOOTSTRAP_USERNAME.trim(), passwordHash],
  );
  const adminId = result.insertId || (await connection.execute("SELECT id FROM admin_users WHERE username = ? LIMIT 1", [ADMIN_BOOTSTRAP_USERNAME.trim()]))[0][0].id;
  await connection.execute("DELETE FROM admin_sessions WHERE admin_user_id = ?", [adminId]);
  await connection.execute(
    "INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, 'admin.bootstrap', 'admin_user', ?, ?)",
    [adminId, String(adminId), JSON.stringify({ source: "local_cli", passwordHash: createHash("sha256").update(passwordHash).digest("hex").slice(0, 12) })],
  );
  await connection.commit();
  console.log("First admin stored with a scrypt password hash; existing sessions were revoked.");
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
