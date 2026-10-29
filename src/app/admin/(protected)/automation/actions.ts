"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { databasePool } from "@/lib/db/connection";

const jobId = z.coerce.number().int().positive();

export async function retryAutomationJob(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const id = jobId.parse(formData.get("jobId"));
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<Array<import("mysql2/promise").RowDataPacket & { attempt_count: number; max_attempts: number }>>("SELECT attempt_count,max_attempts FROM automation_jobs WHERE id=? AND status='failed' LIMIT 1 FOR UPDATE", [id]);
    const job = rows[0];
    if (!job || job.attempt_count >= job.max_attempts) throw new Error("Η εργασία έφτασε το όριο προσπαθειών και χρειάζεται τεχνικό έλεγχο.");
    await connection.execute("UPDATE automation_jobs SET status='queued',run_at=NOW(),last_error=NULL,locked_at=NULL,locked_by=NULL,completed_at=NULL,cancelled_at=NULL WHERE id=?", [id]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'automation.retry','automation_job',?,?)", [admin.id, String(id), JSON.stringify({ previousAttempts: job.attempt_count })]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  revalidatePath("/admin/automation");
}

export async function cancelAutomationJob(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const id = jobId.parse(formData.get("jobId"));
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<import("mysql2/promise").ResultSetHeader>("UPDATE automation_jobs SET status='cancelled',cancelled_at=NOW(),locked_at=NULL,locked_by=NULL,last_error='Cancelled by an authorized administrator' WHERE id=? AND status IN ('queued','retry_wait','failed')", [id]);
    if (!result.affectedRows) throw new Error("Η εργασία δεν μπορεί να ακυρωθεί σε αυτή την κατάσταση.");
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'automation.cancel','automation_job',?,?)", [admin.id, String(id), JSON.stringify({ manual: true })]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  revalidatePath("/admin/automation");
}
