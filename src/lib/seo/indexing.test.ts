import { describe, expect, it } from "vitest";
import { isPrivateRoutePath, privateRouteRobots } from "./indexing";

describe("private route indexing boundary", () => {
  it.each(["/admin", "/admin/orders", "/api/health/live", "/cart", "/checkout", "/order/example", "/payment/fake/example"])(
    "keeps %s outside search indexes",
    (pathname) => expect(isPrivateRoutePath(pathname)).toBe(true),
  );

  it.each(["/", "/shop", "/shop/night-garden", "/about", "/information"])(
    "does not classify public route %s as private",
    (pathname) => expect(isPrivateRoutePath(pathname)).toBe(false),
  );

  it("forbids indexing, following, snippets, archives and image indexing", () => {
    expect(privateRouteRobots).toMatchObject({ index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true });
  });
});
