import { describe, expect, it } from "vitest";
import { activityCategory, describeAuditAction } from "./activity";

describe("admin activity presentation", () => {
  it("accepts only fixed operational filters", () => { expect(activityCategory.safeParse("sales").success).toBe(true); expect(activityCategory.safeParse("metadata").success).toBe(false); });
  it("uses safe human-readable labels without audit metadata", () => { expect(describeAuditAction("content.information.published")).toEqual({ el: "Δημοσίευση σελίδας", en: "Information page published" }); expect(describeAuditAction("future.safe_action").en).toBe("future · safe action"); });
});
