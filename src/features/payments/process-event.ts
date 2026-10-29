import "server-only";
import type { PoolConnection } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";
import type { VerifiedProviderEvent } from "./provider";
import { enqueuePaymentAttention, enqueueVerifiedSaleFanout } from "./communication-fanout";

type PaymentRow = { id: number; order_id: number; amount_minor: number; currency: string; status: string; order_status: string; payment_status: string; order_number: string; reservation_active: number };
export type ProcessEventResult = { outcome: "processed" | "ignored" | "failed" | "duplicate"; reason?: string };

export async function processVerifiedPaymentEvent(event: VerifiedProviderEvent): Promise<ProcessEventResult> {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [duplicateRows] = await connection.execute("SELECT id FROM payment_events WHERE provider = ? AND provider_event_id = ? LIMIT 1", [event.provider, event.providerEventId]);
    if ((duplicateRows as Array<{ id: number }>)[0]) { await connection.commit(); return { outcome: "duplicate" }; }

    const [paymentRows] = await connection.execute(
      `SELECT p.id, p.order_id, p.amount_minor, p.currency, p.status, o.status AS order_status,
       o.payment_status, o.order_number, o.reservation_expires_at > NOW() AS reservation_active
       FROM payments p INNER JOIN orders o ON o.id = p.order_id
       WHERE p.provider = ? AND p.provider_payment_id = ? LIMIT 1 FOR UPDATE`,
      [event.provider, event.providerPaymentId],
    );
    const payment = (paymentRows as PaymentRow[])[0];
    const [insertResult] = await connection.execute(
      `INSERT INTO payment_events (payment_id, provider, provider_event_id, event_type, payload_hash, processing_status, sanitized_payload)
       VALUES (?, ?, ?, ?, ?, 'received', ?)`,
      [payment?.id ?? null, event.provider, event.providerEventId, event.type, event.payloadHash, JSON.stringify(event.sanitizedPayload)],
    );
    const eventId = Number((insertResult as { insertId: number }).insertId);
    if (!payment) {
      await enqueuePaymentAttention(connection, { deduplicationKey: `payment-event:${eventId}:unknown`, entityType: "payment_event", entityId: eventId });
      return await finish(connection, eventId, "failed", "Unknown payment reference");
    }
    if (payment.amount_minor !== event.amountMinor || payment.currency !== event.currency) {
      await enqueuePaymentAttention(connection, { deduplicationKey: `payment-event:${eventId}:mismatch`, entityType: "payment", entityId: payment.id });
      return await finish(connection, eventId, "failed", "Amount or currency mismatch");
    }

    if (payment.status === "captured") {
      return await finish(connection, eventId, "ignored", event.status === "captured" ? "Payment already captured" : "Terminal captured payment cannot move backward");
    }
    if (["failed", "cancelled", "refunded"].includes(payment.status)) {
      return await finish(connection, eventId, "ignored", "Terminal payment cannot transition again");
    }

    if (event.status === "captured") {
      if (payment.order_status !== "pending_payment" || payment.payment_status !== "pending") return await finish(connection, eventId, "ignored", "Order is not awaiting payment");
      if (!payment.reservation_active) {
        await enqueuePaymentAttention(connection, { deduplicationKey: `payment-event:${eventId}:expired-reservation`, entityType: "payment", entityId: payment.id });
        return await finish(connection, eventId, "failed", "Reservation expired before capture");
      }
      await consumeReservedStock(connection, payment.order_id, payment.order_number);
      await connection.execute("UPDATE payments SET status = 'captured', updated_at = NOW() WHERE id = ?", [payment.id]);
      await connection.execute("UPDATE orders SET status = 'paid', payment_status = 'paid', reservation_expires_at = NULL, updated_at = NOW() WHERE id = ?", [payment.order_id]);
      await connection.execute("INSERT INTO order_status_events (order_id, from_status, to_status, actor_type, note) VALUES (?, 'pending_payment', 'paid', 'provider', ?)", [payment.order_id, `${event.provider} verified capture`]);
      await enqueueVerifiedSaleFanout(connection, { orderId: payment.order_id, paymentId: payment.id });
      return await finish(connection, eventId, "processed");
    }

    if (event.status === "failed" || event.status === "cancelled") {
      const nextOrderStatus = event.status === "failed" ? "payment_failed" : "cancelled";
      await releaseReservedStock(connection, payment.order_id, payment.order_number);
      await connection.execute("UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?", [event.status, payment.id]);
      await connection.execute("UPDATE orders SET status = ?, payment_status = ?, fulfilment_status = IF(? = 'cancelled', 'cancelled', fulfilment_status), reservation_released_at = NOW(), reservation_expires_at = NULL, updated_at = NOW() WHERE id = ?", [nextOrderStatus, event.status, event.status, payment.order_id]);
      await connection.execute("INSERT INTO order_status_events (order_id, from_status, to_status, actor_type, note) VALUES (?, ?, ?, 'provider', ?)", [payment.order_id, payment.order_status, nextOrderStatus, `${event.provider} verified ${event.status}`]);
      if (event.status === "failed") await enqueuePaymentAttention(connection, { deduplicationKey: `payment:${payment.id}:failed`, entityType: "payment", entityId: payment.id });
      return await finish(connection, eventId, "processed");
    }

    await connection.execute("UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?", [event.status, payment.id]);
    return await finish(connection, eventId, "processed");
  } catch (error) {
    await connection.rollback();
    if ((error as { errno?: number }).errno === 1062) return { outcome: "duplicate" };
    throw error;
  } finally {
    connection.release();
  }
}

