import "server-only";

import { randomUUID } from "node:crypto";
import type { ResultSetHeader } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";
import { AUTOMATION_MAX_ATTEMPTS } from "@/features/automation/policy";
import {
  assertAllowedTemplateVariables,
  renderTemplateString,
  systemEmailTemplateKeys,
  type SystemEmailTemplateKey,
} from "./templates";

type TemplateVersionRow = {
  template_key: SystemEmailTemplateKey;
  subject_el: string;
  subject_en: string;
  html_el: string;
  html_en: string;
  text_el: string;
  text_en: string;
};

export type TemplateTestDeliveryInput = {
  adminId: number;
  templateId: number;
  versionId: number;
  recipient: string;
  locale: "el" | "en";
  requestId: string;
};

const sampleVariables: Record<string, string> = {
  order_number: "RUSEE-TEST",
  order_total: "€120.00",
  order_status_url: "https://example.invalid/order/test",
  admin_order_url: "https://example.invalid/admin/orders/test",
  fulfilment_status: "shipped",
  carrier_name: "Sample courier",
  tracking_code: "TEST-TRACKING",
  tracking_url: "https://example.invalid/tracking",
  customer_name: "Sample customer",
  customer_email: "sample@example.invalid",
  enquiry_subject: "Sample enquiry",
  customer_message: "This is sample-only content.",
  return_reason: "sample reason",
  admin_return_url: "https://example.invalid/admin/returns",
  return_status: "approved",
};

export async function queueTemplateTestDelivery(input: TemplateTestDeliveryInput) {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT t.template_key,v.subject_el,v.subject_en,v.html_el,v.html_en,v.text_el,v.text_en
       FROM email_templates t
       INNER JOIN email_template_versions v ON v.template_id=t.id
       WHERE t.id=? AND v.id=? AND t.\`system\`=true AND t.status<>'archived'
       LIMIT 1 FOR UPDATE`,
      [input.templateId, input.versionId],
    );
    const template = (rows as TemplateVersionRow[])[0];
    if (!template || !systemEmailTemplateKeys.includes(template.template_key)) {
      throw new Error("A current system template version is required for test delivery.");
    }

    assertAllowedTemplateVariables(template.template_key, [
      template.subject_el,
      template.subject_en,
      template.html_el,
      template.html_en,
      template.text_el,
      template.text_en,
    ]);
    const variables = { ...sampleVariables, locale: input.locale };
    const subject = renderTemplateString(input.locale === "el" ? template.subject_el : template.subject_en, variables);
    const html = renderTemplateString(input.locale === "el" ? template.html_el : template.html_en, variables);
    const text = renderTemplateString(input.locale === "el" ? template.text_el : template.text_en, variables);
    const deliveryKey = `template-test:${input.versionId}:${input.requestId}`;
    const [delivery] = await connection.execute<ResultSetHeader>(
      "INSERT IGNORE INTO email_deliveries (template,recipient,idempotency_key,status,context,template_version_id,subject_snapshot,text_snapshot,html_snapshot) VALUES (?,?,?,'queued',?,?,?,?,?)",
      [template.template_key, input.recipient, deliveryKey, JSON.stringify({ test: true, locale: input.locale }), input.versionId, subject, text, html],
    );

    if (delivery.affectedRows) {
      await connection.execute(
        "INSERT IGNORE INTO automation_jobs (public_id,deduplication_key,kind,payload,run_at,max_attempts) VALUES (?,?,\'email_dispatch\',?,NOW(),?)",
        [randomUUID(), `template-test:${input.requestId}:dispatch`, JSON.stringify({ testDelivery: true }), AUTOMATION_MAX_ATTEMPTS],
      );
      await connection.execute(
        "INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,\'email_template.test_queued\',\'email_template\',?,?)",
        [input.adminId, String(input.templateId), JSON.stringify({ versionId: input.versionId, locale: input.locale, requestId: input.requestId })],
      );
    }
    await connection.commit();
    return { queued: delivery.affectedRows === 1 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
