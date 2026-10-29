"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { advanceContactEnquiry, enquiryStatuses } from "@/features/contact/admin";
import { databasePool } from "@/lib/db/connection";

const transitionSchema = z.object({
  enquiryId: z.coerce.number().int().positive(),
  publicId: z.string().uuid(),
  status: z.enum(enquiryStatuses),
});

export async function advanceEnquiryStatus(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager", "fulfilment"]);
  const input = transitionSchema.parse(Object.fromEntries(formData));
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    await advanceContactEnquiry(connection, admin.id, input.enquiryId, input.status);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${input.publicId}`);
}
