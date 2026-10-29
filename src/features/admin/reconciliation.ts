export type ReconciliationInput = {
  amount_minor: number; currency: string; payment_status: string; order_total_minor: number;
  order_currency: string; order_payment_status: string; failed_event_count: number;
};

export function paymentReconciliationIssues(row: ReconciliationInput) {
  const issues: string[] = [];
  if (row.amount_minor !== row.order_total_minor || row.currency !== row.order_currency) issues.push("Amount or currency mismatch");
  if (row.payment_status === "captured" && row.order_payment_status !== "paid") issues.push("Captured payment is not reflected on order");
  if (row.order_payment_status === "paid" && row.payment_status !== "captured") issues.push("Paid order has no captured payment");
  if (Number(row.failed_event_count) > 0) issues.push("Webhook processing failure");
  return issues;
}