async function finish(connection: PoolConnection, eventId: number, outcome: "processed" | "ignored" | "failed", reason?: string): Promise<ProcessEventResult> {
  await connection.execute("UPDATE payment_events SET processing_status = ?, processed_at = NOW(), sanitized_payload = JSON_SET(COALESCE(sanitized_payload, JSON_OBJECT()), '$.processingReason', ?) WHERE id = ?", [outcome, reason ?? null, eventId]);
  await connection.commit();
  return { outcome, reason };
}

async function consumeReservedStock(connection: PoolConnection, orderId: number, orderNumber: string) {
  const lines = await orderLines(connection, orderId);
  for (const line of lines) {
    const [result] = await connection.execute("UPDATE inventory SET on_hand = on_hand - ?, reserved = reserved - ?, updated_at = NOW() WHERE variant_id = ? AND on_hand >= ? AND reserved >= ?", [line.quantity, line.quantity, line.variant_id, line.quantity, line.quantity]);
    if (Number((result as { affectedRows: number }).affectedRows) !== 1) throw new Error(`Reserved stock invariant failed for variant ${line.variant_id}.`);
    await connection.execute("INSERT INTO inventory_movements (variant_id, order_id, quantity_delta, reason, note) VALUES (?, ?, ?, 'sale', ?)", [line.variant_id, orderId, -line.quantity, `Verified sale for ${orderNumber}`]);
  }
}

async function releaseReservedStock(connection: PoolConnection, orderId: number, orderNumber: string) {
  const lines = await orderLines(connection, orderId);
  for (const line of lines) {
    await connection.execute("UPDATE inventory SET reserved = GREATEST(0, reserved - ?), updated_at = NOW() WHERE variant_id = ?", [line.quantity, line.variant_id]);
    await connection.execute("INSERT INTO inventory_movements (variant_id, order_id, quantity_delta, reason, note) VALUES (?, ?, ?, 'release', ?)", [line.variant_id, orderId, -line.quantity, `Payment reservation released for ${orderNumber}`]);
  }
}

async function orderLines(connection: PoolConnection, orderId: number) {
  const [rows] = await connection.execute("SELECT variant_id, SUM(quantity) AS quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL GROUP BY variant_id ORDER BY variant_id FOR UPDATE", [orderId]);
  return rows as Array<{ variant_id: number; quantity: number }>;
}
