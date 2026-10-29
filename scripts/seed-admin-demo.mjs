import mysql from "mysql2/promise";
import { createHash } from "node:crypto";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const verifyOnly = process.argv.includes("--verify");
const databaseUrl = new URL(process.env.DATABASE_URL);
if (process.env.NODE_ENV === "production" || !["127.0.0.1", "localhost"].includes(databaseUrl.hostname) || databaseUrl.pathname !== "/next_kimono") {
  throw new Error("Admin demo data is restricted to the local next_kimono database.");
}
const connection = await mysql.createConnection(process.env.DATABASE_URL);

const scenarioTemplates = [
  ["Pending payment", "pending_payment", "pending", "unfulfilled", "pending"],
  ["Paid, awaiting fulfilment", "paid", "paid", "unfulfilled", "captured"],
  ["Processing", "processing", "paid", "processing", "captured"],
  ["Shipped", "shipped", "paid", "shipped", "captured"],
  ["Delivered", "completed", "paid", "delivered", "captured"],
  ["Cancelled", "cancelled", "cancelled", "cancelled", "cancelled"],
  ["Payment failed", "payment_failed", "failed", "unfulfilled", "failed"],
  ["Partially refunded", "partially_refunded", "partially_refunded", "delivered", "partially_refunded"],
  ["Returned and refunded", "refunded", "refunded", "returned", "refunded"],
  ["Return received, refund pending", "completed", "paid", "returned", "captured"],
];
const scenarios = Array.from({ length: 20 }, (_, index) => {
  const scenario = scenarioTemplates[index % scenarioTemplates.length];
  return [`${scenario[0]} · Set ${index < 10 ? "A" : "B"}`, ...scenario.slice(1)];
});

async function verify() {
  const [countResult, statusResult, paymentResult, refundResult, eventResult, emailResult, inventoryResult] = await Promise.all([
    connection.execute("SELECT COUNT(*) count FROM orders WHERE order_number LIKE 'DEMO-%'"),
    connection.execute("SELECT COUNT(DISTINCT status) order_statuses, COUNT(DISTINCT payment_status) payment_statuses, COUNT(DISTINCT fulfilment_status) fulfilment_statuses FROM orders WHERE order_number LIKE 'DEMO-%'"),
    connection.execute("SELECT COUNT(*) count FROM payments p INNER JOIN orders o ON o.id=p.order_id WHERE o.order_number LIKE 'DEMO-%'"),
    connection.execute("SELECT COUNT(*) count FROM refunds r INNER JOIN payments p ON p.id=r.payment_id WHERE p.provider_payment_id LIKE 'demo-%'"),
    connection.execute("SELECT COUNT(*) count FROM order_status_events e INNER JOIN orders o ON o.id=e.order_id WHERE o.order_number LIKE 'DEMO-%'"),
    connection.execute("SELECT COUNT(*) count FROM email_deliveries WHERE idempotency_key LIKE 'demo:%'"),
    connection.execute(`SELECT COUNT(*) count FROM product_variants v
      INNER JOIN products p ON p.id=v.product_id
      LEFT JOIN inventory i ON i.variant_id=v.id
      WHERE v.active=true AND p.status='active' AND (i.id IS NULL OR i.on_hand-i.reserved<10)`),
  ]);
  const count = countResult[0][0];
  const statuses = statusResult[0][0];
  const payments = paymentResult[0][0];
  const refunds = refundResult[0][0];
  const events = eventResult[0][0];
  const emails = emailResult[0][0];
  const inventoryShortfalls = inventoryResult[0][0];
  const summary = { orders: Number(count.count), orderStatuses: Number(statuses.order_statuses), paymentStatuses: Number(statuses.payment_statuses), fulfilmentStatuses: Number(statuses.fulfilment_statuses), payments: Number(payments.count), refunds: Number(refunds.count), statusEvents: Number(events.count), emails: Number(emails.count), activeVariantsBelowTenAvailable: Number(inventoryShortfalls.count) };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.orders !== 20 || summary.payments !== 20 || summary.refunds < 6 || summary.statusEvents < 40 || summary.emails !== 20 || summary.orderStatuses < 8 || summary.paymentStatuses < 6 || summary.fulfilmentStatuses < 5 || summary.activeVariantsBelowTenAvailable !== 0) throw new Error("Demo dataset is incomplete.");
}

if (verifyOnly) {
  try { await verify(); } finally { await connection.end(); }
  process.exit(0);
}

