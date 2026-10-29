import "server-only";
import { databasePool } from "@/lib/db/connection";

export type EmailCommunicationGap = {
  order_public_id: string;
  order_number: string;
  expected_template: "payment_confirmation" | "fulfilment_update" | "return_status_update";
  source_created_at: Date;
};

export async function listEmailCommunicationGaps(
  options: { orderNumberPrefix?: string } = {},
) {
  const prefix = options.orderNumberPrefix?.trim().slice(0, 32);
  const scopeSql = prefix ? " AND o.order_number LIKE ?" : "";
  const scopeValues = prefix ? [`${prefix}%`] : [];
  const [rows] = await databasePool.execute(
    `SELECT o.public_id AS order_public_id, o.order_number,
       'payment_confirmation' AS expected_template, o.updated_at AS source_created_at
     FROM orders o
     WHERE o.payment_status IN ('paid','partially_refunded','refunded')
       AND NOT EXISTS (
         SELECT 1 FROM email_deliveries e
         WHERE e.order_id=o.id AND e.template='payment_confirmation'
       )${scopeSql}
     UNION ALL
     SELECT o.public_id AS order_public_id, o.order_number,
       'fulfilment_update' AS expected_template, s.shipped_at AS source_created_at
     FROM shipments s
     INNER JOIN orders o ON o.id=s.order_id
     WHERE NOT EXISTS (
       SELECT 1 FROM email_deliveries e
       WHERE e.order_id=o.id AND e.template='fulfilment_update'
     )${scopeSql}
     UNION ALL
     SELECT o.public_id AS order_public_id, o.order_number,
       'return_status_update' AS expected_template, r.updated_at AS source_created_at
     FROM return_requests r
     INNER JOIN orders o ON o.id=r.order_id
     WHERE r.status<>'pending'
       AND NOT EXISTS (
         SELECT 1 FROM email_deliveries e
         WHERE e.order_id=o.id
           AND e.template='return_status_update'
           AND e.idempotency_key=CONCAT('return-status:',r.public_id,':',r.status)
       )${scopeSql}
     ORDER BY source_created_at DESC
     LIMIT 100`,
    [...scopeValues, ...scopeValues, ...scopeValues],
  );
  return rows as EmailCommunicationGap[];
}
