import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateContactEnquiry } from "./schema";

const now = Date.now();

function validInput() {
  return {
    submissionId: randomUUID(),
    name: "  Sandra   Stratis ",
    email: "  SANDRA@EXAMPLE.COM ",
    subject: "order_question",
    orderNumber: "  RUS-123  ",
    message: "  I would like some help with my order.  ",
    locale: "el",
    website: "",
    startedAt: now - 2_000,
  };
}

describe("contact enquiry validation", () => {
  it("normalizes safe customer input", () => {
    const result = validateContactEnquiry(validInput(), now);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      name: "Sandra Stratis",
      email: "sandra@example.com",
      orderNumber: "RUS-123",
      locale: "el",
    });
  });

  it("rejects invalid subjects and oversized messages", () => {
    expect(validateContactEnquiry({ ...validInput(), subject: "other" }, now)).toEqual({ success: false, code: "invalid" });
    expect(validateContactEnquiry({ ...validInput(), message: "x".repeat(4_001) }, now)).toEqual({ success: false, code: "invalid" });
  });

  it("quietly identifies a filled honeypot", () => {
    expect(validateContactEnquiry({ ...validInput(), website: "https://spam.invalid" }, now)).toEqual({ success: false, code: "spam" });
  });

  it("rejects implausibly fast and expired forms", () => {
    expect(validateContactEnquiry({ ...validInput(), startedAt: now - 200 }, now)).toEqual({ success: false, code: "too_fast" });
    expect(validateContactEnquiry({ ...validInput(), startedAt: now - 86_400_001 }, now)).toEqual({ success: false, code: "expired" });
  });
});
