import { describe, expect, it } from "vitest";
import { shipmentInput } from "./shipment";

describe("shipment input", () => {
  it("accepts courier-neutral HTTPS tracking", () => expect(shipmentInput.parse({ carrierName: "Example Courier", trackingCode: "AB-123", trackingUrl: "https://tracking.example/AB-123" })).toMatchObject({ trackingCode: "AB-123" }));
  it("rejects unsafe tracking protocols", () => expect(() => shipmentInput.parse({ carrierName: "Example Courier", trackingCode: "AB-123", trackingUrl: "javascript:alert(1)" })).toThrow());
  it("allows the tracking link to be omitted", () => expect(shipmentInput.parse({ carrierName: "Example Courier", trackingCode: "AB-123", trackingUrl: "" }).trackingUrl).toBeNull());
});
