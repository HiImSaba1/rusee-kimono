import "server-only";
import type { PoolConnection } from "mysql2/promise";

export async function enqueuePaymentEmails(connection: PoolConnection, orderId: number) {
  const [rows] = await connection.execute("SELECT email, order_number FROM orders WHERE id = ? LIMIT 1", [orderId]);
  const order = (rows as Array<{ email: string; order_number: string }>)[0];
  if (!order) throw new Error("Email order does not exist.");
  await connection.execute(`INSERT IGNORE INTO email_deliveries (order_id, template, recipient, idempotency_key)
    VALUES (?, 'payment_confirmation', ?, ?)`, [orderId, order.email, `payment-confirmation:${orderId}`]);
  const adminRecipient = process.env.ADMIN_ORDER_EMAIL?.trim();
  if (adminRecipient) await connection.execute(`INSERT IGNORE INTO email_deliveries (order_id, template, recipient, idempotency_key)
    VALUES (?, 'admin_new_order', ?, ?)`, [orderId, adminRecipient, `admin-new-order:${orderId}`]);
}

export async function enqueueFulfilmentEmail(connection: PoolConnection, orderId: number, fulfilmentStatus: string, shipment?: { carrierName: string; trackingCode: string; trackingUrl: string | null }) {
  const [rows] = await connection.execute("SELECT email FROM orders WHERE id = ? LIMIT 1", [orderId]);
  const recipient = (rows as Array<{ email: string }>)[0]?.email;
  if (!recipient) throw new Error("Fulfilment email order does not exist.");
  await connection.execute(`INSERT IGNORE INTO email_deliveries (order_id, template, recipient, idempotency_key, context)
    VALUES (?, 'fulfilment_update', ?, ?, ?)`, [orderId, recipient, `fulfilment:${orderId}:${fulfilmentStatus}`, JSON.stringify({ fulfilmentStatus, shipment })]);
}
