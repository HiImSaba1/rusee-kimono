import "server-only";
import { z } from "zod";
import { databasePool } from "@/lib/db/connection";

export const activityCategory = z.enum(["all", "access", "sales", "catalogue", "customers", "system"]);
export type ActivityCategory = z.infer<typeof activityCategory>;

export const activityCategoryLabels: Record<ActivityCategory, { el: string; en: string }> = {
  all: { el: "Όλα", en: "All" },
  access: { el: "Πρόσβαση", en: "Access" },
  sales: { el: "Πωλήσεις", en: "Sales" },
  catalogue: { el: "Κατάλογος", en: "Catalogue" },
  customers: { el: "Πελάτες", en: "Customers" },
  system: { el: "Σύστημα", en: "System" },
};

const categoryPrefixes: Record<Exclude<ActivityCategory, "all">, string[]> = {
  access: ["admin."],
  sales: ["order.", "payment.", "payment_event.", "refund.", "return_request.", "shipment."],
  catalogue: ["catalogue.", "inventory."],
  customers: ["contact.", "email.", "email_", "privacy.", "content."],
  system: ["health.", "maintenance.", "system."],
};

const exactLabels: Record<string, { el: string; en: string }> = {
  "admin.login": { el: "Είσοδος διαχειριστή", en: "Admin signed in" },
  "admin.logout": { el: "Έξοδος διαχειριστή", en: "Admin signed out" },
  "admin.login_failed": { el: "Αποτυχημένη είσοδος", en: "Failed sign-in" },
  "inventory.adjust": { el: "Προσαρμογή αποθέματος", en: "Inventory adjusted" },
  "order.fulfilment.advance": { el: "Ενημέρωση εκτέλεσης παραγγελίας", en: "Order fulfilment advanced" },
  "refund.request": { el: "Αίτημα επιστροφής χρημάτων", en: "Refund requested" },
  "payment.reconciliation.review": { el: "Έλεγχος συμφωνίας πληρωμής", en: "Payment reconciliation reviewed" },
  "payment_event.reconciliation.review": { el: "Έλεγχος provider event", en: "Provider event reviewed" },
  "return_request.status": { el: "Ενημέρωση αιτήματος επιστροφής", en: "Return request updated" },
  "email.retry": { el: "Επανάληψη αποστολής email", en: "Email retry requested" },
  "content.information.draft_saved": { el: "Αποθήκευση πρόχειρης σελίδας", en: "Information draft saved" },
  "content.information.published": { el: "Δημοσίευση σελίδας", en: "Information page published" },
  "content.information.published_updated": { el: "Ενημέρωση δημοσιευμένης σελίδας", en: "Published page updated" },
  "content.information.withdrawn": { el: "Απόσυρση σελίδας", en: "Information page withdrawn" },
};

export function describeAuditAction(action: string) {
  if (exactLabels[action]) return exactLabels[action];
  const readable = action.replaceAll(".", " · ").replaceAll("_", " ");
  return { el: readable, en: readable };
}

export type AdminActivityRow = { id: number; action: string; entity_type: string; entity_id: string | null; created_at: Date; username: string | null };

export async function getAdminActivity(input: { category: ActivityCategory; page: number; pageSize?: number }) {
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 10), 50);
  const prefixes = input.category === "all" ? [] : categoryPrefixes[input.category];
  const where = prefixes.length ? `WHERE (${prefixes.map(() => "a.action LIKE ?").join(" OR ")})` : "";
  const values = prefixes.map((prefix) => `${prefix}%`);
  const [countRows] = await databasePool.execute(`SELECT COUNT(*) AS total FROM admin_audit_events a ${where}`, values);
  const total = Number((countRows as Array<{ total: number }>)[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(input.page, 1), totalPages);
  const offset = (page - 1) * pageSize;
  const [rows] = await databasePool.execute(
    `SELECT a.id,a.action,a.entity_type,a.entity_id,a.created_at,u.username
     FROM admin_audit_events a LEFT JOIN admin_users u ON u.id=a.admin_user_id
     ${where} ORDER BY a.id DESC LIMIT ${pageSize} OFFSET ${offset}`,
    values,
  );
  return { rows: rows as AdminActivityRow[], page, pageSize, total, totalPages };
}
