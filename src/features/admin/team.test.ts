import { describe, expect, it } from "vitest";
import { staffPassword, staffRole, staffUsername } from "./team";

describe("admin team validation", () => {
  it("does not create owners through the routine staff workflow", () => { expect(staffRole.safeParse("manager").success).toBe(true); expect(staffRole.safeParse("owner").success).toBe(false); });
  it("requires strong temporary passwords", () => { expect(staffPassword.safeParse("weak-password").success).toBe(false); expect(staffPassword.safeParse("Rusee-Team#2048").success).toBe(true); });
  it("reserves local fixture usernames", () => { expect(staffUsername.safeParse("sandra.manager").success).toBe(true); expect(staffUsername.safeParse("__rusee_e2e_admin__").success).toBe(false); });
});
