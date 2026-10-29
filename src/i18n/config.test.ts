import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "./config";

describe("Ruseè locale configuration", () => {
  it("uses Greek as the primary fallback and English as secondary", () => {
    expect(defaultLocale).toBe("el");
    expect(locales).toEqual(["el", "en"]);
  });

  it("accepts only supported locale identifiers", () => {
    expect(isLocale("el")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("gr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
