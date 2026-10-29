"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/admin-auth/session";
import { databasePool } from "@/lib/db/connection";

const input=z.object({notificationId:z.coerce.number().int().positive(),intent:z.enum(["read","archive"])});
export async function updateNotificationState(formData:FormData){const admin=await requireAdmin();const value=input.parse(Object.fromEntries(formData));await databasePool.execute(`INSERT INTO admin_notification_states (notification_id,admin_user_id,read_at,archived_at) VALUES (?,?,NOW(),${value.intent==="archive"?"NOW()":"NULL"}) ON DUPLICATE KEY UPDATE read_at=COALESCE(read_at,NOW()),archived_at=${value.intent==="archive"?"NOW()":"archived_at"}`,[value.notificationId,admin.id]);revalidatePath("/admin","layout");}
