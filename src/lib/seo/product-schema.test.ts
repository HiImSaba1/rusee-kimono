import { describe, expect, it } from "vitest";
import { productStructuredData, safeJsonLd } from "./product-schema";

describe("truthful product structured data", () => {
  it("uses stored price and stock without review or rating claims", () => {
    const schema = productStructuredData({ locale: "el", slug: "night", product: { title: "Kimono", description: "Real description" }, design: { name: "Night" }, images: [], variants: [{ variant: { sku: "SKU-1", priceMinor: 12345, currency: "EUR" }, stock: { onHand: 2, reserved: 1 } }] });
    expect(schema.offers?.[0]).toMatchObject({ price: "123.45", priceCurrency: "EUR", availability: "https://schema.org/InStock" });
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema).not.toHaveProperty("review");
  });

  it("escapes markup-capable characters in JSON-LD", () => {
    expect(safeJsonLd({ value: "</script>" })).not.toContain("</script>");
  });
});
