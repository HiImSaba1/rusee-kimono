import "server-only";

import { createHmac } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { databasePool } from "@/lib/db/connection";
import type { ContactEnquiryInput } from "./schema";

const RATE_LIMIT_MAX = 5;

type ExistingRow = RowDataPacket & { id: number };
type RateRow = RowDataPacket & { submission_count: number };

export type PersistContactResult =
  | { outcome: "created" | "duplicate"; publicId: string; deliveryId?: number }
  | { outcome: "rate_limited" };

export function contactRateLimitKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientAddress = request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 240) || "unknown";
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("Contact rate limiting is not configured.");
  return createHmac("sha256", secret)
    .update(`rusee-contact-rate-limit:v1:${clientAddress}:${userAgent}`)
    .digest("hex");
}

export async function persistContactEnquiry(
  input: ContactEnquiryInput,
  rateLimitKey: string,
): Promise<PersistContactResult> {
  const [existingRows] = await databasePool.execute<(ExistingRow & { delivery_id: number | null })[]>(
    `SELECT c.id, e.id AS delivery_id FROM contact_enquiries c
     LEFT JOIN email_deliveries e ON e.contact_enquiry_id = c.id AND e.template = 'contact_enquiry_notification'
     WHERE c.public_id = ? LIMIT 1`,
    [input.submissionId],
  );
  if (existingRows[0]) return { outcome: "duplicate", publicId: input.submissionId, deliveryId: existingRows[0].delivery_id ?? undefined };

  await databasePool.execute<ResultSetHeader>(
    `INSERT INTO contact_enquiry_rate_limits (rate_limit_key, window_started_at, submission_count)
     VALUES (?, NOW(), 1)
     ON DUPLICATE KEY UPDATE
       submission_count = IF(window_started_at <= DATE_SUB(NOW(), INTERVAL 15 MINUTE), 1, submission_count + 1),
       window_started_at = IF(window_started_at <= DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW(), window_started_at),
       updated_at = NOW()`,
    [rateLimitKey],
  );
  const [rateRows] = await databasePool.execute<RateRow[]>(
    "SELECT submission_count FROM contact_enquiry_rate_limits WHERE rate_limit_key = ? LIMIT 1",
    [rateLimitKey],
  );
  if (Number(rateRows[0]?.submission_count ?? RATE_LIMIT_MAX + 1) > RATE_LIMIT_MAX) {
    return { outcome: "rate_limited" };
  }

  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT IGNORE INTO contact_enquiries
        (public_id, name, email, subject, order_number, message, locale, status, rate_limit_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      [input.submissionId, input.name, input.email, input.subject, input.orderNumber || null, input.message, input.locale, rateLimitKey],
    );
    if (result.affectedRows !== 1) {
      await connection.commit();
      return { outcome: "duplicate", publicId: input.submissionId };
    }
    const enquiryId = Number(result.insertId);
    const recipient = process.env.CONTACT_STUDIO_EMAIL?.trim() || "paulsaba1710@gmail.com";
    const [deliveryResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO email_deliveries
        (contact_enquiry_id, template, recipient, reply_to, idempotency_key)
       VALUES (?, 'contact_enquiry_notification', ?, ?, ?)`,
      [enquiryId, recipient, input.email, `contact-enquiry-notification:${enquiryId}`],
    );
    await connection.commit();
    return { outcome: "created", publicId: input.submissionId, deliveryId: Number(deliveryResult.insertId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
