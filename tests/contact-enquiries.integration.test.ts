import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { persistContactEnquiry } from "@/features/contact/service";
import type { ContactEnquiryInput } from "@/features/contact/schema";
import { advanceContactEnquiry } from "@/features/contact/admin";
import { databasePool } from "@/lib/db/connection";

const publicIds: string[] = [];
const rateLimitKeys: string[] = [];
const adminIds: number[] = [];

function enquiry(overrides: Partial<ContactEnquiryInput> = {}): ContactEnquiryInput {
  const submissionId = randomUUID();
  publicIds.push(submissionId);
  return {
    submissionId,
    name: "Contact Test",
    email: "contact-test@rusee.invalid",
    subject: "fit_sizing",
    orderNumber: "",
    message: "A valid integration-test contact enquiry.",
    locale: "el",
    website: "",
    startedAt: Date.now() - 2_000,
    ...overrides,
  };
}

function rateKey() {
  const key = randomUUID().replaceAll("-", "").padEnd(64, "0");
  rateLimitKeys.push(key);
  return key;
}

afterAll(async () => {
  if (adminIds.length) {
    await databasePool.query("DELETE FROM admin_audit_events WHERE admin_user_id IN (?)", [adminIds]);
  }
  if (publicIds.length) {
    await databasePool.query("DELETE e FROM email_deliveries e INNER JOIN contact_enquiries c ON c.id = e.contact_enquiry_id WHERE c.public_id IN (?)", [publicIds]);
    await databasePool.query("DELETE FROM contact_enquiries WHERE public_id IN (?)", [publicIds]);
  }
  if (rateLimitKeys.length) {
    await databasePool.query("DELETE FROM contact_enquiry_rate_limits WHERE rate_limit_key IN (?)", [rateLimitKeys]);
  }
  if (adminIds.length) {
    await databasePool.query("DELETE FROM admin_users WHERE id IN (?)", [adminIds]);
  }
  await databasePool.end();
});

describe("contact enquiry persistence", () => {
  it("persists normalized input and treats a retry as idempotent", async () => {
    const input = enquiry();
    const key = rateKey();
    expect(await persistContactEnquiry(input, key)).toMatchObject({ outcome: "created", publicId: input.submissionId, deliveryId: expect.any(Number) });
    expect(await persistContactEnquiry(input, key)).toMatchObject({ outcome: "duplicate", publicId: input.submissionId, deliveryId: expect.any(Number) });

    const [rows] = await databasePool.execute(
      "SELECT name, email, subject, locale, status FROM contact_enquiries WHERE public_id = ?",
      [input.submissionId],
    );
    expect((rows as Array<Record<string, unknown>>)[0]).toEqual({
      name: input.name,
      email: input.email,
      subject: input.subject,
      locale: input.locale,
      status: "new",
    });
    const [deliveries] = await databasePool.execute("SELECT COUNT(*) AS count, MAX(reply_to) AS reply_to FROM email_deliveries e INNER JOIN contact_enquiries c ON c.id=e.contact_enquiry_id WHERE c.public_id=? AND e.template='contact_enquiry_notification'", [input.submissionId]);
    expect((deliveries as Array<{ count: number; reply_to: string }>)[0]).toEqual({ count: 1, reply_to: input.email });
  });

  it("limits a fingerprint after five accepted submissions in fifteen minutes", async () => {
    const key = rateKey();
    for (let index = 0; index < 5; index++) {
      expect((await persistContactEnquiry(enquiry(), key)).outcome).toBe("created");
    }
    expect(await persistContactEnquiry(enquiry(), key)).toEqual({ outcome: "rate_limited" });
  });

  it("commits an authorized sequential status change with its audit event", async () => {
    const input = enquiry();
    await persistContactEnquiry(input, rateKey());
    const [adminResult] = await databasePool.execute(
      "INSERT INTO admin_users (username, password_hash, role, active) VALUES (?, 'integration-test-hash', 'manager', true)",
      [`contact-test-${randomUUID()}`],
    );
    const adminId = Number((adminResult as { insertId: number }).insertId);
    adminIds.push(adminId);
    const [enquiries] = await databasePool.execute("SELECT id FROM contact_enquiries WHERE public_id = ?", [input.submissionId]);
    const enquiryId = Number((enquiries as Array<{ id: number }>)[0].id);
    const connection = await databasePool.getConnection();
    try {
      await connection.beginTransaction();
      expect(await advanceContactEnquiry(connection, adminId, enquiryId, "read")).toEqual({ from: "new", to: "read" });
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    const [statusRows] = await databasePool.execute("SELECT status FROM contact_enquiries WHERE id = ?", [enquiryId]);
    expect((statusRows as Array<{ status: string }>)[0].status).toBe("read");
    const [auditRows] = await databasePool.execute("SELECT action FROM admin_audit_events WHERE admin_user_id = ? AND entity_type = 'contact_enquiry' AND entity_id = ?", [adminId, String(enquiryId)]);
    expect(auditRows).toHaveLength(1);
    expect((auditRows as Array<{ action: string }>)[0].action).toBe("contact_enquiry.status.advance");
  });
});
