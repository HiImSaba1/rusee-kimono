import { describe, expect, it } from "vitest";
import { automationBackoffSeconds, sanitizeAutomationError } from "./policy";

describe("automation policy", () => {
  it("uses bounded exponential retry delays", () => {
    expect([1, 2, 3, 4].map(automationBackoffSeconds)).toEqual([30, 60, 120, 240]);
    expect(automationBackoffSeconds(99)).toBeLessThanOrEqual(3600);
  });

  it("removes credentials and connection strings from operator errors", () => {
    const safe = sanitizeAutomationError(new Error("password=hunter2 token:abc mysql://user:pass@host/db\nfailed"));
    expect(safe).not.toContain("hunter2");
    expect(safe).not.toContain("abc");
    expect(safe).not.toContain("user:pass");
    expect(safe).toContain("[redacted]");
  });
});
