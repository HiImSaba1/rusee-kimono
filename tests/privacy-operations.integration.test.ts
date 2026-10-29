import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { persistContactEnquiry } from "@/features/contact/service";
import { eraseEligiblePrivacyData, privacySubjectSummary } from "@/features/privacy/service";
import { databasePool } from "@/lib/db/connection";

const email = `privacy-${randomUUID()}@rusee.invalid`;
let adminId = 0;
let publicId = "";

afterAll(async () => {
  if (adminId) await databasePool.execute("DELETE FROM admin_audit_events WHERE admin_user_id=?", [adminId]);
  await databasePool.execute("DELETE FROM privacy_requests WHERE subject_email=?", [email]);
  if (publicId) {
    await databasePool.execute("DELETE e FROM email_deliveries e INNER JOIN contact_enquiries c ON c.id=e.contact_enquiry_id WHERE c.public_id=?", [publicId]);
    await databasePool.execute("DELETE FROM contact_enquiries WHERE public_id=?", [publicId]);
  }
  if (adminId) await databasePool.execute("DELETE FROM admin_users WHERE id=?", [adminId]);
  await databasePool.end();
});

describe("privacy erasure operations", () => {
  it("anonymizes eligible enquiry identity and Reply-To while preserving audit evidence", async () => {
    publicId = randomUUID();
    await persistContactEnquiry({ submissionId: publicId, name: "Privacy Person", email, subject: "press", orderNumber: "", message: "Please erase this test message.", locale: "el", website: "", startedAt: Date.now() - 2_000 }, randomUUID().replaceAll("-", "").padEnd(64, "0"));
    const [adminResult] = await databasePool.execute("INSERT INTO admin_users (username,password_hash,role,active) VALUES (?,'privacy-test-hash','manager',true)", [`privacy-test-${randomUUID()}`]);
    adminId = Number((adminResult as { insertId: number }).insertId);
    expect(await privacySubjectSummary(email)).toMatchObject({ customers: 0, orders: 0, enquiries: 1 });
    expect(await eraseEligiblePrivacyData(adminId, email)).toMatchObject({ anonymizedEnquiries: 1, retainedOrders: 0 });
    const [rows] = await databasePool.execute(`SELECT c.name,c.email,c.message,c.anonymized_at,e.reply_to FROM contact_enquiries c LEFT JOIN email_deliveries e ON e.contact_enquiry_id=c.id WHERE c.public_id=?`, [publicId]);
    const row = (rows as Array<{ name: string; email: string; message: string; anonymized_at: Date | null; reply_to: string | null }>)[0];
    expect(row.name).toBe("Anonymized visitor");
    expect(row.email).toContain("@rusee.invalid");
    expect(row.message).toBe("[Personal message erased]");
    expect(row.anonymized_at).not.toBeNull();
    expect(row.reply_to).toBeNull();
  });
});
