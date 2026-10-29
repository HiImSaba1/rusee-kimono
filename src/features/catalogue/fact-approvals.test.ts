import { describe, expect, it } from "vitest";
import { approvalMutation, factApprovalCategories } from "./fact-approvals";

describe("product fact approvals", () => {
  it("keeps the six bounded approval categories", () => expect(factApprovalCategories).toHaveLength(6));
  it("requires confirmation", () => expect(() => approvalMutation("approved", false)).toThrow(/confirmation/i));
  it("distinguishes approval from returning to pending", () => {
    expect(approvalMutation("approved", true).action).toBe("catalogue.fact_approved");
    expect(approvalMutation("pending", true).action).toBe("catalogue.fact_returned_pending");
  });
});
