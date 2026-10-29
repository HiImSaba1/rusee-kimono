"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { databasePool } from "@/lib/db/connection";
import { verifyAdminPassword } from "@/features/admin-auth/password";
import { createAdminSession, revokeCurrentAdminSession } from "@/features/admin-auth/session";

export type LoginState = { message?: string };
const credentials = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(300),
});

export async function loginAdmin(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return { message: "Enter your username and password." };

  const [attemptRows] = await databasePool.execute(
    `SELECT COUNT(*) AS attempts FROM admin_audit_events
     WHERE action = 'admin.login_failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
       AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.username')) = ?`,
    [parsed.data.username],
  );
  if (Number((attemptRows as Array<{ attempts: number }>)[0]?.attempts ?? 0) >= 5) {
    await verifyAdminPassword(parsed.data.password);
    return { message: "Too many attempts. Try again in 15 minutes." };
  }

  const [rows] = await databasePool.execute(
    "SELECT id, password_hash FROM admin_users WHERE username = ? AND active = true LIMIT 1",
    [parsed.data.username],
  );
  const admin = (rows as Array<{ id: number; password_hash: string }>)[0];
  const valid = await verifyAdminPassword(parsed.data.password, admin?.password_hash);
  if (!admin || !valid) {
    await databasePool.execute(
      "INSERT INTO admin_audit_events (action, entity_type, metadata) VALUES ('admin.login_failed', 'admin_session', ?)",
      [JSON.stringify({ username: parsed.data.username.slice(0, 100) })],
    );
    return { message: "The credentials were not accepted." };
  }

  await createAdminSession(admin.id);
  await databasePool.execute("UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?", [admin.id]);
  await databasePool.execute(
    "INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id) VALUES (?, 'admin.login', 'admin_session', ?)",
    [admin.id, String(admin.id)],
  );
  redirect("/admin/overview");
}

export async function logoutAdmin() {
  await revokeCurrentAdminSession();
  redirect("/admin");
}
