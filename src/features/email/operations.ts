import "server-only";
import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";
import { AUTOMATION_MAX_ATTEMPTS } from "@/features/automation/policy";

export async function queueManualEmailDispatch(input:{adminId:number;bucket?:number}){const bucket=input.bucket??Math.floor(Date.now()/60000);const deduplicationKey=`manual-email-dispatch:${bucket}`;const connection=await databasePool.getConnection();try{await connection.beginTransaction();const [job]=await connection.execute<ResultSetHeader>("INSERT IGNORE INTO automation_jobs (public_id,deduplication_key,kind,payload,run_at,max_attempts) VALUES (?,?,\'email_dispatch\',?,NOW(),?)",[randomUUID(),deduplicationKey,JSON.stringify({manual:true}),AUTOMATION_MAX_ATTEMPTS]);if(job.affectedRows)await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'email.dispatch_queued','automation_job',?,?)",[input.adminId,deduplicationKey,JSON.stringify({bucket})]);await connection.commit();return {queued:job.affectedRows===1};}catch(error){await connection.rollback();throw error;}finally{connection.release();}}

export async function queueEmailDeliveryRetry(input:{adminId:number;deliveryId:number}){const connection=await databasePool.getConnection();try{await connection.beginTransaction();const [rows]=await connection.execute("SELECT status,attempt_count FROM email_deliveries WHERE id=? LIMIT 1 FOR UPDATE",[input.deliveryId]);const delivery=(rows as Array<{status:string;attempt_count:number}>)[0];if(!delivery||delivery.status!=="failed"||delivery.attempt_count>=5)throw new Error("This delivery is not eligible for retry.");const deduplicationKey=`email-retry:${input.deliveryId}:attempt:${delivery.attempt_count}`;await connection.execute("UPDATE email_deliveries SET status='queued',last_error=NULL,updated_at=NOW() WHERE id=?",[input.deliveryId]);await connection.execute("INSERT IGNORE INTO automation_jobs (public_id,deduplication_key,kind,payload,run_at,max_attempts) VALUES (?,?,\'email_dispatch\',?,NOW(),?)",[randomUUID(),deduplicationKey,JSON.stringify({retry:true,deliveryId:input.deliveryId}),AUTOMATION_MAX_ATTEMPTS]);await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'email.retry_queued','email_delivery',?,?)",[input.adminId,String(input.deliveryId),JSON.stringify({previousAttempts:delivery.attempt_count,deduplicationKey})]);await connection.commit();return {queued:true,previousAttempts:delivery.attempt_count};}catch(error){await connection.rollback();throw error;}finally{connection.release();}}

export type RepairableEmailTemplate = "payment_confirmation" | "fulfilment_update" | "return_status_update";

export async function repairMissingEmailDelivery(input: {
  adminId: number;
  orderPublicId: string;
  expectedTemplate: RepairableEmailTemplate;
}) {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    let orderId: number;
    let recipient: string;
    let idempotencyKey: string;
    let context: Record<string, unknown> | null = null;

    if (input.expectedTemplate === "payment_confirmation") {
      const [rows] = await connection.execute(
        `SELECT id,email,payment_status FROM orders
         WHERE public_id=? LIMIT 1 FOR UPDATE`,
        [input.orderPublicId],
      );
      const order = (rows as Array<{ id:number; email:string; payment_status:string }>)[0];
      if (!order || !["paid", "partially_refunded", "refunded"].includes(order.payment_status)) {
        throw new Error("The order is not eligible for payment-confirmation repair.");
      }
      orderId = order.id;
      recipient = order.email;
      idempotencyKey = `payment-confirmation:${order.id}`;
    } else if (input.expectedTemplate === "fulfilment_update") {
      const [rows] = await connection.execute(
        `SELECT o.id,o.email,o.fulfilment_status,s.carrier_name,s.tracking_code,s.tracking_url
         FROM orders o INNER JOIN shipments s ON s.order_id=o.id
         WHERE o.public_id=? LIMIT 1 FOR UPDATE`,
        [input.orderPublicId],
      );
      const order = (rows as Array<{ id:number; email:string; fulfilment_status:string; carrier_name:string; tracking_code:string; tracking_url:string|null }>)[0];
      if (!order) throw new Error("The order has no shipment eligible for email repair.");
      orderId = order.id;
      recipient = order.email;
      idempotencyKey = `fulfilment:${order.id}:${order.fulfilment_status}`;
      context = {
        fulfilmentStatus: order.fulfilment_status,
        shipment: {
          carrierName: order.carrier_name,
          trackingCode: order.tracking_code,
          trackingUrl: order.tracking_url,
        },
      };
    } else {
      const [rows] = await connection.execute(
        `SELECT o.id,o.email,r.public_id AS return_public_id,r.status
         FROM orders o INNER JOIN return_requests r ON r.order_id=o.id
         WHERE o.public_id=? AND r.status<>'pending' LIMIT 1 FOR UPDATE`,
        [input.orderPublicId],
      );
      const order = (rows as Array<{ id:number; email:string; return_public_id:string; status:string }>)[0];
      if (!order) throw new Error("The order has no reviewed return eligible for email repair.");
      orderId = order.id;
      recipient = order.email;
      idempotencyKey = `return-status:${order.return_public_id}:${order.status}`;
      context = { returnStatus: order.status };
    }

    const [delivery] = await connection.execute<ResultSetHeader>(
      `INSERT IGNORE INTO email_deliveries
        (order_id,template,recipient,idempotency_key,context)
       VALUES (?,?,?,?,?)`,
      [orderId, input.expectedTemplate, recipient, idempotencyKey, context ? JSON.stringify(context) : null],
    );
    if (!delivery.affectedRows) {
      await connection.commit();
      return { repaired: false };
    }

    const deliveryId = delivery.insertId;
    const jobKey = `email-reconciliation:${deliveryId}`;
    await connection.execute(
      `INSERT IGNORE INTO automation_jobs
        (public_id,deduplication_key,kind,payload,run_at,max_attempts)
       VALUES (?,?,'email_dispatch',?,NOW(),?)`,
      [randomUUID(), jobKey, JSON.stringify({ repairedDeliveryId: deliveryId }), AUTOMATION_MAX_ATTEMPTS],
    );
    await connection.execute(
      `INSERT INTO admin_audit_events
        (admin_user_id,action,entity_type,entity_id,metadata)
       VALUES (?,'email.missing_delivery_repaired','email_delivery',?,?)`,
      [input.adminId, String(deliveryId), JSON.stringify({
        orderId,
        expectedTemplate: input.expectedTemplate,
        idempotencyKey,
        jobKey,
      })],
    );
    await connection.commit();
    return { repaired: true, deliveryId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
