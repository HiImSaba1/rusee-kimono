"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { eraseEligiblePrivacyData } from "@/features/privacy/service";

export async function applyPrivacyErasure(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const input = z.object({ email: z.string().email().max(254), confirmation: z.literal("ANONYMIZE") }).parse(Object.fromEntries(formData));
  await eraseEligiblePrivacyData(admin.id, input.email);
  revalidatePath("/admin/privacy");
}
