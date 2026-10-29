import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { databasePool } from "@/lib/db/connection";
import { repairMissingEmailDelivery } from "@/features/email/operations";

const marker = randomUUID().replaceAll("-", "").slice(0, 14);
const paidPublicId = randomUUID();
const unpaidPublicId = randomUUID();
let adminId = 0;
let paidOrderId = 0;
let unpaidOrderId = 0;

beforeAll(async () => {
  const [admin] = await databasePool.execute<ResultSetHeader>(
    "INSERT INTO admin_users (username,password_hash,role,active) VALUES (?,?,'owner',true)",
    [`__mail_repair_${marker}`, "test-only-not-a-session"],
  );
  adminId = admin.insertId;
  const [paid] = await databasePool.execute<ResultSetHeader>(
    `INSERT INTO orders
      (public_id,order_number,email,subtotal_minor,total_minor,status,payment_status,fulfilment_status)
     VALUES (?,?,?,?,?,'paid','paid','unfulfilled')`,
    [paidPublicId, `REPAIR-${marker}-PAID`, `paid-${marker}@example.invalid`, 1000, 1000],
  );
  paidOrderId = paid.insertId;
  const [unpaid] = await databasePool.execute<ResultSetHeader>(
    `INSERT INTO orders
      (public_id,order_number,email,subtotal_minor,total_minor,status,payment_status,fulfilment_status)
     VALUES (?,?,?,?,?,'pending_payment','pending','unfulfilled')`,
    [unpaidPublicId, `REPAIR-${marker}-UNPAID`, `unpaid-${marker}@example.invalid`, 1000, 1000],
  );
  unpaidOrderId = unpaid.insertId;
});

afterAll(async () => {
  const [deliveryRows] = await databasePool.execute(
    "SELECT id FROM email_deliveries WHERE order_id IN (?,?)",
    [paidOrderId, unpaidOrderId],
  );
  const deliveryIds = (deliveryRows as Array<{ id:number }>).map((row) => row.id);
  if (deliveryIds.length) {
    await databasePool.execute(
      `DELETE FROM automation_jobs WHERE deduplication_key IN (${deliveryIds.map(() => "?").join(",")})`,
      deliveryIds.map((id) => `email-reconciliation:${id}`),
    );
  }
  await databasePool.execute("DELETE FROM admin_audit_events WHERE admin_user_id=?", [adminId]);
  await databasePool.execute("DELETE FROM email_deliveries WHERE order_id IN (?,?)", [paidOrderId, unpaidOrderId]);
  await databasePool.execute("DELETE FROM orders WHERE id IN (?,?)", [paidOrderId, unpaidOrderId]);
  await databasePool.execute("DELETE FROM admin_users WHERE id=?", [adminId]);
  await databasePool.end();
});

describe("guarded email reconciliation repair", () => {
  it("creates one queued delivery, one worker job and one metadata-only audit event", async () => {
    const first = await repairMissingEmailDelivery({
      adminId,
      orderPublicId: paidPublicId,
      expectedTemplate: "payment_confirmation",
    });
    expect(first).toMatchObject({ repaired: true, deliveryId: expect.any(Number) });
    await expect(repairMissingEmailDelivery({
      adminId,
      orderPublicId: paidPublicId,
      expectedTemplate: "payment_confirmation",
    })).resolves.toEqual({ repaired: false });

    const [deliveries] = await databasePool.execute(
      "SELECT id,status,attempt_count,idempotency_key FROM email_deliveries WHERE order_id=?",
      [paidOrderId],
    );
    expect(deliveries).toHaveLength(1);
    expect((deliveries as Array<Record<string, unknown>>)[0]).toMatchObject({
      status: "queued",
      attempt_count: 0,
      idempotency_key: `payment-confirmation:${paidOrderId}`,
    });

    const deliveryId = Number((deliveries as Array<{ id:number }>)[0].id);
    const [jobs] = await databasePool.execute(
      "SELECT kind,status FROM automation_jobs WHERE deduplication_key=?",
      [`email-reconciliation:${deliveryId}`],
    );
    expect(jobs).toHaveLength(1);
    expect((jobs as Array<Record<string, unknown>>)[0]).toMatchObject({ kind: "email_dispatch", status: "queued" });
    const [audits] = await databasePool.execute(
      "SELECT action,metadata FROM admin_audit_events WHERE admin_user_id=? AND entity_id=?",
      [adminId, String(deliveryId)],
    );
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits)).not.toMatch(/@example\.invalid|password|authorization|bearer/i);
  });

  it("rejects an order without a verified paid state", async () => {
    await expect(repairMissingEmailDelivery({
      adminId,
      orderPublicId: unpaidPublicId,
      expectedTemplate: "payment_confirmation",
    })).rejects.toThrow(/not eligible/);
  });
});
