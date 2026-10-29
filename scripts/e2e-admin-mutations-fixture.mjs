import mysql from "mysql2/promise";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("Local database configuration is required.");
const databaseUrl = new URL(DATABASE_URL);
if (process.env.NODE_ENV === "production" || !["127.0.0.1", "localhost"].includes(databaseUrl.hostname) || databaseUrl.pathname !== "/next_kimono") {
  throw new Error("Admin mutation fixtures are restricted to the local next_kimono database.");
}

const fixtures = [
  ["CHROMIUM", "00000000-0000-4000-8000-000000000821"],
  ["FIREFOX", "00000000-0000-4000-8000-000000000822"],
  ["WEBKIT", "00000000-0000-4000-8000-000000000823"],
  ["MOBILE", "00000000-0000-4000-8000-000000000824"],
];
const productSlug = "__rusee_e2e_ops_product__";
const colourSlug = "__rusee_e2e_ops_colour__";
const sizeCode = "E2E-OPS";
const sku = "E2E-OPS-SKU";
const connection = await mysql.createConnection(DATABASE_URL);

async function ids(sql, params = []) {
  const [rows] = await connection.execute(sql, params);
  return rows.map((row) => Number(row.id));
}

async function remove() {
  const orderIds = await ids("SELECT id FROM orders WHERE order_number LIKE 'E2E-OPS-%'");
  const paymentIds = orderIds.length ? await ids(`SELECT id FROM payments WHERE order_id IN (${orderIds.map(() => "?").join(",")})`, orderIds) : [];
  const variantIds = await ids("SELECT id FROM product_variants WHERE sku=?", [sku]);
  const productIds = await ids("SELECT id FROM products WHERE slug=?", [productSlug]);
  const colourIds = await ids("SELECT id FROM colours WHERE slug=?", [colourSlug]);
  const sizeIds = await ids("SELECT id FROM sizes WHERE code=?", [sizeCode]);

  if (paymentIds.length) {
    await connection.execute(`DELETE FROM refunds WHERE payment_id IN (${paymentIds.map(() => "?").join(",")})`, paymentIds);
    await connection.execute(`DELETE FROM payment_events WHERE payment_id IN (${paymentIds.map(() => "?").join(",")})`, paymentIds);
  }
  if (orderIds.length) {
    await connection.execute(`DELETE FROM email_deliveries WHERE order_id IN (${orderIds.map(() => "?").join(",")})`, orderIds);
    await connection.execute(`DELETE FROM payments WHERE order_id IN (${orderIds.map(() => "?").join(",")})`, orderIds);
    await connection.execute(`DELETE FROM inventory_movements WHERE order_id IN (${orderIds.map(() => "?").join(",")})`, orderIds);
    await connection.execute(`DELETE FROM orders WHERE id IN (${orderIds.map(() => "?").join(",")})`, orderIds);
  }
  await connection.execute("DELETE FROM customers WHERE email LIKE 'e2e-ops-%@rusee.invalid'");
  if (variantIds.length) {
    await connection.execute(`DELETE FROM inventory_movements WHERE variant_id IN (${variantIds.map(() => "?").join(",")})`, variantIds);
    await connection.execute(`DELETE FROM inventory WHERE variant_id IN (${variantIds.map(() => "?").join(",")})`, variantIds);
    await connection.execute(`DELETE FROM product_variants WHERE id IN (${variantIds.map(() => "?").join(",")})`, variantIds);
  }
  if (productIds.length) {
    await connection.execute(`DELETE FROM product_images WHERE product_id IN (${productIds.map(() => "?").join(",")})`, productIds);
    await connection.execute(`DELETE FROM designs WHERE product_id IN (${productIds.map(() => "?").join(",")})`, productIds);
    await connection.execute(`DELETE FROM products WHERE id IN (${productIds.map(() => "?").join(",")})`, productIds);
  }
  if (colourIds.length) await connection.execute(`DELETE FROM colours WHERE id IN (${colourIds.map(() => "?").join(",")})`, colourIds);
  if (sizeIds.length) await connection.execute(`DELETE FROM sizes WHERE id IN (${sizeIds.map(() => "?").join(",")})`, sizeIds);
}

