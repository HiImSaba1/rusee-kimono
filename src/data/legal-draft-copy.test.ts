import { describe, expect, it } from "vitest";
import { legalDraftsBySlug } from "./legal-draft-copy";

describe("legal starter drafts", () => {
  it("provides four complete bilingual structures with visible client placeholders", () => {
    expect(Object.keys(legalDraftsBySlug)).toEqual(["terms", "privacy-policy", "returns", "cookies"]);
    for (const draft of Object.values(legalDraftsBySlug)) {
      expect(draft.el.sections.length).toBeGreaterThanOrEqual(5);
      expect(draft.el.sections).toHaveLength(draft.en.sections.length);
      expect(draft.el.sections.some(section => section.content.includes("ADD_YOUR_"))).toBe(true);
      expect(draft.en.sections.some(section => section.content.includes("ADD_YOUR_"))).toBe(true);
    }
  });
});
