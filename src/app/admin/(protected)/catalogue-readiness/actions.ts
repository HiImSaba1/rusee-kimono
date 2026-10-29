"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { approvalMutation, factApprovalCategories } from "@/features/catalogue/fact-approvals";
import { databasePool } from "@/lib/db/connection";

const inputSchema = z.object({
  designId: z.coerce.number().int().positive(),
  category: z.enum(factApprovalCategories),
  status: z.enum(["pending", "approved"]),
  confirmation: z.literal("confirmed"),
});

export async function updateFactApproval(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const input = inputSchema.parse(Object.fromEntries(formData));
  const mutation = approvalMutation(input.status, input.confirmation === "confirmed");
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [designRows] = await connection.execute("SELECT id FROM designs WHERE id=? LIMIT 1 FOR UPDATE", [input.designId]);
    if (!(designRows as Array<{ id: number }>)[0]) throw new Error("Design not found.");
    await connection.execute(`INSERT INTO design_fact_approvals (design_id,category,status,approved_by_admin_id,approved_at)
      VALUES (?,?,?,?,CASE WHEN ?='approved' THEN NOW() ELSE NULL END)
      ON DUPLICATE KEY UPDATE status=VALUES(status),approved_by_admin_id=VALUES(approved_by_admin_id),approved_at=VALUES(approved_at),updated_at=NOW()`,
      [input.designId, input.category, input.status, input.status === "approved" ? admin.id : null, input.status]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,'design',?,?)", [admin.id, mutation.action, String(input.designId), JSON.stringify({ category: input.category, status: input.status })]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  revalidatePath("/admin/catalogue-readiness");
  revalidatePath("/admin/overview");
}
