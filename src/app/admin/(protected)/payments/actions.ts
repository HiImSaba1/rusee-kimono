"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { databasePool } from "@/lib/db/connection";

export async function reviewPaymentReconciliation(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const parsed = z.object({ paymentId: z.coerce.number().int().positive(), note: z.string().trim().min(8).max(500) }).parse(Object.fromEntries(formData));
  const [rows] = await databasePool.execute("SELECT id, provider, status FROM payments WHERE id = ? LIMIT 1", [parsed.paymentId]);
  const payment = (rows as Array<{ id: number; provider: string; status: string }>)[0];
  if (!payment) throw new Error("Payment no longer exists.");
  await databasePool.execute("INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, 'payment.reconciliation.review', 'payment', ?, ?)", [admin.id, String(payment.id), JSON.stringify({ note: parsed.note, provider: payment.provider, observedStatus: payment.status })]);
  revalidatePath("/admin/payments");
}

export async function reviewPaymentEvent(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const parsed = z.object({ eventId: z.coerce.number().int().positive(), note: z.string().trim().min(8).max(500) }).parse(Object.fromEntries(formData));
  const [rows] = await databasePool.execute("SELECT id,provider,event_type,processing_status FROM payment_events WHERE id=? LIMIT 1", [parsed.eventId]);
  const event = (rows as Array<{ id:number; provider:string; event_type:string; processing_status:string }>)[0];
  if (!event) throw new Error("Payment event no longer exists.");
  await databasePool.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'payment_event.reconciliation.review','payment_event',?,?)", [admin.id, String(event.id), JSON.stringify({ note: parsed.note, provider: event.provider, eventType: event.event_type, processingStatus: event.processing_status })]);
  revalidatePath("/admin/reconciliation");
}
