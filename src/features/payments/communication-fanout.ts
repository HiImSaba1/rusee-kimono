import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolConnection } from "mysql2/promise";
import { enqueuePaymentEmails } from "@/features/email/queue";

export async function enqueueVerifiedSaleFanout(connection: PoolConnection, input: { orderId: number; paymentId: number }) {
  await enqueuePaymentEmails(connection, input.orderId);
  await connection.execute(
    `INSERT IGNORE INTO admin_notifications
      (deduplication_key,kind,severity,audience,entity_type,entity_id,href)
     SELECT ?, 'verified_sale', 'information', 'commerce', 'order', CAST(id AS CHAR), CONCAT('/admin/orders/',public_id)
     FROM orders WHERE id=? AND status='paid' AND payment_status='paid'`,
    [`sale:${input.orderId}`, input.orderId],
  );
  await connection.execute(
    `INSERT IGNORE INTO automation_jobs
      (public_id,deduplication_key,kind,status,payload,run_at,max_attempts)
     VALUES (?,?,'email_dispatch','queued',JSON_OBJECT('orderId',?,'paymentId',?),NOW(),5)`,
    [randomUUID(), `verified-sale:${input.orderId}:email-dispatch`, input.orderId, input.paymentId],
  );
}

export async function enqueuePaymentAttention(connection: PoolConnection, input: { deduplicationKey: string; entityType: "payment" | "payment_event"; entityId: number }) {
  await connection.execute(
    `INSERT IGNORE INTO admin_notifications
      (deduplication_key,kind,severity,audience,entity_type,entity_id,href)
     VALUES (?,'payment_attention','critical','owner_manager',?,?,'/admin/reconciliation')`,
    [input.deduplicationKey.slice(0, 190), input.entityType, String(input.entityId)],
  );
}
