import "server-only";

import nodemailer from "nodemailer";
import type { ResultSetHeader } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";
import { renderStoredEmailTemplate,type SystemEmailTemplateKey } from "./templates";
import { sanitizeAutomationError } from "@/features/automation/policy";

type Template = "payment_confirmation" | "admin_new_order" | "fulfilment_update" | "contact_enquiry_notification" | "admin_return_request" | "return_status_update";
export type Delivery = {
  id: number;
  order_id: number | null;
  contact_enquiry_id: number | null;
  template: Template;
  recipient: string;
  reply_to: string | null;
  order_number: string | null;
  order_public_id: string | null;
  total_minor: number | null;
  currency: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_subject: string | null;
  contact_order_number: string | null;
  contact_message: string | null;
  contact_locale: "el" | "en" | null;
  context: { fulfilmentStatus?: string; shipment?: { carrierName?: string; trackingCode?: string; trackingUrl?: string | null }; requestPublicId?:string; reason?:string; returnStatus?:string } | string | null;
  subject_snapshot?: string | null;
  text_snapshot?: string | null;
  html_snapshot?: string | null;
};

const subjectLabels = {
  order_question: "Ερώτηση παραγγελίας / Order question",
  fit_sizing: "Εφαρμογή και μεγέθη / Fit and sizing",
  press: "Τύπος / Press",
  stockist: "Συνεργάτης λιανικής / Stockist enquiry",
  collaboration: "Συνεργασία / Collaboration",
} as const;

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]!));

function orderStatusUrl(publicId:string|null){if(!publicId)return null;try{const origin=new URL(process.env.APP_URL??"http://localhost:3000");if(process.env.NODE_ENV==="production"&&origin.protocol!=="https:")return null;return new URL(`/order/${publicId}`,origin).toString();}catch{return null;}}

function smtpConfiguration() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM;
  if (!host || !user || !pass || !from) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
    from,
  };
}

