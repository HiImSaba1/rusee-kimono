import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { databasePool } from "@/lib/db/connection";

const COOKIE_NAME = "rusee_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

export type AdminSession = { id: number; username: string; role: "owner" | "manager" | "fulfilment" | "viewer" };

function tokenHash(token: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return createHash("sha256").update(`${token}:${secret}`).digest("hex");
}

export async function createAdminSession(adminUserId: number) {
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  await databasePool.execute("DELETE FROM admin_sessions WHERE admin_user_id = ? OR expires_at <= NOW() OR revoked_at IS NOT NULL", [adminUserId]);
  await databasePool.execute(
    "INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))",
    [adminUserId, hash],
  );
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.APP_URL?.startsWith("https://") ?? false,
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_SECONDS,
    priority: "high",
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [rows] = await databasePool.execute(
    `SELECT u.id, u.username, u.role
     FROM admin_sessions s
     INNER JOIN admin_users u ON u.id = s.admin_user_id AND u.active = true
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash(token)],
  );
  return (rows as AdminSession[])[0] ?? null;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  return session;
}

export async function requireAdminRole(roles: AdminSession["role"][]) {
  const session = await requireAdmin();
  if (!roles.includes(session.role)) throw new Error("You are not authorized to perform this operation.");
  return session;
}

export async function revokeCurrentAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const hash = tokenHash(token);
    const connection = await databasePool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute("SELECT admin_user_id FROM admin_sessions WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1 FOR UPDATE", [hash]);
      const adminUserId = (rows as Array<{ admin_user_id: number }>)[0]?.admin_user_id;
      await connection.execute("UPDATE admin_sessions SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL", [hash]);
      if (adminUserId) await connection.execute(
        "INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id) VALUES (?, 'admin.logout', 'admin_session', ?)",
        [adminUserId, String(adminUserId)],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  cookieStore.delete(COOKIE_NAME);
}
