import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { databasePool } from "@/lib/db/connection";
import { POST } from "@/app/api/orders/route";
import { commerceRateLimitKey } from "@/features/commerce/rate-limit";

vi.mock("@/features/inventory/release-expired-reservations", () => ({
  releaseExpiredReservations: vi.fn().mockResolvedValue({ releasedOrders: 0 }),
}));

const marker = randomUUID();
const email = `commerce-${marker}@rusee.invalid`;
const ids = { product: 0, design: 0, colour: 0, size: 0, variant: 0 };
const originalPriceMinor = 12_345;
const rateLimitKeys = new Set<string>();

function checkout(publicId: string, quantity = 1) {
  const request = new Request("http://rusee.test/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.10", "user-agent": `rusee-commerce-test/${publicId}` },
    body: JSON.stringify({
      publicId,
      items: [{ variantId: ids.variant, quantity }],
      customer: { email, firstName: "Commerce", lastName: "Test", phone: "+306900000000" },
      shipping: { line1: "1 Test Street", line2: "", city: "Athens", region: "Attica", postalCode: "10558", countryCode: "GR" },
      billingDocument: { type: "receipt" },
      acceptedTerms: true,
    }),
  });
  rateLimitKeys.add(commerceRateLimitKey(request, "order"));
  return request;
}

beforeAll(async () => {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [product] = await connection.execute(
      "INSERT INTO products (slug,title,description,status) VALUES (?,?,'Integration test product','active')",
      [`commerce-${marker}`, "Commerce integrity kimono"],
    );
    ids.product = Number((product as { insertId: number }).insertId);
    const [design] = await connection.execute("INSERT INTO designs (product_id,slug,name,active) VALUES (?,?,'Integrity design',true)", [ids.product, `design-${marker}`]);
    ids.design = Number((design as { insertId: number }).insertId);
    const [colour] = await connection.execute("INSERT INTO colours (slug,name) VALUES (?,'Integrity colour')", [`colour-${marker}`]);
    ids.colour = Number((colour as { insertId: number }).insertId);
    const [size] = await connection.execute("INSERT INTO sizes (code,label) VALUES (?,'Integrity size')", [`T-${marker.slice(0, 12)}`]);
    ids.size = Number((size as { insertId: number }).insertId);
    const [variant] = await connection.execute(
      "INSERT INTO product_variants (product_id,design_id,colour_id,size_id,sku,price_minor,currency,active) VALUES (?,?,?,?,?,?,'EUR',true)",
      [ids.product, ids.design, ids.colour, ids.size, `TEST-${marker}`, originalPriceMinor],
    );
    ids.variant = Number((variant as { insertId: number }).insertId);
    await connection.execute("INSERT INTO inventory (variant_id,on_hand,reserved) VALUES (?,2,0)", [ids.variant]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

afterAll(async () => {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM inventory_movements WHERE variant_id=?", [ids.variant]);
    await connection.execute("DELETE FROM orders WHERE email=?", [email]);
    await connection.execute("DELETE FROM customers WHERE email=?", [email]);
    await connection.execute("DELETE FROM inventory WHERE variant_id=?", [ids.variant]);
    await connection.execute("DELETE FROM product_variants WHERE id=?", [ids.variant]);
    await connection.execute("DELETE FROM designs WHERE id=?", [ids.design]);
    await connection.execute("DELETE FROM products WHERE id=?", [ids.product]);
    await connection.execute("DELETE FROM colours WHERE id=?", [ids.colour]);
    await connection.execute("DELETE FROM sizes WHERE id=?", [ids.size]);
    if (rateLimitKeys.size) {
      const keys = [...rateLimitKeys];
      await connection.execute(`DELETE FROM commerce_rate_limits WHERE scope='order' AND rate_limit_key IN (${keys.map(() => "?").join(",")})`, keys);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await databasePool.end();
  }
});

describe("real-MySQL commerce integrity", () => {
  it("snapshots the authoritative price and reserves stock exactly once", async () => {
    const publicId = randomUUID();
    const response = await POST(checkout(publicId));
    expect(response.status).toBe(201);

    await databasePool.execute("UPDATE product_variants SET price_minor=? WHERE id=?", [originalPriceMinor + 5_000, ids.variant]);
    const [lines] = await databasePool.execute(
      "SELECT oi.unit_price_minor,oi.total_minor AS line_total_minor,o.subtotal_minor,o.total_minor AS order_total_minor FROM order_items oi INNER JOIN orders o ON o.id=oi.order_id WHERE o.public_id=?",
      [publicId],
    );
    expect((lines as Array<Record<string, number>>)[0]).toMatchObject({
      unit_price_minor: originalPriceMinor,
      line_total_minor: originalPriceMinor,
      subtotal_minor: originalPriceMinor,
      order_total_minor: originalPriceMinor,
    });

    const replay = await POST(checkout(publicId));
    expect(replay.status).toBe(200);
    const [stocks] = await databasePool.execute("SELECT reserved FROM inventory WHERE variant_id=?", [ids.variant]);
    expect((stocks as Array<{ reserved: number }>)[0].reserved).toBe(1);
  });

  it("rolls back an unavailable reservation without creating an order", async () => {
    const publicId = randomUUID();
    const response = await POST(checkout(publicId, 2));
    expect(response.status).toBe(409);
    const [orders] = await databasePool.execute("SELECT COUNT(*) count FROM orders WHERE public_id=?", [publicId]);
    expect(Number((orders as Array<{ count: number }>)[0].count)).toBe(0);
  });

  it("enforces order and inventory uniqueness constraints", async () => {
    const publicId = randomUUID();
    expect((await POST(checkout(publicId))).status).toBe(201);
    await expect(databasePool.execute(
      "INSERT INTO orders (public_id,order_number,email,currency,subtotal_minor,total_minor,status,payment_status,fulfilment_status) VALUES (?,?,'duplicate@test.invalid','EUR',1,1,'draft','unpaid','unfulfilled')",
      [publicId, `DUP-${marker.slice(0, 12)}`],
    )).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
    await expect(databasePool.execute("INSERT INTO inventory (variant_id,on_hand,reserved) VALUES (?,1,0)", [ids.variant]))
      .rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
    await expect(databasePool.execute(
      "INSERT INTO product_variants (product_id,design_id,colour_id,size_id,sku,price_minor,currency,active) VALUES (?,?,?,?,?,1,'EUR',true)",
      [ids.product, ids.design, ids.colour, ids.size, `OTHER-${marker}`],
    )).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
    await expect(databasePool.execute(
      "INSERT INTO product_variants (product_id,design_id,colour_id,size_id,sku,price_minor,currency,active) VALUES (?,?,?,?,?,1,'EUR',true)",
      [ids.product, ids.design, ids.colour, ids.size, `TEST-${marker}`],
    )).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
  });
});
