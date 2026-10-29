"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { enqueueFulfilmentEmail } from "@/features/email/queue";
import { shipmentInput } from "@/features/fulfilment/shipment";
import { fulfilmentTransitions } from "@/features/admin/order-operations";
import { databasePool } from "@/lib/db/connection";

const refresh = (publicId: string) => { revalidatePath("/admin/order-operations"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${publicId}`); revalidatePath(`/order/${publicId}`); revalidatePath("/admin/overview"); };

export async function advanceFulfilment(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager", "fulfilment"]);
  const orderId = z.coerce.number().int().positive().parse(formData.get("orderId"));
  const note = z.string().trim().min(5).max(300).parse(formData.get("note"));
  const connection = await databasePool.getConnection();
  let publicId = "";
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT public_id,status,payment_status,fulfilment_status,total_minor,currency FROM orders WHERE id=? LIMIT 1 FOR UPDATE", [orderId]);
    const order = (rows as Array<{ public_id: string; status: string; payment_status: string; fulfilment_status: string; total_minor:number; currency:string }>)[0];
    if (!order || order.payment_status !== "paid") throw new Error("Only an order backed by one matching captured payment can advance through fulfilment.");
    const [capturedRows] = await connection.execute("SELECT id FROM payments WHERE order_id=? AND status='captured' AND amount_minor=? AND currency=? FOR UPDATE", [orderId, order.total_minor, order.currency]);
    if ((capturedRows as Array<{id:number}>).length !== 1) throw new Error("Only an order backed by one matching captured payment can advance through fulfilment.");
    const next = fulfilmentTransitions[order.fulfilment_status];
    if (!next) throw new Error("No further fulfilment transition is available.");
    const shipment = order.fulfilment_status === "processing" ? shipmentInput.parse(Object.fromEntries(formData)) : null;
    if (shipment) await connection.execute("INSERT INTO shipments (order_id,carrier_name,tracking_code,tracking_url,created_by_admin_id) VALUES (?,?,?,?,?)", [orderId, shipment.carrierName, shipment.trackingCode, shipment.trackingUrl, admin.id]);
    await connection.execute("UPDATE orders SET fulfilment_status=?, status=?, updated_at=NOW() WHERE id=?", [next.fulfilmentStatus, next.orderStatus, orderId]);
    await connection.execute("INSERT INTO order_status_events (order_id,from_status,to_status,actor_type,note) VALUES (?, ?, ?, 'admin', ?)", [orderId, order.status, next.orderStatus, note]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'order.fulfilment.advance','order',?,?)", [admin.id, String(orderId), JSON.stringify({ from: order.fulfilment_status, to: next.fulfilmentStatus, shipment: shipment ? { carrierName: shipment.carrierName, hasTrackingUrl: Boolean(shipment.trackingUrl) } : undefined })]);
    await enqueueFulfilmentEmail(connection, orderId, next.fulfilmentStatus, shipment ?? undefined);
    publicId = order.public_id;
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  refresh(publicId);
}

export async function requestRefund(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]); const parsed = z.object({ paymentId: z.coerce.number().int().positive(), amount: z.coerce.number().positive().max(100000), reason: z.string().trim().min(8).max(300) }).parse(Object.fromEntries(formData)); const amountMinor = Math.round(parsed.amount * 100);
  const connection = await databasePool.getConnection(); try { await connection.beginTransaction(); const [rows] = await connection.execute(`SELECT p.id,p.order_id,p.amount_minor,p.status,o.public_id FROM payments p INNER JOIN orders o ON o.id=p.order_id WHERE p.id=? LIMIT 1 FOR UPDATE`, [parsed.paymentId]); const payment = (rows as Array<{ id: number; order_id: number; amount_minor: number; status: string; public_id: string }>)[0]; if (!payment || payment.status !== "captured") throw new Error("A refund can only be requested for a captured payment."); const [sumRows] = await connection.execute("SELECT COALESCE(SUM(amount_minor),0) AS requested FROM refunds WHERE payment_id=? AND status IN ('pending','succeeded')", [payment.id]); const requested = Number((sumRows as Array<{ requested: number }>)[0].requested); if (requested + amountMinor > payment.amount_minor) throw new Error("Refund requests cannot exceed the captured amount."); const [result] = await connection.execute("INSERT INTO refunds (payment_id,amount_minor,reason,status) VALUES (?,?,?,'pending')", [payment.id, amountMinor, parsed.reason]); const refundId = Number((result as { insertId: number }).insertId); await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'refund.request','refund',?,?)", [admin.id, String(refundId), JSON.stringify({ paymentId: payment.id, amountMinor, reason: parsed.reason, execution: "provider_pending" })]); await connection.commit(); refresh(payment.public_id); } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
