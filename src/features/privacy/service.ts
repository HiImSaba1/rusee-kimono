import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";

export function normalizeSubjectEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Εισαγάγετε έγκυρη διεύθυνση email.");
  return email;
}

export async function privacySubjectSummary(emailValue: string) {
  const email = normalizeSubjectEmail(emailValue);
  const [[customers], [orders], [enquiries]] = await Promise.all([
    databasePool.execute("SELECT COUNT(*) AS count FROM customers WHERE email = ?", [email]),
    databasePool.execute("SELECT COUNT(*) AS count FROM orders WHERE email = ?", [email]),
    databasePool.execute("SELECT COUNT(*) AS count FROM contact_enquiries WHERE email = ? AND anonymized_at IS NULL", [email]),
  ]);
  return {
    email,
    customers: Number((customers as Array<{ count: number }>)[0]?.count ?? 0),
    orders: Number((orders as Array<{ count: number }>)[0]?.count ?? 0),
    enquiries: Number((enquiries as Array<{ count: number }>)[0]?.count ?? 0),
  };
}

export async function exportPrivacySubject(emailValue: string) {
  const email = normalizeSubjectEmail(emailValue);
  const [[customers], [orders], [enquiries]] = await Promise.all([
    databasePool.execute("SELECT id,email,first_name,last_name,phone,created_at,updated_at FROM customers WHERE email=?", [email]),
    databasePool.execute(`SELECT id,public_id,order_number,email,currency,subtotal_minor,shipping_minor,tax_minor,discount_minor,total_minor,status,payment_status,fulfilment_status,created_at,updated_at FROM orders WHERE email=? ORDER BY created_at`, [email]),
    databasePool.execute("SELECT public_id,name,email,subject,order_number,message,locale,status,created_at,updated_at FROM contact_enquiries WHERE email=? AND anonymized_at IS NULL ORDER BY created_at", [email]),
  ]);
  const orderIds = (orders as Array<{ id: number }>).map((order) => order.id);
  let items: unknown[] = [], addresses: unknown[] = [], events: unknown[] = [], payments: unknown[] = [];
  if (orderIds.length) {
    [items, addresses, events, payments] = await Promise.all([
      rows("SELECT order_id,sku,product_title,design_name,colour_name,size_label,unit_price_minor,quantity,tax_minor,total_minor,created_at FROM order_items WHERE order_id IN (?)", orderIds),
      rows("SELECT order_id,type,first_name,last_name,company,document_type,vat_number,tax_office,business_activity,line1,line2,city,region,postal_code,country_code,phone,created_at FROM order_addresses WHERE order_id IN (?)", orderIds),
      rows("SELECT order_id,from_status,to_status,actor_type,note,created_at FROM order_status_events WHERE order_id IN (?)", orderIds),
      rows("SELECT order_id,provider,amount_minor,currency,status,failure_code,failure_message,created_at,updated_at FROM payments WHERE order_id IN (?)", orderIds),
    ]);
  }
  return { generatedAt: new Date().toISOString(), subject: email, customers, orders, orderItems: items, orderAddresses: addresses, orderEvents: events, payments, contactEnquiries: enquiries };
}

async function rows(sql: string, ids: number[]) {
  const [result] = await databasePool.query(sql, [ids]);
  return result as unknown[];
}

export async function recordPrivacyExport(adminId: number, email: string) {
  const publicId = randomUUID();
  await databasePool.execute(
    "INSERT INTO privacy_requests (public_id,subject_email,request_type,status,requested_by_admin_id,result,completed_at) VALUES (?,?,'export','completed',?,?,NOW())",
    [publicId, email, adminId, JSON.stringify({ generatedAt: new Date().toISOString() })],
  );
  await databasePool.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'privacy.export','privacy_request',?,?)", [adminId, publicId, JSON.stringify({ subjectEmail: email })]);
}

