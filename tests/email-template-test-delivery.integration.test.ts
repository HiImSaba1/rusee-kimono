import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { databasePool } from "@/lib/db/connection";
import { queueTemplateTestDelivery } from "@/features/email/template-test-delivery";

const requestId = randomUUID();
const recipient = `rusee-template-test-${requestId}@example.invalid`;
const adminUsername = `__rusee_email_test_${requestId.replaceAll("-", "").slice(0, 16)}__`;
let adminId = 0;
let templateId = 0;
let versionId = 0;

beforeAll(async () => {
  const [admin] = await databasePool.execute<ResultSetHeader>(
    "INSERT INTO admin_users (username,password_hash,role,active) VALUES (?,?,'owner',true)",
    [adminUsername, "isolated-test-fixture-not-a-login-secret"],
  );
  adminId = admin.insertId;
  const [templates] = await databasePool.execute(
    `SELECT t.id,v.id AS version_id
     FROM email_templates t
     INNER JOIN email_template_versions v ON v.template_id=t.id
     WHERE t.template_key='payment_confirmation' AND t.\`system\`=true AND t.status<>'archived'
     ORDER BY v.version DESC LIMIT 1`,
  );
  const template = (templates as Array<{ id: number; version_id: number }>)[0];
  templateId = Number(template?.id);
  versionId = Number(template?.version_id);
  if (!adminId || !templateId || !versionId) throw new Error("Sprint 08AM requires initialized system email templates.");
});

afterAll(async () => {
  await databasePool.execute("DELETE FROM automation_jobs WHERE deduplication_key=?", [`template-test:${requestId}:dispatch`]);
  await databasePool.execute("DELETE FROM email_deliveries WHERE idempotency_key=?", [`template-test:${versionId}:${requestId}`]);
  await databasePool.execute("DELETE FROM admin_audit_events WHERE action='email_template.test_queued' AND JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.requestId'))=?", [requestId]);
  await databasePool.execute("DELETE FROM admin_users WHERE id=? AND username=?", [adminId, adminUsername]);
  await databasePool.end();
});

describe("controlled email-template test delivery", () => {
  it("queues one immutable sample snapshot and one durable worker job", async () => {
    const input = { adminId, templateId, versionId, recipient, locale: "el" as const, requestId };
    expect(await queueTemplateTestDelivery(input)).toEqual({ queued: true });
    expect(await queueTemplateTestDelivery(input)).toEqual({ queued: false });

    const [deliveries] = await databasePool.execute(
      "SELECT order_id,contact_enquiry_id,recipient,status,context,subject_snapshot,text_snapshot,html_snapshot FROM email_deliveries WHERE idempotency_key=?",
      [`template-test:${versionId}:${requestId}`],
    );
    const delivery = (deliveries as Array<Record<string, unknown>>)[0];
    expect(deliveries).toHaveLength(1);
    expect(delivery).toMatchObject({ order_id: null, contact_enquiry_id: null, recipient, status: "queued" });
    expect(String(delivery.subject_snapshot).trim().length).toBeGreaterThan(1);
    expect(String(delivery.text_snapshot)).not.toContain("{{");
    expect(String(delivery.html_snapshot)).not.toContain("{{");
    expect(JSON.stringify(delivery.context)).not.toMatch(/password|authorization|bearer|mysql:\/\//i);

    const [jobs] = await databasePool.execute("SELECT kind,status FROM automation_jobs WHERE deduplication_key=?", [`template-test:${requestId}:dispatch`]);
    expect(jobs).toHaveLength(1);
    expect((jobs as Array<Record<string, unknown>>)[0]).toMatchObject({ kind: "email_dispatch", status: "queued" });
  });
});
