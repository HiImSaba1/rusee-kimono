import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { databasePool } from "@/lib/db/connection";
import { processVerifiedPaymentEvent } from "@/features/payments/process-event";
import { FakePaymentProvider, signFakePayload } from "@/features/payments/fake-provider";
import type { VerifiedProviderEvent } from "@/features/payments/provider";

type Fixture = { orderId: number; paymentDbId: number; paymentId: string; publicId: string; variantId: number; originalOnHand: number; originalReserved: number; amountMinor: number };
let fixture: Fixture;
const originalAdminOrderEmail = process.env.ADMIN_ORDER_EMAIL;

async function createFixture(): Promise<Fixture> {
  const connection = await databasePool.getConnection();
  const publicId = randomUUID();
  const paymentId = `fake_${publicId}`;
  try {
    await connection.beginTransaction();
    const [variantRows] = await connection.execute(`SELECT v.id, v.sku, v.price_minor, i.on_hand, i.reserved
      FROM product_variants v INNER JOIN inventory i ON i.variant_id = v.id
      WHERE v.active = true AND i.on_hand - i.reserved >= 1 ORDER BY v.id LIMIT 1 FOR UPDATE`);
    const variant = (variantRows as Array<{ id: number; sku: string; price_minor: number; on_hand: number; reserved: number }>)[0];
    if (!variant) throw new Error("No stocked variant is available for payment integration tests.");
    const [orderResult] = await connection.execute(`INSERT INTO orders
      (public_id, order_number, email, currency, subtotal_minor, shipping_minor, tax_minor, discount_minor, total_minor, status, payment_status, fulfilment_status, reservation_expires_at)
      VALUES (?, ?, 'payments-test@rusee.invalid', 'EUR', ?, 0, 0, 0, ?, 'pending_payment', 'pending', 'unfulfilled', DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
      [publicId, `TEST-${publicId.slice(0, 12)}`, variant.price_minor, variant.price_minor]);
    const orderId = Number((orderResult as { insertId: number }).insertId);
    await connection.execute(`INSERT INTO order_items
      (order_id, variant_id, sku, product_title, design_name, colour_name, size_label, unit_price_minor, quantity, tax_minor, total_minor)
      VALUES (?, ?, ?, 'Payment test kimono', 'Test design', 'Test colour', 'Test size', ?, 1, 0, ?)`,
      [orderId, variant.id, variant.sku, variant.price_minor, variant.price_minor]);
    await connection.execute("UPDATE inventory SET reserved = reserved + 1 WHERE variant_id = ?", [variant.id]);
    const [paymentResult] = await connection.execute("INSERT INTO payments (order_id, provider, provider_payment_id, amount_minor, currency, status) VALUES (?, 'fake', ?, ?, 'EUR', 'pending')", [orderId, paymentId, variant.price_minor]);
    const paymentDbId = Number((paymentResult as { insertId: number }).insertId);
    await connection.commit();
    return { orderId, paymentDbId, paymentId, publicId, variantId: variant.id, originalOnHand: variant.on_hand, originalReserved: variant.reserved, amountMinor: variant.price_minor };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

function event(status: "captured" | "failed" | "cancelled", overrides: Partial<VerifiedProviderEvent> = {}): VerifiedProviderEvent {
  return { provider: "fake", providerEventId: `evt_${randomUUID()}`, providerPaymentId: fixture.paymentId, type: `payment.${status}`, status, amountMinor: fixture.amountMinor, currency: "EUR", occurredAt: new Date(), payloadHash: randomUUID().replaceAll("-", "").padEnd(64, "0"), sanitizedPayload: { status }, ...overrides };
}

async function cleanupFixture() {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM automation_jobs WHERE deduplication_key = ?", [`verified-sale:${fixture.orderId}:email-dispatch`]);
    await connection.execute("DELETE FROM admin_notifications WHERE (entity_type='order' AND entity_id=?) OR (entity_type='payment' AND entity_id=?)", [String(fixture.orderId), String(fixture.paymentDbId)]);
    await connection.execute("DELETE FROM email_deliveries WHERE order_id = ?", [fixture.orderId]);
    await connection.execute("DELETE pe FROM payment_events pe INNER JOIN payments p ON p.id = pe.payment_id WHERE p.order_id = ?", [fixture.orderId]);
    await connection.execute("DELETE FROM inventory_movements WHERE order_id = ?", [fixture.orderId]);
    await connection.execute("DELETE FROM payments WHERE order_id = ?", [fixture.orderId]);
    await connection.execute("DELETE FROM order_status_events WHERE order_id = ?", [fixture.orderId]);
    await connection.execute("DELETE FROM order_items WHERE order_id = ?", [fixture.orderId]);
    await connection.execute("DELETE FROM order_addresses WHERE order_id = ?", [fixture.orderId]);
    await connection.execute("DELETE FROM orders WHERE id = ?", [fixture.orderId]);
    await connection.execute("UPDATE inventory SET on_hand = ?, reserved = ? WHERE variant_id = ?", [fixture.originalOnHand, fixture.originalReserved, fixture.variantId]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

beforeEach(async () => { process.env.ADMIN_ORDER_EMAIL = "admin-sale-test@rusee.invalid"; fixture = await createFixture(); });
afterEach(cleanupFixture);
afterAll(async () => { if (originalAdminOrderEmail === undefined) delete process.env.ADMIN_ORDER_EMAIL; else process.env.ADMIN_ORDER_EMAIL = originalAdminOrderEmail; await databasePool.end(); });

describe("verified payment events", () => {
  it("captures exactly once when the same event is replayed", async () => {
    const capture = event("captured");
    expect(await processVerifiedPaymentEvent(capture)).toEqual({ outcome: "processed" });
    expect((await processVerifiedPaymentEvent(capture)).outcome).toBe("duplicate");
    expect((await processVerifiedPaymentEvent(event("captured"))).outcome).toBe("ignored");
    const [stocks] = await databasePool.execute("SELECT on_hand, reserved FROM inventory WHERE variant_id = ?", [fixture.variantId]);
    const stock = (stocks as Array<{ on_hand: number; reserved: number }>)[0];
    expect(stock).toEqual({ on_hand: fixture.originalOnHand - 1, reserved: fixture.originalReserved });
    const [movements] = await databasePool.execute("SELECT COUNT(*) AS count FROM inventory_movements WHERE order_id = ? AND reason = 'sale'", [fixture.orderId]);
    expect(Number((movements as Array<{ count: number }>)[0].count)).toBe(1);
    const [emails] = await databasePool.execute("SELECT template,COUNT(*) AS count FROM email_deliveries WHERE order_id = ? GROUP BY template", [fixture.orderId]);
    expect(Object.fromEntries((emails as Array<{ template: string; count: number }>).map(row => [row.template, Number(row.count)]))).toMatchObject({ payment_confirmation: 1, admin_new_order: 1 });
    const [sales] = await databasePool.execute("SELECT COUNT(*) AS count FROM admin_notifications WHERE deduplication_key=? AND kind='verified_sale'", [`sale:${fixture.orderId}`]);
    expect(Number((sales as Array<{ count: number }>)[0].count)).toBe(1);
    const [jobs] = await databasePool.execute("SELECT COUNT(*) AS count FROM automation_jobs WHERE deduplication_key=? AND kind='email_dispatch'", [`verified-sale:${fixture.orderId}:email-dispatch`]);
    expect(Number((jobs as Array<{ count: number }>)[0].count)).toBe(1);
  });

  it("does not create sale communication for a pending browser-created payment", async () => {
    const [emails] = await databasePool.execute("SELECT COUNT(*) AS count FROM email_deliveries WHERE order_id=?", [fixture.orderId]);
    const [sales] = await databasePool.execute("SELECT COUNT(*) AS count FROM admin_notifications WHERE entity_type='order' AND entity_id=?", [String(fixture.orderId)]);
    const [jobs] = await databasePool.execute("SELECT COUNT(*) AS count FROM automation_jobs WHERE deduplication_key=?", [`verified-sale:${fixture.orderId}:email-dispatch`]);
    expect(Number((emails as Array<{ count: number }>)[0].count)).toBe(0);
    expect(Number((sales as Array<{ count: number }>)[0].count)).toBe(0);
    expect(Number((jobs as Array<{ count: number }>)[0].count)).toBe(0);
  });

  it("persists but rejects an amount mismatch without changing stock", async () => {
    const result = await processVerifiedPaymentEvent(event("captured", { amountMinor: fixture.amountMinor + 1 }));
    expect(result.outcome).toBe("failed");
    const [orders] = await databasePool.execute("SELECT status, payment_status FROM orders WHERE id = ?", [fixture.orderId]);
    expect((orders as Array<{ status: string; payment_status: string }>)[0]).toEqual({ status: "pending_payment", payment_status: "pending" });
    const [attention] = await databasePool.execute("SELECT COUNT(*) AS count FROM admin_notifications WHERE entity_type='payment' AND entity_id=? AND kind='payment_attention'", [String(fixture.paymentDbId)]);
    expect(Number((attention as Array<{ count: number }>)[0].count)).toBe(1);
    const [sales] = await databasePool.execute("SELECT COUNT(*) AS count FROM admin_notifications WHERE entity_type='order' AND entity_id=? AND kind='verified_sale'", [String(fixture.orderId)]);
    expect(Number((sales as Array<{ count: number }>)[0].count)).toBe(0);
  });

  it("ignores a late capture after a verified failure", async () => {
    expect((await processVerifiedPaymentEvent(event("failed"))).outcome).toBe("processed");
    expect((await processVerifiedPaymentEvent(event("captured"))).outcome).toBe("ignored");
    const [stocks] = await databasePool.execute("SELECT on_hand, reserved FROM inventory WHERE variant_id = ?", [fixture.variantId]);
    expect((stocks as Array<{ on_hand: number; reserved: number }>)[0]).toEqual({ on_hand: fixture.originalOnHand, reserved: fixture.originalReserved });
    const [attention] = await databasePool.execute("SELECT COUNT(*) AS count FROM admin_notifications WHERE deduplication_key=?", [`payment:${fixture.paymentDbId}:failed`]);
    expect(Number((attention as Array<{ count: number }>)[0].count)).toBe(1);
    const [sales] = await databasePool.execute("SELECT COUNT(*) AS count FROM admin_notifications WHERE entity_type='order' AND entity_id=? AND kind='verified_sale'", [String(fixture.orderId)]);
    expect(Number((sales as Array<{ count: number }>)[0].count)).toBe(0);
  });

  it("rejects invalid signatures and malformed signed payloads", async () => {
    const provider = new FakePaymentProvider();
    await expect(provider.verifyWebhook(new Request("http://test", { method: "POST", headers: { "x-rusee-fake-signature": "invalid" }, body: "{}" }))).rejects.toMatchObject({ code: "invalid_signature" });
    const malformed = "{";
    await expect(provider.verifyWebhook(new Request("http://test", { method: "POST", headers: { "x-rusee-fake-signature": signFakePayload(malformed) }, body: malformed }))).rejects.toMatchObject({ code: "invalid_payload" });
  });
});
