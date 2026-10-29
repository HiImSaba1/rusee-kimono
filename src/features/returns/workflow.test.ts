import { describe, expect, it } from "vitest";
import { assertReturnTransition, returnRequestInput } from "./workflow";
describe("return request workflow",()=>{
  it("accepts bounded customer input",()=>expect(returnRequestInput.parse({email:"buyer@example.com",reason:"size_fit",customerNote:"The fit is not suitable."}).reason).toBe("size_fit"));
  it("allows explicit review progression",()=>expect(assertReturnTransition("approved","received")).toEqual({from:"approved",to:"received"}));
  it("prevents reopening a closed request",()=>expect(()=>assertReturnTransition("closed","pending")).toThrow());
});
