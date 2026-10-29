import { describe, expect, it } from "vitest";
import { attentionState } from "./overview-attention";

describe("overview attention state", () => {
  it("keeps zero-count cards calm", () => { expect(attentionState(0).tone).toBe("clear"); });
  it("separates operational work from external blockers", () => { expect(attentionState(2).tone).toBe("attention"); expect(attentionState(2, "external").tone).toBe("external"); });
});