export async function eraseEligiblePrivacyData(adminId: number, emailValue: string) {
  const email = normalizeSubjectEmail(emailValue);
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.execute("SELECT COUNT(*) AS count FROM orders WHERE email=?", [email]);
    const retainedOrders = Number((orderRows as Array<{ count: number }>)[0]?.count ?? 0);
    const [contactRows] = await connection.execute("SELECT id,public_id FROM contact_enquiries WHERE email=? AND anonymized_at IS NULL FOR UPDATE", [email]);
    const contacts = contactRows as Array<{ id: number; public_id: string }>;
    for (const contact of contacts) await anonymizeContact(connection, contact.id, contact.public_id);
    const [customerResult] = await connection.execute<ResultSetHeader>(`UPDATE customers c LEFT JOIN orders o ON o.customer_id=c.id SET c.email=CONCAT('anonymous+',c.id,'@rusee.invalid'),c.first_name=NULL,c.last_name=NULL,c.phone=NULL,c.updated_at=NOW() WHERE c.email=? AND o.id IS NULL`, [email]);
    const publicId = randomUUID();
    const status = retainedOrders > 0 ? "blocked_legal_review" : "completed";
    const result = { anonymizedEnquiries: contacts.length, anonymizedOrphanCustomers: customerResult.affectedRows, retainedOrders, note: retainedOrders ? "Order and accounting records retained pending approved legal policy." : "Eligible personal data anonymized." };
    await connection.execute("INSERT INTO privacy_requests (public_id,subject_email,request_type,status,requested_by_admin_id,result,completed_at) VALUES (?,?,'erasure',?,?,?,NOW())", [publicId, email, status, adminId, JSON.stringify(result)]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,'privacy.erasure.apply','privacy_request',?,?)", [adminId, publicId, JSON.stringify(result)]);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

async function anonymizeContact(connection: PoolConnection, id: number, publicId: string) {
  const anonymousEmail = `anonymous+${publicId}@rusee.invalid`;
  const replacementKey = createHash("sha256").update(`anonymized:${publicId}`).digest("hex");
  await connection.execute("UPDATE email_deliveries SET reply_to=NULL,updated_at=NOW() WHERE contact_enquiry_id=?", [id]);
  await connection.execute("UPDATE contact_enquiries SET name='Anonymized visitor',email=?,order_number=NULL,message='[Personal message erased]',rate_limit_key=?,anonymized_at=NOW(),updated_at=NOW() WHERE id=?", [anonymousEmail, replacementKey, id]);
}

export async function runContactRetention({ apply }: { apply: boolean }) {
  const days = Math.min(3650, Math.max(30, Number(process.env.PRIVACY_CONTACT_RETENTION_DAYS ?? 365)));
  const enabled = process.env.PRIVACY_RETENTION_ENABLED === "true";
  const [eligibleRows] = await databasePool.execute(`SELECT id,public_id FROM contact_enquiries WHERE status='closed' AND anonymized_at IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL ${days} DAY) ORDER BY id LIMIT 500`);
  const eligible = eligibleRows as Array<{ id: number; public_id: string }>;
  if (!apply || !enabled) {
    await databasePool.execute("INSERT INTO privacy_retention_runs (mode,retention_days,eligible_count,anonymized_count,status,detail) VALUES ('dry_run',?,?,0,?,?)", [days, eligible.length, enabled ? "completed" : "disabled", JSON.stringify({ enabled })]);
    return { enabled, applied: false, retentionDays: days, eligible: eligible.length, anonymized: 0 };
  }
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    for (const contact of eligible) await anonymizeContact(connection, contact.id, contact.public_id);
    await connection.execute("INSERT INTO privacy_retention_runs (mode,retention_days,eligible_count,anonymized_count,status,detail) VALUES ('apply',?,?,?,'completed',?)", [days, eligible.length, eligible.length, JSON.stringify({ batchLimit: 500 })]);
    await connection.commit();
    return { enabled, applied: true, retentionDays: days, eligible: eligible.length, anonymized: eligible.length };
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function privacyOperationsHistory() {
  const [[requests], [runs]] = await Promise.all([
    databasePool.execute("SELECT public_id,subject_email,request_type,status,result,created_at,completed_at FROM privacy_requests ORDER BY created_at DESC LIMIT 30"),
    databasePool.execute("SELECT mode,retention_days,eligible_count,anonymized_count,status,detail,created_at FROM privacy_retention_runs ORDER BY created_at DESC LIMIT 20"),
  ]);
  return { requests: requests as Array<Record<string, unknown>>, runs: runs as Array<Record<string, unknown>> };
}
