import { NextResponse } from "next/server";
import { z } from "zod";
import { databasePool } from "@/lib/db/connection";
import { releaseExpiredReservations } from "@/features/inventory/release-expired-reservations";
import { logger } from "@/lib/observability/logger";
import { commerceRateLimitKey, commerceRateLimitMessage, consumeCommerceRateLimit } from "@/features/commerce/rate-limit";

const orderInput = z.object({
  publicId: z.string().uuid(),
  items: z.array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) })).min(1).max(20),
  customer: z.object({
    email: z.string().email().max(254),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(6).max(40),
  }),
  shipping: z.object({
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().min(2).max(120),
    region: z.string().trim().max(120).optional().default(""),
    postalCode: z.string().trim().min(3).max(24),
    countryCode: z.literal("GR"),
  }),
  billingDocument: z.discriminatedUnion("type", [
    z.object({ type: z.literal("receipt") }),
    z.object({
      type: z.literal("invoice"),
      company: z.string().trim().min(2).max(160),
      vatNumber: z.string().trim().regex(/^\d{9}$/, "A Greek VAT number must contain 9 digits."),
      taxOffice: z.string().trim().min(2).max(120),
      businessActivity: z.string().trim().min(2).max(180),
      line1: z.string().trim().min(3).max(200),
      line2: z.string().trim().max(200).optional().default(""),
      city: z.string().trim().min(2).max(120),
      region: z.string().trim().max(120).optional().default(""),
      postalCode: z.string().trim().min(3).max(24),
      countryCode: z.literal("GR"),
    }),
  ]),
  acceptedTerms: z.literal(true),
});

type VariantRow = {
  id: number; sku: string; price_minor: number; currency: string; product_title: string;
  design_name: string; colour_name: string; size_label: string; on_hand: number; reserved: number;
};

