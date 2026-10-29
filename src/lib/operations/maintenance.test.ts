import { describe, expect, it } from "vitest";
import { isMaintenanceBypassPath, maintenanceModeEnabled, shouldShowMaintenance } from "./maintenance";

describe("maintenance routing", () => {
  it("requires an explicit true value", () => {
    expect(maintenanceModeEnabled("true")).toBe(true);
    expect(maintenanceModeEnabled(" TRUE ")).toBe(true);
    expect(maintenanceModeEnabled("false")).toBe(false);
    expect(maintenanceModeEnabled(undefined)).toBe(false);
  });

  it("keeps operational and in-flight commerce routes available", () => {
    for (const path of ["/maintenance", "/admin", "/admin/orders", "/api/health/ready", "/api/payments/webhook", "/order/public-id", "/payment/return"]) {
      expect(isMaintenanceBypassPath(path), path).toBe(true);
      expect(shouldShowMaintenance(path, true), path).toBe(false);
    }
  });

  it("covers new storefront and checkout traffic", () => {
    for (const path of ["/", "/shop", "/shop/nocturne", "/cart", "/checkout", "/contact", "/terms"]) {
      expect(shouldShowMaintenance(path, true), path).toBe(true);
      expect(shouldShowMaintenance(path, false), path).toBe(false);
    }
  });
});
