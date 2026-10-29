"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { hashAdminPassword } from "@/features/admin-auth/password";
import { staffPassword, staffRole, staffUsername } from "@/features/admin/team";
import { databasePool } from "@/lib/db/connection";

const memberId = z.coerce.number().int().positive();

export async function createStaffMember(formData: FormData) {
  const admin = await requireAdminRole(["owner"]);
  const input = z.object({ username: staffUsername, email: z.union([z.literal(""), z.string().trim().email().max(254)]), role: staffRole, password: staffPassword }).parse(Object.fromEntries(formData));
  const passwordHash = await hashAdminPassword(input.password);
  const connection = await databasePool.getConnection();
  let id = 0;
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute("SELECT id FROM admin_users WHERE username=? LIMIT 1 FOR UPDATE", [input.username]);
    if ((existing as unknown[]).length) throw new Error("This admin username already exists.");
    const [result] = await connection.execute("INSERT INTO admin_users (username,email,password_hash,role,active) VALUES (?,?,?,?,true)", [input.username, input.email || null, passwordHash, input.role]);
    id = Number((result as { insertId: number }).insertId);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'admin.staff.create','admin_user',?,?)", [admin.id, String(id), JSON.stringify({ username: input.username, role: input.role, hasEmail: Boolean(input.email) })]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  revalidatePath("/admin/team");
  redirect("/admin/team?saved=created");
}

export async function resetStaffPassword(formData: FormData) {
  const admin = await requireAdminRole(["owner"]);
  const input = z.object({ memberId, password: staffPassword, confirmation: z.literal("RESET") }).parse(Object.fromEntries(formData));
  const passwordHash = await hashAdminPassword(input.password);
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT username,role FROM admin_users WHERE id=? LIMIT 1 FOR UPDATE", [input.memberId]);
    const target = (rows as Array<{ username: string; role: string }>)[0];
    if (!target || target.role === "owner") throw new Error("Owner credentials remain a bootstrap-level operation.");
    await connection.execute("UPDATE admin_users SET password_hash=?,updated_at=NOW() WHERE id=?", [passwordHash, input.memberId]);
    await connection.execute("DELETE FROM admin_sessions WHERE admin_user_id=?", [input.memberId]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'admin.staff.password_reset','admin_user',?,?)", [admin.id, String(input.memberId), JSON.stringify({ username: target.username, sessionsRevoked: true })]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  revalidatePath("/admin/team");
  redirect("/admin/team?saved=password");
}

export async function setStaffActive(formData: FormData) {
  const admin = await requireAdminRole(["owner"]);
  const input = z.object({ memberId, active: z.enum(["true", "false"]), confirmation: z.literal("CONFIRM") }).parse(Object.fromEntries(formData));
  if (input.memberId === admin.id) throw new Error("You cannot change your own active state.");
  const active = input.active === "true";
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT username,role,active FROM admin_users WHERE id=? LIMIT 1 FOR UPDATE", [input.memberId]);
    const target = (rows as Array<{ username: string; role: string; active: number }>)[0];
    if (!target || target.role === "owner") throw new Error("Owner state remains a bootstrap-level operation.");
    await connection.execute("UPDATE admin_users SET active=?,updated_at=NOW() WHERE id=?", [active, input.memberId]);
    if (!active) await connection.execute("DELETE FROM admin_sessions WHERE admin_user_id=?", [input.memberId]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,'admin_user',?,?)", [admin.id, active ? "admin.staff.activated" : "admin.staff.deactivated", String(input.memberId), JSON.stringify({ username: target.username, role: target.role, sessionsRevoked: !active })]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  revalidatePath("/admin/team");
  redirect(`/admin/team?saved=${active ? "activated" : "deactivated"}`);
}
