import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { databasePool } from "@/lib/db/connection";
import { listEmailCommunicationGaps } from "@/features/email/reconciliation";

const marker = randomUUID().replaceAll("-", "").slice(0, 12);
const orderPrefix = `MAIL-${marker}`;
const orderIds: number[] = [];
const returnPublicId = randomUUID();

beforeAll(async () => {
  for (const [suffix, status, fulfilment] of [
    ["PAID", "paid", "unfulfilled"],
    ["SHIP", "shipped", "shipped"],
    ["RETURN", "completed", "delivered"],
  ] as const) {
    const [result] = await databasePool.execute<ResultSetHeader>(
      `INSERT INTO orders
        (public_id,order_number,email,subtotal_minor,total_minor,status,payment_status,fulfilment_status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [randomUUID(), `${orderPrefix}-${suffix}`, `mail-${marker}@example.invalid`, 1000, 1000, status, "paid", fulfilment],
    );
    orderIds.push(result.insertId);
  }
  await databasePool.execute(
    "INSERT INTO shipments (order_id,carrier_name,tracking_code) VALUES (?,'Test courier',?)",
    [orderIds[1], `TRACK-${marker}`],
  );
  await databasePool.execute(
    "INSERT INTO return_requests (public_id,order_id,reason,customer_note,status) VALUES (?,?,'other','Integration test return','approved')",
    [returnPublicId, orderIds[2]],
  );
  await databasePool.execute(
    `INSERT INTO email_deliveries (order_id,template,recipient,idempotency_key)
     VALUES (?,'payment_confirmation',?,?),(?,'payment_confirmation',?,?)`,
    [
      orderIds[1], `mail-${marker}@example.invalid`, `test:mail-reconcile:${marker}:ship-payment`,
      orderIds[2], `mail-${marker}@example.invalid`, `test:mail-reconcile:${marker}:return-payment`,
    ],
  );
});

afterAll(async () => {
  await databasePool.execute(
    "DELETE FROM email_deliveries WHERE order_id IN (?,?,?)",
    orderIds,
  );
  await databasePool.execute("DELETE FROM orders WHERE id IN (?,?,?)", orderIds);
  await databasePool.end();
});

describe("transactional email reconciliation", () => {
  it("finds missing payment, shipment and return communication", async () => {
    const gaps = await listEmailCommunicationGaps({ orderNumberPrefix: orderPrefix });
    expect(gaps.map((gap) => gap.expected_template).sort()).toEqual([
      "fulfilment_update",
      "payment_confirmation",
      "return_status_update",
    ]);
  });

  it("reports no gap after the expected records exist", async () => {
    await databasePool.execute(
      `INSERT INTO email_deliveries (order_id,template,recipient,idempotency_key)
       VALUES
        (?,'payment_confirmation',?,?),
        (?,'fulfilment_update',?,?),
        (?,'return_status_update',?,?)`,
      [
        orderIds[0], `mail-${marker}@example.invalid`, `payment-confirmation:${orderIds[0]}`,
        orderIds[1], `mail-${marker}@example.invalid`, `fulfilment:${orderIds[1]}:shipped`,
        orderIds[2], `mail-${marker}@example.invalid`, `return-status:${returnPublicId}:approved`,
      ],
    );
    await expect(
      listEmailCommunicationGaps({ orderNumberPrefix: orderPrefix }),
    ).resolves.toEqual([]);
  });
});
