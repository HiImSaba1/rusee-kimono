import "server-only";
import { databasePool } from "@/lib/db/connection";
import { paymentReconciliationIssues } from "@/features/admin/reconciliation";

export async function getAdminOverview() {
  const [[orderRows], [stockRows], [recentRows]] = await Promise.all([
    databasePool.execute(`SELECT COUNT(*) AS total_orders,
      SUM(status = 'pending_payment') AS pending_orders,
      SUM(payment_status = 'paid') AS paid_orders,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_minor ELSE 0 END), 0) AS paid_revenue_minor
      FROM orders`),
    databasePool.execute(`SELECT COUNT(*) AS low_stock_variants,
      COALESCE(SUM(on_hand - reserved), 0) AS available_units,
      COALESCE(SUM(reserved), 0) AS reserved_units
      FROM inventory WHERE on_hand - reserved <= 2`),
    databasePool.execute(`SELECT order_number, email, total_minor, currency, status, payment_status, created_at
      FROM orders ORDER BY created_at DESC LIMIT 8`),
  ]);
  return {
    metrics: (orderRows as Array<{ total_orders: number; pending_orders: number; paid_orders: number; paid_revenue_minor: number }>)[0],
    stock: (stockRows as Array<{ low_stock_variants: number; available_units: number; reserved_units: number }>)[0],
    recent: recentRows as Array<{ order_number: string; email: string; total_minor: number; currency: string; status: string; payment_status: string; created_at: Date }>,
  };
}

export async function getAdminAttentionCounts() {
  const [[rows], payments, [orphanEventRows]] = await Promise.all([
    databasePool.execute(`SELECT
      (SELECT COUNT(*) FROM contact_enquiries WHERE status='new') AS new_enquiries,
      (SELECT COUNT(*) FROM email_deliveries WHERE status='failed') AS failed_emails,
      (SELECT COUNT(*) FROM email_deliveries WHERE status='queued') AS queued_emails,
      (SELECT COUNT(*) FROM inventory WHERE on_hand-reserved<=2) AS low_stock,
      (SELECT COUNT(*) FROM refunds WHERE status='pending') AS pending_refunds,
      (SELECT COUNT(*) FROM return_requests WHERE status IN ('pending','approved','received')) AS pending_return_requests,
      (SELECT COUNT(*) FROM store_information_pages WHERE status='draft') AS draft_information_pages`),
    listAdminPayments(),
    databasePool.execute("SELECT COUNT(*) AS total FROM payment_events WHERE payment_id IS NULL AND processing_status='failed'"),
  ]);
  const counts = (rows as Array<{ new_enquiries: number; failed_emails: number; queued_emails: number; low_stock: number; pending_refunds: number; pending_return_requests:number; draft_information_pages: number }>)[0];
  const orphanEventIssues = Number((orphanEventRows as Array<{ total: number }>)[0]?.total ?? 0);
  const reconciliationIssues = payments.filter((payment) => paymentReconciliationIssues(payment).length > 0).length + orphanEventIssues;
  return { ...counts, reconciliation_issues: reconciliationIssues };
}

export type AdminOrderView = "all" | "attention" | "ready" | "processing" | "shipped" | "returns";

