import { describe, expect, it } from "vitest";
import { approvalFlag, launchApprovals, launchApprovalsComplete } from "./launch-approvals";

describe("launch approvals", () => {
  it("accepts only an explicit true value", () => {
    expect(approvalFlag("true")).toBe(true);
    expect(approvalFlag(" TRUE ")).toBe(true);
    expect(approvalFlag("yes")).toBe(false);
    expect(approvalFlag(undefined)).toBe(false);
  });

  it("defaults every external approval to unapproved", () => {
    const approvals = launchApprovals({});
    expect(approvals).toHaveLength(7);
    expect(approvals.every((item) => !item.approved)).toBe(true);
    expect(launchApprovalsComplete({})).toBe(false);
    expect(approvals.every((item) => item.waitingEl.length > 0 && item.implementationEn.length > 0)).toBe(true);
  });

  it("requires every independent owner to approve launch", () => {
    const environment = Object.fromEntries(launchApprovals({}).map((item) => [item.key, "true"]));
    expect(launchApprovalsComplete(environment)).toBe(true);
  });
});