export async function POST(request: Request) {
  const parsed = orderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Please review your checkout details." }, { status: 400 });
  const input = parsed.data;
  const [existingBeforeLimit] = await databasePool.execute("SELECT order_number,status FROM orders WHERE public_id=? LIMIT 1", [input.publicId]);
  const existingOrder = (existingBeforeLimit as Array<{ order_number: string; status: string }>)[0];
  if (existingOrder) return NextResponse.json({ publicId: input.publicId, orderNumber: existingOrder.order_number, status: existingOrder.status });
  try {
    const limit = await consumeCommerceRateLimit("order", commerceRateLimitKey(request, "order"), 6);
    if (!limit.allowed) return NextResponse.json({ message: commerceRateLimitMessage(request), code: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  } catch (error) {
    logger.error("order.rate_limit_failed", { error });
    return NextResponse.json({ message: "Checkout is temporarily unavailable." }, { status: 503 });
  }
  await releaseExpiredReservations();
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [existingRows] = await connection.execute("SELECT order_number FROM orders WHERE public_id = ? LIMIT 1", [input.publicId]);
    const existing = existingRows as Array<{ order_number: string }>;
    if (existing[0]) {
      await connection.commit();
      return NextResponse.json({ publicId: input.publicId, orderNumber: existing[0].order_number, status: "pending_payment" });
    }

    const variantIds = [...new Set(input.items.map((item) => item.variantId))];
    const placeholders = variantIds.map(() => "?").join(",");
    const [variantResult] = await connection.execute(
      `SELECT v.id, v.sku, v.price_minor, v.currency, p.title AS product_title,
        d.name AS design_name, c.name AS colour_name, s.label AS size_label,
        i.on_hand, i.reserved
       FROM product_variants v
       INNER JOIN products p ON p.id = v.product_id AND p.status = 'active'
       INNER JOIN designs d ON d.id = v.design_id AND d.active = true
       INNER JOIN colours c ON c.id = v.colour_id
       INNER JOIN sizes s ON s.id = v.size_id
       INNER JOIN inventory i ON i.variant_id = v.id
       WHERE v.active = true AND v.id IN (${placeholders})
       FOR UPDATE`,
      variantIds,
    );
    const variants = variantResult as VariantRow[];
    if (variants.length !== variantIds.length) throw new CheckoutError("One of your selections is no longer available.", 409);

    let subtotalMinor = 0;
    const lines = input.items.map((item) => {
      const variant = variants.find((entry) => entry.id === item.variantId);
      if (!variant) throw new CheckoutError("One of your selections is no longer available.", 409);
      const available = variant.on_hand - variant.reserved;
      if (available < item.quantity) throw new CheckoutError(available > 0 ? `Only ${available} units of ${variant.sku} remain.` : `${variant.sku} is out of stock.`, 409);
      const totalMinor = variant.price_minor * item.quantity;
      subtotalMinor += totalMinor;
      return { ...variant, quantity: item.quantity, totalMinor };
    });
    if (lines.some((line) => line.currency !== "EUR")) throw new CheckoutError("Mixed currencies are not supported.", 400);

    const shippingMinor = 0;
    const discountMinor = 0;
    const taxMinor = Math.round(subtotalMinor * 24 / 124);
    const totalMinor = subtotalMinor + shippingMinor - discountMinor;
    const orderNumber = `RUS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${input.publicId.slice(0, 6).toUpperCase()}`;

    const [customerResult] = await connection.execute(
      `INSERT INTO customers (email, first_name, last_name, phone) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), first_name=VALUES(first_name), last_name=VALUES(last_name), phone=VALUES(phone)`,
      [input.customer.email.toLowerCase(), input.customer.firstName, input.customer.lastName, input.customer.phone],
    );
    const customerId = Number((customerResult as { insertId: number }).insertId);
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (public_id, order_number, customer_id, email, currency, subtotal_minor, shipping_minor, tax_minor, discount_minor, total_minor, status, payment_status, fulfilment_status, reservation_expires_at)
       VALUES (?, ?, ?, ?, 'EUR', ?, ?, ?, ?, ?, 'pending_payment', 'pending', 'unfulfilled', DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
      [input.publicId, orderNumber, customerId, input.customer.email.toLowerCase(), subtotalMinor, shippingMinor, taxMinor, discountMinor, totalMinor],
    );
    const orderId = Number((orderResult as { insertId: number }).insertId);

    const invoice = input.billingDocument.type === "invoice" ? input.billingDocument : null;
    const billing = invoice ?? input.shipping;
    await connection.execute(
      `INSERT INTO order_addresses (order_id, type, first_name, last_name, company, document_type, vat_number, tax_office, business_activity, line1, line2, city, region, postal_code, country_code, phone)
       VALUES (?, 'shipping', ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, 'GR', ?),
              (?, 'billing', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GR', ?)`,
      [
        orderId, input.customer.firstName, input.customer.lastName, input.shipping.line1, input.shipping.line2 || null, input.shipping.city, input.shipping.region || null, input.shipping.postalCode, input.customer.phone,
        orderId, input.customer.firstName, input.customer.lastName, invoice?.company ?? null, input.billingDocument.type, invoice?.vatNumber ?? null, invoice?.taxOffice ?? null, invoice?.businessActivity ?? null, billing.line1, billing.line2 || null, billing.city, billing.region || null, billing.postalCode, input.customer.phone,
      ],
    );

    for (const line of lines) {
      await connection.execute(
        `INSERT INTO order_items (order_id, variant_id, sku, product_title, design_name, colour_name, size_label, unit_price_minor, quantity, tax_minor, total_minor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, line.id, line.sku, line.product_title, line.design_name, line.colour_name, line.size_label, line.price_minor, line.quantity, Math.round(line.totalMinor * 24 / 124), line.totalMinor],
      );
      await connection.execute("UPDATE inventory SET reserved = reserved + ? WHERE variant_id = ?", [line.quantity, line.id]);
      await connection.execute("INSERT INTO inventory_movements (variant_id, order_id, quantity_delta, reason, note) VALUES (?, ?, ?, 'reservation', ?)", [line.id, orderId, line.quantity, `Reserved for ${orderNumber}`]);
    }
    await connection.execute("INSERT INTO order_status_events (order_id, from_status, to_status, actor_type, note) VALUES (?, 'draft', 'pending_payment', 'customer', 'Guest checkout created')", [orderId]);
    await connection.commit();
    return NextResponse.json({ publicId: input.publicId, orderNumber, status: "pending_payment", totals: { subtotalMinor, shippingMinor, taxMinor, totalMinor, currency: "EUR" } }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    if (error instanceof CheckoutError) return NextResponse.json({ message: error.message }, { status: error.status });
    logger.error("order.creation_failed", { error });
    return NextResponse.json({ message: "We could not create your order. Please try again." }, { status: 500 });
  } finally {
    connection.release();
  }
}

class CheckoutError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