async function prepare() {
  await remove();
  const [productResult] = await connection.execute("INSERT INTO products (slug,title,description,status,tax_rate_bps) VALUES (?,'E2E Operations Kimono','Isolated browser fixture','draft',2400)", [productSlug]);
  const productId = Number(productResult.insertId);
  const [colourResult] = await connection.execute("INSERT INTO colours (slug,name,hex,sort_order) VALUES (?,'E2E Ink','#111111',999)", [colourSlug]);
  const colourId = Number(colourResult.insertId);
  const [sizeResult] = await connection.execute("INSERT INTO sizes (code,label,sort_order) VALUES (?,'E2E Operations',999)", [sizeCode]);
  const sizeId = Number(sizeResult.insertId);
  const [designResult] = await connection.execute("INSERT INTO designs (product_id,slug,name,name_el,fixed_colour_id,sort_order,active) VALUES (?,'e2e-ops','E2E Operations','E2E Λειτουργίες',?,999,true)", [productId, colourId]);
  const designId = Number(designResult.insertId);
  const [variantResult] = await connection.execute("INSERT INTO product_variants (product_id,design_id,colour_id,size_id,sku,price_minor,currency,active) VALUES (?,?,?,?,?,18900,'EUR',true)", [productId, designId, colourId, sizeId, sku]);
  const variantId = Number(variantResult.insertId);
  await connection.execute("INSERT INTO inventory (variant_id,on_hand,reserved) VALUES (?,20,0)", [variantId]);
  await connection.execute("INSERT INTO inventory_movements (variant_id,quantity_delta,reason,note) VALUES (?,20,'seed','Sprint 08J isolated fixture')", [variantId]);

  for (const [suffix, publicId] of fixtures) {
    const email = `e2e-ops-${suffix.toLowerCase()}@rusee.invalid`;
    const [customerResult] = await connection.execute("INSERT INTO customers (email,first_name,last_name) VALUES (?,'E2E','Operator')", [email]);
    const customerId = Number(customerResult.insertId);
    const [orderResult] = await connection.execute(`INSERT INTO orders
      (public_id,order_number,customer_id,email,currency,subtotal_minor,shipping_minor,tax_minor,discount_minor,total_minor,status,payment_status,fulfilment_status)
      VALUES (?,?,?,?,'EUR',18900,0,3658,0,18900,'paid','paid','unfulfilled')`, [publicId, `E2E-OPS-${suffix}`, customerId, email]);
    const orderId = Number(orderResult.insertId);
    await connection.execute(`INSERT INTO order_items
      (order_id,variant_id,sku,product_title,design_name,colour_name,size_label,unit_price_minor,quantity,tax_minor,total_minor)
      VALUES (?,?,?,'E2E Operations Kimono','E2E Operations','E2E Ink','E2E Operations',18900,1,3658,18900)`, [orderId, variantId, sku]);
    await connection.execute(`INSERT INTO order_addresses
      (order_id,type,first_name,last_name,line1,city,postal_code,country_code,phone)
      VALUES (?,'shipping','E2E','Operator','1 Browser Contract Street','Athens','10557','GR','0000000000')`, [orderId]);
    await connection.execute("INSERT INTO order_status_events (order_id,from_status,to_status,actor_type,note) VALUES (?,'pending_payment','paid','provider','Isolated captured fixture')", [orderId]);
    await connection.execute(`INSERT INTO payments
      (order_id,provider,provider_payment_id,amount_minor,currency,status)
      VALUES (?,'fake',?,18900,'EUR','captured')`, [orderId, `e2e-ops-${suffix.toLowerCase()}`]);
  }
}

async function verify() {
  const [rows] = await connection.execute(`SELECT o.order_number,o.status,o.fulfilment_status,
    (SELECT COUNT(*) FROM order_status_events e WHERE e.order_id=o.id AND e.actor_type='admin' AND e.to_status='processing') AS transition_count,
    (SELECT COUNT(*) FROM email_deliveries d WHERE d.order_id=o.id AND d.template='fulfilment_update' AND d.status='queued' AND d.attempt_count=0) AS queued_email_count,
    (SELECT COUNT(*) FROM payments p INNER JOIN refunds r ON r.payment_id=p.id WHERE p.order_id=o.id AND r.status='pending' AND r.amount_minor=2500) AS refund_count
    FROM orders o WHERE o.order_number LIKE 'E2E-OPS-%' ORDER BY o.order_number`);
  const complete = rows.length === fixtures.length && rows.every((row) => row.status === "processing" && row.fulfilment_status === "processing" && Number(row.transition_count) === 1 && Number(row.queued_email_count) === 1 && Number(row.refund_count) === 1);
  const [[audit]] = await connection.execute("SELECT COUNT(*) AS total FROM admin_audit_events WHERE action IN ('order.fulfilment.advance','refund.request') AND admin_user_id=(SELECT id FROM admin_users WHERE username='__rusee_e2e_admin__' LIMIT 1)");
  if (!complete || Number(audit.total) !== fixtures.length * 2) throw new Error("Admin mutation browser evidence is incomplete.");
  console.log("Verified four isolated fulfilment transitions, queued unsent messages, partial refunds, and immutable admin audit pairs.");
}

try {
  await connection.beginTransaction();
  if (process.argv.includes("--verify")) await verify();
  else if (process.argv.includes("--cleanup")) await remove();
  else await prepare();
  await connection.commit();
  if (!process.argv.includes("--verify")) console.log(process.argv.includes("--cleanup") ? "Local admin mutation fixtures removed." : "Prepared four isolated admin mutation fixtures without contacting email or payment providers.");
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
