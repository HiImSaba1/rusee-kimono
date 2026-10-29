export type CatalogueReadinessRow = {
  id: number; slug: string; name: string; name_el: string | null; description_el: string | null; description_en: string | null; details_el: string | null; details_en: string | null;
  active: number; variant_count: number; distinct_sku_count: number; missing_inventory_count: number; invalid_price_count: number; missing_media_count: number;
};

export type CatalogueReadiness = CatalogueReadinessRow & { issues: string[]; structurallyComplete: boolean };

const present = (value: string | null, minimum = 3) => (value?.trim().length ?? 0) >= minimum;

export function catalogueReadiness(row: CatalogueReadinessRow): CatalogueReadiness {
  const issues: string[] = [];
  if (!present(row.name_el)) issues.push("missing_name_el");
  if (!present(row.description_el, 10) || !present(row.description_en, 10)) issues.push("missing_bilingual_description");
  if (!present(row.details_el, 10) || !present(row.details_en, 10)) issues.push("missing_bilingual_details");
  if (row.variant_count <= 0) issues.push("missing_variants");
  if (row.distinct_sku_count !== row.variant_count) issues.push("duplicate_sku");
  if (row.missing_inventory_count > 0) issues.push("missing_inventory");
  if (row.invalid_price_count > 0) issues.push("invalid_price");
  if (row.missing_media_count > 0) issues.push("missing_size_media");
  return { ...row, issues, structurallyComplete: issues.length === 0 };
}
