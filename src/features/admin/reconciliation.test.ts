import { describe, expect, it } from "vitest";
import { paymentReconciliationIssues } from "./reconciliation";

const matched = { amount_minor: 28900, currency: "EUR", payment_status: "captured", order_total_minor: 28900, order_currency: "EUR", order_payment_status: "paid", failed_event_count: 0 };

describe("payment reconciliation", () => {
  it("accepts a matching captured payment and paid order", () => expect(paymentReconciliationIssues(matched)).toEqual([]));
  it("flags financial and ledger mismatches", () => expect(paymentReconciliationIssues({ ...matched, amount_minor: 1, order_payment_status: "pending" })).toEqual(["Amount or currency mismatch", "Captured payment is not reflected on order"]));
  it("flags a paid order without a capture and webhook failures", () => expect(paymentReconciliationIssues({ ...matched, payment_status: "failed", failed_event_count: 1 })).toEqual(["Paid order has no captured payment", "Webhook processing failure"]));
});
