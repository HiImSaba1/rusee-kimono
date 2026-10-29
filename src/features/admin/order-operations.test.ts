import { describe, expect, it } from "vitest";
import { fulfilmentEligibility, fulfilmentTransitions, returnTransitionOptions } from "./order-operations";

describe("admin commerce operations", () => {
  it("requires one matching captured payment before fulfilment", () => {
    expect(fulfilmentEligibility({ orderPaymentStatus: "paid", matchingCapturedPayments: 1, failedPaymentEvents: 0 }).eligible).toBe(true);
    expect(fulfilmentEligibility({ orderPaymentStatus: "paid", matchingCapturedPayments: 0, failedPaymentEvents: 0 }).eligible).toBe(false);
    expect(fulfilmentEligibility({ orderPaymentStatus: "pending", matchingCapturedPayments: 1, failedPaymentEvents: 0 }).eligible).toBe(false);
  });

  it("keeps historical failed events visible without discarding a matching capture", () => {
    expect(fulfilmentEligibility({ orderPaymentStatus: "paid", matchingCapturedPayments: 1, failedPaymentEvents: 1 }).state).toBe("review");
  });

  it("does not let fulfilment mark an order returned", () => {
    expect(fulfilmentTransitions.delivered).toBeUndefined();
    expect(fulfilmentTransitions.shipped?.fulfilmentStatus).toBe("delivered");
  });

  it("offers only valid return-request transitions", () => {
    expect(returnTransitionOptions.pending).toEqual(["approved", "rejected"]);
    expect(returnTransitionOptions.rejected).toEqual(["closed"]);
    expect(returnTransitionOptions.received).toEqual(["closed"]);
  });
});
