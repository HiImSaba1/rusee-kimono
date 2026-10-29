import { describe, expect, it } from "vitest";
import { availableUnits, compatibleSizeIds, selectedVariant, type SellableVariant } from "./product-selection";

const variants: SellableVariant[] = [
  { variant: { id: 1, designId: 1, colourId: 10, sizeId: 100, sku: "A", priceMinor: 10000, currency: "EUR" }, stock: { onHand: 3, reserved: 1 } },
  { variant: { id: 2, designId: 1, colourId: 10, sizeId: 200, sku: "B", priceMinor: 10000, currency: "EUR" }, stock: null },
  { variant: { id: 3, designId: 2, colourId: 10, sizeId: 100, sku: "C", priceMinor: 11000, currency: "EUR" }, stock: { onHand: 4, reserved: 0 } },
];

describe("product selection", () => {
  it("resolves only an exact design, colour and size combination", () => {
    expect(selectedVariant(variants, 1, 10, 100)?.variant.sku).toBe("A");
    expect(selectedVariant(variants, 2, 10, 100)?.variant.sku).toBe("C");
    expect(selectedVariant(variants, 1, 20, 100)).toBeUndefined();
  });

  it("never reports negative availability", () => {
    expect(availableUnits(variants[0])).toBe(2);
    expect(availableUnits({ ...variants[0], stock: { onHand: 1, reserved: 3 } })).toBe(0);
    expect(availableUnits(variants[1])).toBe(0);
  });

  it("identifies sizes that exist for the selected colour", () => {
    expect([...compatibleSizeIds(variants, 1, 10)]).toEqual([100, 200]);
    expect(compatibleSizeIds(variants, 1, 20).size).toBe(0);
  });
});
