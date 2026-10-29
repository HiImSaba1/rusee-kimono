"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { queueEmailDeliveryRetry,queueManualEmailDispatch,repairMissingEmailDelivery } from "@/features/email/operations";

export async function retryEmailDelivery(formData: FormData) {
  const admin=await requireAdminRole(["owner","manager"]);const deliveryId=z.coerce.number().int().positive().parse(formData.get("deliveryId"));
  await queueEmailDeliveryRetry({adminId:admin.id,deliveryId});revalidatePath("/admin/email");revalidatePath("/admin/automation");
}
export async function dispatchEmailQueue() { const admin=await requireAdminRole(["owner","manager"]);await queueManualEmailDispatch({adminId:admin.id});revalidatePath("/admin/email");revalidatePath("/admin/automation"); }

export async function repairMissingEmail(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const input = z.object({
    orderPublicId: z.string().uuid(),
    expectedTemplate: z.enum(["payment_confirmation", "fulfilment_update", "return_status_update"]),
    confirm: z.literal("yes"),
  }).parse(Object.fromEntries(formData));
  await repairMissingEmailDelivery({
    adminId: admin.id,
    orderPublicId: input.orderPublicId,
    expectedTemplate: input.expectedTemplate,
  });
  revalidatePath("/admin/email");
  revalidatePath("/admin/automation");
  revalidatePath("/admin/activity");
}
