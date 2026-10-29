import "server-only";

import type { PoolConnection } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";

export const enquiryStatuses = ["new", "read", "replied", "closed"] as const;
export type EnquiryStatus = (typeof enquiryStatuses)[number];

export async function listContactEnquiries(query = "", status = "all") {
  const safeQuery = query.trim().slice(0, 120);
  const safeStatus = enquiryStatuses.includes(status as EnquiryStatus) ? status as EnquiryStatus : "all";
  const clauses: string[] = [];
  const parameters: string[] = [];
  if (safeStatus !== "all") {
    clauses.push("status = ?");
    parameters.push(safeStatus);
  }
  if (safeQuery) {
    clauses.push("(name LIKE ? OR email LIKE ? OR order_number LIKE ? OR subject LIKE ?)");
    const search = `%${safeQuery}%`;
    parameters.push(search, search, search, search);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await databasePool.execute(
    `SELECT id, public_id, name, email, subject, order_number, locale, status, created_at, updated_at
     FROM contact_enquiries ${where} ORDER BY created_at DESC LIMIT 100`,
    parameters,
  );
  return rows as Array<{ id: number; public_id: string; name: string; email: string; subject: string; order_number: string | null; locale: "el" | "en"; status: EnquiryStatus; created_at: Date; updated_at: Date }>;
}

export async function getContactEnquiry(publicId: string) {
  const [rows] = await databasePool.execute(
    `SELECT c.id, c.public_id, c.name, c.email, c.subject, c.order_number, c.message, c.locale, c.status, c.created_at, c.updated_at,
      e.id AS delivery_id, e.status AS delivery_status, e.attempt_count, e.sent_at, e.last_error
     FROM contact_enquiries c
     LEFT JOIN email_deliveries e ON e.contact_enquiry_id = c.id AND e.template = 'contact_enquiry_notification'
     WHERE c.public_id = ? LIMIT 1`,
    [publicId],
  );
  return (rows as Array<{ id: number; public_id: string; name: string; email: string; subject: string; order_number: string | null; message: string; locale: "el" | "en"; status: EnquiryStatus; created_at: Date; updated_at: Date; delivery_id: number | null; delivery_status: string | null; attempt_count: number | null; sent_at: Date | null; last_error: string | null }>)[0] ?? null;
}

const nextStatus: Partial<Record<EnquiryStatus, EnquiryStatus>> = { new: "read", read: "replied", replied: "closed" };

export function nextEnquiryStatus(status: EnquiryStatus) {
  return nextStatus[status] ?? null;
}

export async function advanceContactEnquiry(connection: PoolConnection, adminId: number, enquiryId: number, requestedStatus: EnquiryStatus) {
  const [rows] = await connection.execute("SELECT status FROM contact_enquiries WHERE id = ? LIMIT 1 FOR UPDATE", [enquiryId]);
  const current = (rows as Array<{ status: EnquiryStatus }>)[0]?.status;
  if (!current) throw new Error("Το μήνυμα δεν υπάρχει πλέον.");
  if (nextEnquiryStatus(current) !== requestedStatus) throw new Error("Η αλλαγή κατάστασης δεν επιτρέπεται.");
  await connection.execute("UPDATE contact_enquiries SET status = ?, updated_at = NOW() WHERE id = ?", [requestedStatus, enquiryId]);
  await connection.execute(
    "INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, 'contact_enquiry.status.advance', 'contact_enquiry', ?, ?)",
    [adminId, String(enquiryId), JSON.stringify({ from: current, to: requestedStatus })],
  );
  return { from: current, to: requestedStatus };
}
