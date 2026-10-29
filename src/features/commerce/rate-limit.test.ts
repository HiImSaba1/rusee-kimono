import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/connection", () => ({ databasePool: {} }));

describe("commerce rate-limit fingerprint", () => {
  it("is stable, scoped, and never contains the client address", async () => {
    const previousSecret = process.env.ADMIN_SESSION_SECRET;
    process.env.ADMIN_SESSION_SECRET = "test-session-secret-long-enough";
    const { commerceRateLimitKey } = await import("./rate-limit");
    const request = new Request("https://rusee.gr/api/orders", { headers: { "x-forwarded-for": "203.0.113.9", "user-agent": "Rusee test" } });
    const order = commerceRateLimitKey(request, "order");
    expect(order).toHaveLength(64);
    expect(order).not.toContain("203.0.113.9");
    expect(commerceRateLimitKey(request, "order")).toBe(order);
    expect(commerceRateLimitKey(request, "payment")).not.toBe(order);
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = previousSecret;
  });
});