export function renderEmailContent(row: Delivery) {
  if (row.template === "contact_enquiry_notification") {
    const name = row.contact_name ?? "Unknown visitor";
    const email = row.contact_email ?? row.reply_to ?? "Unknown email";
    const subject = subjectLabels[row.contact_subject as keyof typeof subjectLabels] ?? "Contact enquiry";
    const order = row.contact_order_number ? `\nOrder: ${row.contact_order_number}` : "";
    const message = row.contact_message ?? "";
    return {
      subject: `Ruseè studio enquiry — ${subject}`,
      text: `New Ruseè contact enquiry\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}${order}\nLanguage: ${row.contact_locale ?? "unknown"}\n\nMessage:\n${message}`,
      html: `<h1>New Ruseè contact enquiry</h1><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p>${row.contact_order_number ? `<p><strong>Order:</strong> ${escapeHtml(row.contact_order_number)}</p>` : ""}<p><strong>Language:</strong> ${escapeHtml(row.contact_locale ?? "unknown")}</p><hr><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    };
  }

  const orderNumber = row.order_number ?? "Unknown order";
  const order = escapeHtml(orderNumber);
  const currency = row.currency ?? "EUR";
  const total = new Intl.NumberFormat("en-GB", { style: "currency", currency }).format((row.total_minor ?? 0) / 100);
  const statusUrl=orderStatusUrl(row.order_public_id);
  const statusText=statusUrl?`\n\nΚατάσταση παραγγελίας / Order status: ${statusUrl}`:"";
  const statusHtml=statusUrl?`<p><a href="${escapeHtml(statusUrl)}">Κατάσταση παραγγελίας / Order status</a></p>`:"";
  const context = typeof row.context === "string" ? JSON.parse(row.context) as { requestPublicId?:string; reason?:string; returnStatus?:string } : row.context;
  if (row.template === "admin_return_request") return { subject:`Return request for ${orderNumber}`,text:`A customer submitted a return request for ${orderNumber}. Reason: ${String(context?.reason??"other").replaceAll("_"," ")}. Review it in the protected admin.`,html:`<h1>New return request</h1><p>Order <strong>${order}</strong> needs review.</p><p>Reason: ${escapeHtml(String(context?.reason??"other").replaceAll("_"," "))}</p>` };
  if (row.template === "return_status_update") { const status=String(context?.returnStatus??"updated").replaceAll("_"," "); return {subject:`Ruseè · Αίτημα επιστροφής / Return request: ${status}`,text:`Το αίτημα επιστροφής για ${orderNumber} είναι τώρα: ${status}. Το μήνυμα δεν επιβεβαιώνει επιστροφή χρημάτων.\n\nYour return request is now ${status}. This message does not confirm a refund.${statusText}`,html:`<h1>Ενημέρωση αιτήματος επιστροφής.</h1><p>Το αίτημα για <strong>${order}</strong> είναι τώρα: ${escapeHtml(status)}.</p><p>Το μήνυμα δεν επιβεβαιώνει επιστροφή χρημάτων.</p><hr><h2>Return request update.</h2><p>Your request is now ${escapeHtml(status)}. This message does not confirm a refund.</p>${statusHtml}`}; }
  if (row.template === "admin_new_order") {
    return { subject: `New paid order ${orderNumber}`, text: `A verified payment was received for ${orderNumber}. Total: ${total}.`, html: `<h1>New paid order</h1><p>A verified payment was received for <strong>${order}</strong>.</p><p>Total: ${escapeHtml(total)}</p>` };
  }
  if (row.template === "fulfilment_update") {
    const parsed = typeof row.context === "string" ? JSON.parse(row.context) as { fulfilmentStatus?: string; shipment?: { carrierName?: string; trackingCode?: string; trackingUrl?: string | null } } : row.context;
    const status = String(parsed?.fulfilmentStatus ?? "updated").replaceAll("_", " ");
    const shipment = parsed?.shipment;
    const trackingText = shipment?.trackingCode ? `\nCourier: ${shipment.carrierName}\nTracking: ${shipment.trackingCode}${shipment.trackingUrl ? `\nTrack securely: ${shipment.trackingUrl}` : ""}` : "";
    const trackingHtml = shipment?.trackingCode ? `<p><strong>Courier:</strong> ${escapeHtml(shipment.carrierName ?? "")}</p><p><strong>Tracking:</strong> ${escapeHtml(shipment.trackingCode)}</p>${shipment.trackingUrl ? `<p><a href="${escapeHtml(shipment.trackingUrl)}">Track your order</a></p>` : ""}` : "";
    return { subject: `Ruseè · Παραγγελία / Order ${orderNumber}: ${status}`, text: `Η παραγγελία ${orderNumber} είναι τώρα: ${status}.${trackingText}\n\nYour order is now ${status}.${statusText}`, html: `<h1>Η παραγγελία σας ενημερώθηκε.</h1><p>Η παραγγελία <strong>${order}</strong> είναι τώρα: ${escapeHtml(status)}.</p>${trackingHtml}<hr><h2>Your Ruseè order was updated.</h2><p>Your order is now ${escapeHtml(status)}.</p>${statusHtml}` };
  }
  return { subject: `Ruseè · Επιβεβαίωση παραγγελίας / Order confirmed ${orderNumber}`, text: `Ευχαριστούμε. Η πληρωμή για ${orderNumber} επιβεβαιώθηκε. Σύνολο: ${total}.\n\nThank you. Payment was verified. Total: ${total}.${statusText}`, html: `<h1>Ευχαριστούμε που επιλέξατε Ruseè.</h1><p>Η πληρωμή για <strong>${order}</strong> επιβεβαιώθηκε.</p><p>Σύνολο: ${escapeHtml(total)}</p><hr><h2>Thank you for choosing Ruseè.</h2><p>Payment was verified. Total: ${escapeHtml(total)}.</p>${statusHtml}` };
}

function parseContext(row:Delivery){if(typeof row.context!=="string")return row.context??{};try{return JSON.parse(row.context) as Exclude<Delivery["context"],string|null>;}catch{return {};}}
function appUrl(path:string){try{const origin=new URL(process.env.APP_URL??"http://localhost:3000");if(process.env.NODE_ENV==="production"&&origin.protocol!=="https:")return "";return new URL(path,origin).toString();}catch{return "";}}
function templateValues(row:Delivery){const context=parseContext(row);const shipment=context.shipment;const currency=row.currency??"EUR";const total=new Intl.NumberFormat("en-GB",{style:"currency",currency}).format((row.total_minor??0)/100);return {order_number:row.order_number??row.contact_order_number??"",order_total:total,order_status_url:row.order_public_id?appUrl(`/order/${row.order_public_id}`):"",admin_order_url:row.order_public_id?appUrl(`/admin/orders/${row.order_public_id}`):"",fulfilment_status:String(context.fulfilmentStatus??"updated").replaceAll("_"," "),carrier_name:shipment?.carrierName??"",tracking_code:shipment?.trackingCode??"",tracking_url:shipment?.trackingUrl??"",customer_name:row.contact_name??"",customer_email:row.contact_email??row.reply_to??"",enquiry_subject:subjectLabels[row.contact_subject as keyof typeof subjectLabels]??row.contact_subject??"",customer_message:row.contact_message??"",locale:row.contact_locale??"unknown",return_reason:String(context.reason??"other").replaceAll("_"," "),admin_return_url:appUrl("/admin/returns"),return_status:String(context.returnStatus??"updated").replaceAll("_"," ")};}

export async function resolveEmailContent(row:Delivery){
  if(row.subject_snapshot&&row.text_snapshot&&row.html_snapshot)return {subject:row.subject_snapshot,text:row.text_snapshot,html:row.html_snapshot,templateVersionId:null};
  const [rows]=await databasePool.execute("SELECT v.id,v.subject_el,v.html_el,v.text_el FROM email_templates t INNER JOIN email_template_versions v ON v.id=t.active_version_id WHERE t.template_key=? AND t.`system`=true AND t.status='active' LIMIT 1",[row.template]);
  const version=(rows as Array<{id:number;subject_el:string;html_el:string;text_el:string}>)[0];
  if(!version)return {...renderEmailContent(row),templateVersionId:null};
  try{return {...renderStoredEmailTemplate(row.template as SystemEmailTemplateKey,{subject:version.subject_el,text:version.text_el,html:version.html_el},templateValues(row)),templateVersionId:version.id};}catch{return {...renderEmailContent(row),templateVersionId:null};}
}

export const EMAIL_DELIVERY_STALE_MINUTES = 15;
export const sanitizeEmailDeliveryError = sanitizeAutomationError;

export async function recoverStaleEmailDeliveries(
  options: { idempotencyPrefix?: string } = {},
) {
  const prefix = options.idempotencyPrefix?.slice(0, 120);
  const scopeSql = prefix ? " AND idempotency_key LIKE ?" : "";
  const values = prefix ? [`${prefix}%`] : [];
  const staleLeaseSql = `updated_at < DATE_SUB(NOW(), INTERVAL ${EMAIL_DELIVERY_STALE_MINUTES} MINUTE)`;

  const [retried] = await databasePool.execute<ResultSetHeader>(
    `UPDATE email_deliveries
     SET status='queued', last_error='Delivery lease expired; queued for safe retry', updated_at=NOW()
     WHERE status='sending' AND attempt_count<5 AND ${staleLeaseSql}${scopeSql}`,
    values,
  );
  const [failed] = await databasePool.execute<ResultSetHeader>(
    `UPDATE email_deliveries
     SET status='failed', last_error='Maximum delivery attempts reached', updated_at=NOW()
     WHERE status='sending' AND attempt_count>=5 AND ${staleLeaseSql}${scopeSql}`,
    values,
  );

  return { retried: retried.affectedRows, failed: failed.affectedRows };
}

export async function deliverQueuedEmails(limit = 5) {
  await recoverStaleEmailDeliveries();
  const smtp = smtpConfiguration();
  if (!smtp) return { sent: 0, failed: 0, configured: false };
  const transport = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: smtp.auth, requireTLS: !smtp.secure });
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < limit; index++) {
    const connection = await databasePool.getConnection();
    let row: Delivery | undefined;
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute(
        `SELECT e.id, e.order_id, e.contact_enquiry_id, e.template, e.recipient, e.reply_to, e.context,
          e.subject_snapshot, e.text_snapshot, e.html_snapshot,
          o.order_number, o.public_id AS order_public_id, o.total_minor, o.currency,
          c.name AS contact_name, c.email AS contact_email, c.subject AS contact_subject,
          c.order_number AS contact_order_number, c.message AS contact_message, c.locale AS contact_locale
         FROM email_deliveries e
         LEFT JOIN orders o ON o.id = e.order_id
         LEFT JOIN contact_enquiries c ON c.id = e.contact_enquiry_id
         WHERE e.status = 'queued' AND e.attempt_count < 5
         ORDER BY e.created_at LIMIT 1 FOR UPDATE`,
      );
      row = (rows as Delivery[])[0];
      if (!row) {
        await connection.commit();
        break;
      }
      await connection.execute("UPDATE email_deliveries SET status='sending', attempt_count=attempt_count+1, last_error=NULL, updated_at=NOW() WHERE id=?", [row.id]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (!row) continue;
    try {
      const body = await resolveEmailContent(row);
      if (!row.subject_snapshot) await databasePool.execute(
        "UPDATE email_deliveries SET subject_snapshot=?, text_snapshot=?, html_snapshot=?, template_version_id=COALESCE(template_version_id,?) WHERE id=? AND subject_snapshot IS NULL",
        [body.subject, body.text, body.html, body.templateVersionId, row.id],
      );
      const result = await transport.sendMail({ from: smtp.from, to: row.recipient, replyTo: row.reply_to ?? undefined, subject: body.subject, text: body.text, html: body.html });
      await databasePool.execute("UPDATE email_deliveries SET status='sent', provider_message_id=?, sent_at=NOW(), updated_at=NOW() WHERE id=?", [String(result.messageId).slice(0, 255), row.id]);
      sent++;
    } catch (error) {
      const message = sanitizeEmailDeliveryError(error);
      await databasePool.execute("UPDATE email_deliveries SET status='failed', last_error=?, updated_at=NOW() WHERE id=?", [message, row.id]);
      failed++;
    }
  }
  return { sent, failed, configured: true };
}
