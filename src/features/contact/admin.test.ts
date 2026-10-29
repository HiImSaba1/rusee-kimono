import { describe, expect, it } from "vitest";
import { nextEnquiryStatus } from "./admin";

describe("contact enquiry workflow", () => {
  it("advances through the audited workflow in one direction", () => {
    expect(nextEnquiryStatus("new")).toBe("read");
    expect(nextEnquiryStatus("read")).toBe("replied");
    expect(nextEnquiryStatus("replied")).toBe("closed");
    expect(nextEnquiryStatus("closed")).toBeNull();
  });
});