try {
  await connection.beginTransaction();
  await connection.execute(`INSERT IGNORE INTO inventory (variant_id,on_hand,reserved)
    SELECT v.id,10,0 FROM product_variants v INNER JOIN products p ON p.id=v.product_id
    WHERE v.active=true AND p.status='active'`);
  await connection.execute(`UPDATE inventory i
    INNER JOIN product_variants v ON v.id=i.variant_id
    INNER JOIN products p ON p.id=v.product_id
    SET i.on_hand=GREATEST(i.on_hand,i.reserved+10)
    WHERE v.active=true AND p.status='active'`);
  const [variants] = await connection.execute(`SELECT v.id,v.sku,v.price_minor,v.currency,p.title product_title,d.name design_name,c.name colour_name,s.label size_label
    FROM product_variants v INNER JOIN products p ON p.id=v.product_id INNER JOIN designs d ON d.id=v.design_id
    INNER JOIN colours c ON c.id=v.colour_id INNER JOIN sizes s ON s.id=v.size_id
    WHERE v.active=true AND p.status='active' ORDER BY d.sort_order,s.sort_order,v.id LIMIT 10`);
  if (!variants.length) throw new Error("Create at least one active sellable variant before seeding demos.");

  await connection.execute("DELETE r FROM refunds r INNER JOIN payments p ON p.id=r.payment_id WHERE p.provider_payment_id LIKE 'demo-%'");
  await connection.execute("DELETE e FROM payment_events e WHERE e.provider_event_id LIKE 'demo-%'");
  await connection.execute("DELETE FROM email_deliveries WHERE idempotency_key LIKE 'demo:%'");
  await connection.execute("DELETE p FROM payments p INNER JOIN orders o ON o.id=p.order_id WHERE o.order_number LIKE 'DEMO-%'");
  await connection.execute("DELETE FROM orders WHERE order_number LIKE 'DEMO-%'");
  await connection.execute("DELETE FROM customers WHERE email LIKE 'demo-%@rusee.invalid'");

  for (let index = 0; index < scenarios.length; index++) {
    const [label, orderStatus, paymentStatus, fulfilmentStatus, providerStatus] = scenarios[index];
    const number = index + 1;
    const variant = variants[index % variants.length];
    const email = `demo-${String(number).padStart(2, "0")}@rusee.invalid`;
    const publicId = `00000000-0000-4000-8000-${String(100 + number).padStart(12, "0")}`;
    const orderNumber = `DEMO-${String(number).padStart(3, "0")}`;
    const quantity = number % 4 === 0 ? 2 : 1;
    const subtotal = Number(variant.price_minor) * quantity;
    const tax = Math.round(subtotal * 24 / 124);
    const discount = number === 5 ? 1500 : 0;
    const total = subtotal - discount;
    const createdOffset = 21 - number;

    const [customer] = await connection.execute("INSERT INTO customers (email,first_name,last_name,phone) VALUES (?,'Demo',?, '+306900000000')", [email, label.slice(0, 100)]);
    const customerId = Number(customer.insertId);
    const [order] = await connection.execute(`INSERT INTO orders
      (public_id,order_number,customer_id,email,currency,subtotal_minor,shipping_minor,tax_minor,discount_minor,total_minor,status,payment_status,fulfilment_status,reservation_expires_at,reservation_released_at,created_at,updated_at)
      VALUES (?,?,?,?,'EUR',?,0,?,?,?, ?,?,?, IF(?='pending_payment',DATE_ADD(NOW(),INTERVAL 30 MINUTE),NULL), IF(? IN ('cancelled','payment_failed'),NOW(),NULL),DATE_SUB(NOW(),INTERVAL ? DAY),NOW())`,
      [publicId, orderNumber, customerId, email, subtotal, tax, discount, total, orderStatus, paymentStatus, fulfilmentStatus, orderStatus, orderStatus, createdOffset]);
    const orderId = Number(order.insertId);
    await connection.execute(`INSERT INTO order_items (order_id,variant_id,sku,product_title,design_name,colour_name,size_label,unit_price_minor,quantity,tax_minor,total_minor)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [orderId, variant.id, variant.sku, variant.product_title, variant.design_name, variant.colour_name, variant.size_label, variant.price_minor, quantity, tax, subtotal]);
    for (const type of ["shipping", "billing"]) await connection.execute(`INSERT INTO order_addresses
      (order_id,type,first_name,last_name,line1,city,region,postal_code,country_code,phone) VALUES (?,?, 'Demo', ?, '10 Ermou Street','Athens','Attica','10563','GR','+306900000000')`, [orderId, type, label.slice(0, 100)]);

    const history = orderStatus === "pending_payment" ? ["pending_payment"] : orderStatus === "payment_failed" ? ["pending_payment", "payment_failed"] : orderStatus === "cancelled" ? ["pending_payment", "cancelled"] : ["pending_payment", "paid", ...(orderStatus === "processing" ? ["processing"] : orderStatus === "shipped" ? ["processing", "shipped"] : ["processing", "shipped", "completed"] )];
    let previous = null;
    for (const state of history) {
      await connection.execute("INSERT INTO order_status_events (order_id,from_status,to_status,actor_type,note,created_at) VALUES (?,?,?,?,?,DATE_SUB(NOW(),INTERVAL ? HOUR))", [orderId, previous, state, state === "paid" ? "provider" : "system", `DEMO: ${label}`, Math.max(0, history.length - history.indexOf(state))]);
      previous = state;
    }
    if (previous !== orderStatus) {
      await connection.execute("INSERT INTO order_status_events (order_id,from_status,to_status,actor_type,note) VALUES (?,?,?,'admin',?)", [orderId, previous, orderStatus, `DEMO: ${label}`]);
      previous = orderStatus;
    }
    if (fulfilmentStatus === "returned") await connection.execute("INSERT INTO order_status_events (order_id,from_status,to_status,actor_type,note) VALUES (?,?, 'returned','admin','DEMO: returned product received and inspected')", [orderId, previous]);

    const providerPaymentId = `demo-payment-${String(number).padStart(3, "0")}`;
    const [payment] = await connection.execute(`INSERT INTO payments (order_id,provider,provider_payment_id,amount_minor,currency,status,failure_code,failure_message)
      VALUES (?,'fake',?,?,'EUR',?,?,?)`, [orderId, providerPaymentId, total, providerStatus, providerStatus === "failed" ? "demo_declined" : null, providerStatus === "failed" ? "Demonstration decline — no real charge attempted" : null]);
    const paymentId = Number(payment.insertId);
    const eventId = `demo-event-${String(number).padStart(3, "0")}`;
    await connection.execute(`INSERT INTO payment_events (payment_id,provider,provider_event_id,event_type,payload_hash,processing_status,sanitized_payload,processed_at)
      VALUES (?,'fake',?,?,?,'processed',?,NOW())`, [paymentId, eventId, `demo.${providerStatus}`, createHash("sha256").update(eventId).digest("hex"), JSON.stringify({ demo: true, state: providerStatus })]);
    const scenarioNumber = ((number - 1) % 10) + 1;
    if (scenarioNumber === 8) await connection.execute("INSERT INTO refunds (payment_id,provider_refund_id,amount_minor,reason,status) VALUES (?,?,5000,'DEMO: customer kept one item','succeeded')", [paymentId, `demo-refund-${String(number).padStart(3, "0")}`]);
    if (scenarioNumber === 9) await connection.execute("INSERT INTO refunds (payment_id,provider_refund_id,amount_minor,reason,status) VALUES (?,?,?,'DEMO: returned product','succeeded')", [paymentId, `demo-refund-${String(number).padStart(3, "0")}`, total]);
    if (scenarioNumber === 10) await connection.execute("INSERT INTO refunds (payment_id,provider_refund_id,amount_minor,reason,status) VALUES (?,?,?,'DEMO: inspection complete, refund awaiting provider','pending')", [paymentId, `demo-refund-${String(number).padStart(3, "0")}`, total]);

    const emailStatus = ["queued", "sent", "sent", "sent", "sent", "sent", "failed", "sent", "sent", "queued"][index % 10];
    await connection.execute(`INSERT INTO email_deliveries (order_id,template,recipient,idempotency_key,status,attempt_count,provider_message_id,last_error,context,sent_at)
      VALUES (?,'fulfilment_update',?,?,?, ?,?,?,?,IF(?='sent',NOW(),NULL))`, [orderId, email, `demo:${orderNumber}`, emailStatus, emailStatus === "failed" ? 3 : emailStatus === "sent" ? 1 : 0, emailStatus === "sent" ? `<demo-${number}@rusee.invalid>` : null, emailStatus === "failed" ? "DEMO: mailbox temporarily unavailable" : null, JSON.stringify({ demo: true, scenario: label }), emailStatus]);
  }
  await connection.commit();
  console.log("Created 20 scoped DEMO orders and payments, with at least 10 available pieces per active variant. No real email or payment was sent.");
  await verify();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
