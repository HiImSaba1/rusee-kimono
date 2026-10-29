import { describe, expect, it } from "vitest";
import { normalizeSubjectEmail } from "./service";

describe("privacy subject identity", () => {
  it("normalizes a valid email without accepting arbitrary search input", () => {
    expect(normalizeSubjectEmail("  PERSON@Example.COM ")).toBe("person@example.com");
    expect(() => normalizeSubjectEmail("not an email")).toThrow("έγκυρη");
  });
});