export async function listAdminOrders(page = 1, query = "", view: AdminOrderView = "all") {
  const requestedPage = Math.floor(page);
  const safePage = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const limit = 20;
  const offset = (safePage - 1) * limit;
  const search = `%${query.trim().slice(0, 120)}%`;
  const filters: string[] = [];
  const params: string[] = [];
  if (query.trim()) { filters.push("(o.order_number LIKE ? OR o.email LIKE ?)"); params.push(search, search); }
  const viewSql: Record<AdminOrderView, string | undefined> = {
    all: undefined,
    attention: "(o.status IN ('pending_payment','payment_failed') OR o.payment_status IN ('failed','cancelled'))",
    ready: "(o.payment_status='paid' AND o.fulfilment_status='unfulfilled' AND EXISTS (SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='captured' AND p.amount_minor=o.total_minor AND p.currency=o.currency))",
    processing: "o.fulfilment_status='processing'",
    shipped: "o.fulfilment_status IN ('shipped','delivered')",
    returns: "EXISTS (SELECT 1 FROM return_requests r WHERE r.order_id=o.id AND r.status IN ('pending','approved','received'))",
  };
  const selectedViewSql = viewSql[view];
  if (selectedViewSql) filters.push(selectedViewSql);
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const [[rows], [countRows]] = await Promise.all([
    databasePool.execute(`SELECT o.public_id,o.order_number,o.email,o.total_minor,o.currency,o.status,o.payment_status,o.fulfilment_status,o.created_at FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
    databasePool.execute(`SELECT COUNT(*) AS total FROM orders o ${where}`, params),
  ]);
  return { rows: rows as Array<{ public_id: string; order_number: string; email: string; total_minor: number; currency: string; status: string; payment_status: string; fulfilment_status: string; created_at: Date }>, total: Number((countRows as Array<{ total: number }>)[0]?.total ?? 0), page: safePage, limit };
}

export async function listAdminInventory() {
  const [rows] = await databasePool.execute(`SELECT v.id, v.sku, p.title AS product_title, d.name AS design_name,
    c.name AS colour_name, s.label AS size_label, i.on_hand, i.reserved, (i.on_hand - i.reserved) AS available
    FROM inventory i INNER JOIN product_variants v ON v.id = i.variant_id
    INNER JOIN products p ON p.id = v.product_id INNER JOIN designs d ON d.id = v.design_id
    INNER JOIN colours c ON c.id = v.colour_id INNER JOIN sizes s ON s.id = v.size_id
    ORDER BY available ASC, d.sort_order, c.sort_order, s.sort_order`);
  return rows as Array<{ id: number; sku: string; product_title: string; design_name: string; colour_name: string; size_label: string; on_hand: number; reserved: number; available: number }>;
}

export async function listInventoryMovements() {
  const [rows] = await databasePool.execute(`SELECT m.id, m.quantity_delta, m.reason, m.note, m.created_at, v.sku
    FROM inventory_movements m INNER JOIN product_variants v ON v.id = m.variant_id
    ORDER BY m.created_at DESC, m.id DESC LIMIT 40`);
  return rows as Array<{ id: number; quantity_delta: number; reason: string; note: string | null; created_at: Date; sku: string }>;
}

export async function getAdminOrder(publicId: string) {
  const [orderRows] = await databasePool.execute(`SELECT id, public_id, order_number, email, currency, subtotal_minor, shipping_minor,
    tax_minor, discount_minor, total_minor, status, payment_status, fulfilment_status, reservation_expires_at,
    reservation_released_at, created_at, updated_at FROM orders WHERE public_id = ? LIMIT 1`, [publicId]);
  const order = (orderRows as Array<Record<string, unknown> & { id: number }>)[0];
  if (!order) return null;
  const [[items], [addresses], [events], [payments], [paymentEvents], [shipments], [returns], [refunds], [emails]] = await Promise.all([
    databasePool.execute("SELECT sku, product_title, design_name, colour_name, size_label, unit_price_minor, quantity, tax_minor, total_minor FROM order_items WHERE order_id = ? ORDER BY id", [order.id]),
    databasePool.execute("SELECT type, first_name, last_name, company, document_type, vat_number, tax_office, business_activity, line1, line2, city, region, postal_code, country_code, phone FROM order_addresses WHERE order_id = ? ORDER BY type DESC", [order.id]),
    databasePool.execute("SELECT from_status, to_status, actor_type, note, created_at FROM order_status_events WHERE order_id = ? ORDER BY created_at DESC, id DESC", [order.id]),
    databasePool.execute("SELECT provider, provider_payment_id, amount_minor, currency, status, failure_code, failure_message, created_at, updated_at FROM payments WHERE order_id = ? ORDER BY created_at DESC, id DESC", [order.id]),
    databasePool.execute(`SELECT pe.provider,pe.provider_event_id,pe.event_type,pe.processing_status,pe.received_at,pe.processed_at,
      JSON_UNQUOTE(JSON_EXTRACT(pe.sanitized_payload,'$.processingReason')) AS processing_reason
      FROM payment_events pe INNER JOIN payments p ON p.id=pe.payment_id
      WHERE p.order_id=? ORDER BY pe.received_at DESC,pe.id DESC`, [order.id]),
    databasePool.execute("SELECT carrier_name,tracking_code,tracking_url,shipped_at,created_at FROM shipments WHERE order_id=? ORDER BY id DESC", [order.id]),
    databasePool.execute("SELECT public_id,reason,status,customer_note,admin_note,reviewed_at,created_at,updated_at FROM return_requests WHERE order_id=? ORDER BY id DESC", [order.id]),
    databasePool.execute(`SELECT r.amount_minor,r.reason,r.status,r.provider_refund_id,r.created_at,r.updated_at
      FROM refunds r INNER JOIN payments p ON p.id=r.payment_id WHERE p.order_id=? ORDER BY r.id DESC`, [order.id]),
    databasePool.execute("SELECT template,recipient,status,attempt_count,provider_message_id,sent_at,created_at FROM email_deliveries WHERE order_id=? ORDER BY id DESC", [order.id]),
  ]);
  return {
    order,
    items: items as Array<Record<string, unknown>>,
    addresses: addresses as Array<Record<string, unknown>>,
    events: events as Array<Record<string, unknown>>,
    payments: payments as Array<Record<string, unknown>>,
    paymentEvents: paymentEvents as Array<Record<string, unknown>>,
    shipments: shipments as Array<Record<string, unknown>>,
    returns: returns as Array<Record<string, unknown>>,
    refunds: refunds as Array<Record<string, unknown>>,
    emails: emails as Array<Record<string, unknown>>,
  };
}

export type AdminPaymentRow = {
  id: number; provider: string; provider_payment_id: string | null; amount_minor: number; currency: string;
  payment_status: string; failure_code: string | null; failure_message: string | null; updated_at: Date;
  public_id: string; order_number: string; order_total_minor: number; order_currency: string;
  order_status: string; order_payment_status: string; event_count: number; failed_event_count: number;
  last_event_at: Date | null; last_reviewed_at: Date | null; last_reviewed_by: string | null;
};

export async function listAdminPayments() {
  const [rows] = await databasePool.execute(`SELECT p.id, p.provider, p.provider_payment_id, p.amount_minor, p.currency,
    p.status AS payment_status, p.failure_code, p.failure_message, p.updated_at,
    o.public_id, o.order_number, o.total_minor AS order_total_minor, o.currency AS order_currency,
    o.status AS order_status, o.payment_status AS order_payment_status,
    COUNT(e.id) AS event_count, COALESCE(SUM(e.processing_status = 'failed'), 0) AS failed_event_count,
    MAX(e.received_at) AS last_event_at,
    (SELECT MAX(a.created_at) FROM admin_audit_events a WHERE a.entity_type = 'payment' AND a.entity_id = CAST(p.id AS CHAR) AND a.action = 'payment.reconciliation.review') AS last_reviewed_at,
    (SELECT u.username FROM admin_audit_events a LEFT JOIN admin_users u ON u.id = a.admin_user_id WHERE a.entity_type = 'payment' AND a.entity_id = CAST(p.id AS CHAR) AND a.action = 'payment.reconciliation.review' ORDER BY a.created_at DESC LIMIT 1) AS last_reviewed_by
    FROM payments p INNER JOIN orders o ON o.id = p.order_id
    LEFT JOIN payment_events e ON e.payment_id = p.id
    GROUP BY p.id, p.provider, p.provider_payment_id, p.amount_minor, p.currency, p.status, p.failure_code,
      p.failure_message, p.updated_at, o.public_id, o.order_number, o.total_minor, o.currency, o.status, o.payment_status
    ORDER BY p.updated_at DESC LIMIT 100`);
  return rows as AdminPaymentRow[];
}

export type PaymentEventAttentionRow = {
  id: number; provider: string; provider_event_id: string; event_type: string;
  processing_status: string; processing_reason: string | null; received_at: Date;
  payment_id: number | null; public_id: string | null; order_number: string | null;
};

export async function listPaymentEventAttention() {
  const [rows] = await databasePool.execute(`SELECT e.id,e.provider,e.provider_event_id,e.event_type,e.processing_status,e.received_at,e.payment_id,
    JSON_UNQUOTE(JSON_EXTRACT(e.sanitized_payload,'$.processingReason')) AS processing_reason,
    o.public_id,o.order_number
    FROM payment_events e LEFT JOIN payments p ON p.id=e.payment_id LEFT JOIN orders o ON o.id=p.order_id
    WHERE e.processing_status='failed' OR e.payment_id IS NULL
    ORDER BY e.received_at DESC,e.id DESC LIMIT 100`);
  return rows as PaymentEventAttentionRow[];
}

export async function getAdminCatalogue() {
  const [[products], [designs], [colours], [sizes], [variants], [images]] = await Promise.all([
    databasePool.execute("SELECT id, slug, title, subtitle, description, material, care, product_information, status, tax_rate_bps FROM products ORDER BY id"),
    databasePool.execute("SELECT id, product_id, slug, name, name_el, story, description_el, description_en, details_el, details_en, fixed_colour_id, sort_order, active FROM designs ORDER BY product_id, sort_order, id"),
    databasePool.execute("SELECT id, slug, name, hex, sort_order FROM colours ORDER BY sort_order, id"),
    databasePool.execute("SELECT id, code, label, sort_order FROM sizes ORDER BY sort_order, id"),
    databasePool.execute(`SELECT v.id, v.sku, v.price_minor, v.currency, v.active, d.name AS design_name,
      c.name AS colour_name, s.label AS size_label FROM product_variants v
      INNER JOIN designs d ON d.id = v.design_id INNER JOIN colours c ON c.id = v.colour_id
      INNER JOIN sizes s ON s.id = v.size_id ORDER BY d.sort_order, c.sort_order, s.sort_order`),
    databasePool.execute(`SELECT i.id, i.product_id, i.design_id, i.colour_id, i.size_id, i.src, i.alt, i.alt_el, i.alt_en, i.sort_order,
      d.name AS design_name, c.name AS colour_name, s.label AS size_label FROM product_images i
      LEFT JOIN designs d ON d.id = i.design_id LEFT JOIN colours c ON c.id = i.colour_id
      LEFT JOIN sizes s ON s.id = i.size_id
      ORDER BY i.sort_order, i.id`),
  ]);
  return {
    products: products as Array<{ id: number; slug: string; title: string; subtitle: string | null; description: string; material: string | null; care: string | null; product_information: unknown; status: string; tax_rate_bps: number }>,
    designs: designs as Array<{ id: number; product_id: number; slug: string; name: string; name_el: string | null; story: string | null; description_el: string | null; description_en: string | null; details_el: string | null; details_en: string | null; fixed_colour_id: number | null; sort_order: number; active: number | boolean }>,
    colours: colours as Array<{ id: number; slug: string; name: string; hex: string | null; sort_order: number }>,
    sizes: sizes as Array<{ id: number; code: string; label: string; sort_order: number }>,
    variants: variants as Array<{ id: number; sku: string; price_minor: number; currency: string; active: number | boolean; design_name: string; colour_name: string; size_label: string }>,
    images: images as Array<{ id: number; product_id: number; design_id: number | null; colour_id: number | null; size_id: number | null; src: string; alt: string; alt_el: string | null; alt_en: string | null; sort_order: number; design_name: string | null; colour_name: string | null; size_label: string | null }>,
  };
}

export async function getAdminDesign(id: number) {
  const [[designRows], [colourRows], [variantRows], [imageRows]] = await Promise.all([
    databasePool.execute("SELECT id,product_id,slug,name,name_el,story,description_el,description_en,details_el,details_en,fixed_colour_id,sort_order,active FROM designs WHERE id=? LIMIT 1", [id]),
    databasePool.execute("SELECT id,name,hex FROM colours ORDER BY sort_order,id"),
    databasePool.execute("SELECT v.id,v.sku,v.price_minor,v.currency,v.active,s.id AS size_id,s.code,s.label,i.on_hand,i.reserved FROM product_variants v INNER JOIN sizes s ON s.id=v.size_id LEFT JOIN inventory i ON i.variant_id=v.id WHERE v.design_id=? ORDER BY s.sort_order,v.id", [id]),
    databasePool.execute("SELECT id,product_id,design_id,colour_id,size_id,src,alt,alt_el,alt_en,sort_order FROM product_images WHERE design_id=? ORDER BY size_id IS NULL DESC,size_id,sort_order,id", [id]),
  ]);
  return { design: (designRows as Array<Record<string, unknown>>)[0] ?? null, colours: colourRows as Array<{id:number;name:string;hex:string|null}>, variants: variantRows as Array<Record<string,unknown>>, images: imageRows as Array<Record<string,unknown>> };
}

export async function listOrderOperations() {
  const [rows] = await databasePool.execute(`SELECT o.id, o.public_id, o.order_number, o.email, o.total_minor, o.currency,
    o.status, o.payment_status, o.fulfilment_status, o.created_at,
    p.id AS payment_id, p.provider, p.provider_payment_id, p.status AS provider_status,
    s.carrier_name, s.tracking_code, s.tracking_url,
    (SELECT COUNT(*) FROM payments cp WHERE cp.order_id=o.id AND cp.status='captured' AND cp.amount_minor=o.total_minor AND cp.currency=o.currency) AS matching_captured_payments,
    (SELECT COUNT(*) FROM payment_events pe INNER JOIN payments ep ON ep.id=pe.payment_id WHERE ep.order_id=o.id AND pe.processing_status='failed') AS failed_payment_events,
    COALESCE((SELECT SUM(r.amount_minor) FROM refunds r WHERE r.payment_id = p.id AND r.status IN ('pending','succeeded')), 0) AS refund_requested_minor
    FROM orders o LEFT JOIN payments p ON p.id = (SELECT p2.id FROM payments p2 WHERE p2.order_id = o.id ORDER BY (p2.status='captured') DESC,p2.id DESC LIMIT 1)
    LEFT JOIN shipments s ON s.order_id=o.id
    WHERE o.status <> 'draft' ORDER BY o.created_at DESC LIMIT 100`);
  return rows as Array<{ id: number; public_id: string; order_number: string; email: string; total_minor: number; currency: string; status: string; payment_status: string; fulfilment_status: string; created_at: Date; payment_id: number | null; provider: string | null; provider_payment_id: string | null; provider_status: string | null; carrier_name:string|null; tracking_code:string|null; tracking_url:string|null; matching_captured_payments:number; failed_payment_events:number; refund_requested_minor: number }>;
}

export type EmailDeliveryStatus = "queued" | "sending" | "sent" | "failed";

export async function listEmailDeliveries(status?: EmailDeliveryStatus) {
  const statusSql = status ? "WHERE e.status=?" : "";
  const [rows] = await databasePool.execute(`SELECT e.id,e.template,e.recipient,e.status,e.attempt_count,e.provider_message_id,
    e.last_error,e.sent_at,e.created_at,e.updated_at,o.public_id,o.order_number,
    c.public_id AS enquiry_public_id,c.name AS enquiry_name
    FROM email_deliveries e LEFT JOIN orders o ON o.id=e.order_id
    LEFT JOIN contact_enquiries c ON c.id=e.contact_enquiry_id
    ${statusSql}
    ORDER BY e.created_at DESC LIMIT 100`, status ? [status] : []);
  return rows as Array<{id:number;template:string;recipient:string;status:string;attempt_count:number;provider_message_id:string|null;last_error:string|null;sent_at:Date|null;created_at:Date;updated_at:Date;public_id:string|null;order_number:string|null;enquiry_public_id:string|null;enquiry_name:string|null}>;
}

export async function emailDeliveryStatusCounts() {
  const [rows] = await databasePool.execute(
    `SELECT status, COUNT(*) AS total
     FROM email_deliveries
     GROUP BY status`,
  );
  const counts: Record<EmailDeliveryStatus, number> = {
    queued: 0,
    sending: 0,
    sent: 0,
    failed: 0,
  };
  for (const row of rows as Array<{ status: EmailDeliveryStatus; total: number | string }>) {
    counts[row.status] = Number(row.total);
  }
  return counts;
}
