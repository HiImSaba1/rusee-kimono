import { describe, expect, it } from "vitest";
import { catalogueReadiness, type CatalogueReadinessRow } from "./readiness";

const complete: CatalogueReadinessRow = { id: 1, slug: "nocturne", name: "Nocturne", name_el: "Νυχτερινό", description_el: "Ελληνική περιγραφή", description_en: "English description", details_el: "Ελληνικές λεπτομέρειες", details_en: "English design details", active: 1, variant_count: 3, distinct_sku_count: 3, missing_inventory_count: 0, invalid_price_count: 0, missing_media_count: 0 };

describe("catalogueReadiness", () => {
  it("separates structural completeness from external product approval", () => expect(catalogueReadiness(complete)).toMatchObject({ structurallyComplete: true, issues: [] }));
  it("reports bounded actionable structural issues", () => expect(catalogueReadiness({ ...complete, description_el: "", distinct_sku_count: 2, missing_media_count: 1 }).issues).toEqual(["missing_bilingual_description", "duplicate_sku", "missing_size_media"]));
});
