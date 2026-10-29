import "server-only";
import type { RowDataPacket } from "mysql2";
import { databasePool } from "@/lib/db/connection";
import { catalogueReadiness, type CatalogueReadinessRow } from "@/features/catalogue/readiness";
import { factApprovalCategories, type FactApprovalCategory } from "@/features/catalogue/fact-approvals";

export async function getCatalogueReadiness() {
  const [rows] = await databasePool.query<RowDataPacket[]>(`SELECT d.id, d.slug, d.name, d.name_el, d.description_el, d.description_en, d.details_el, d.details_en, d.active,
    COUNT(DISTINCT pv.id) AS variant_count, COUNT(DISTINCT pv.sku) AS distinct_sku_count,
    SUM(CASE WHEN pv.active=1 AND i.id IS NULL THEN 1 ELSE 0 END) AS missing_inventory_count,
    SUM(CASE WHEN pv.active=1 AND pv.price_minor<=0 THEN 1 ELSE 0 END) AS invalid_price_count,
    SUM(CASE WHEN pv.active=1 AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.design_id=d.id AND pi.size_id=pv.size_id AND COALESCE(pi.alt_el,'')<>'' AND COALESCE(pi.alt_en,'')<>'') THEN 1 ELSE 0 END) AS missing_media_count
    FROM designs d LEFT JOIN product_variants pv ON pv.design_id=d.id LEFT JOIN inventory i ON i.variant_id=pv.id
    GROUP BY d.id, d.slug, d.name, d.name_el, d.description_el, d.description_en, d.details_el, d.details_en, d.active ORDER BY d.sort_order, d.id`);
  const [approvalRows] = await databasePool.query<RowDataPacket[]>("SELECT design_id,category,status,approved_at FROM design_fact_approvals");
  const approvalsByDesign = new Map<number, Map<FactApprovalCategory, { status: "pending" | "approved"; approvedAt: Date | null }>>();
  for (const row of approvalRows) {
    const designId = Number(row.design_id);
    const category = String(row.category) as FactApprovalCategory;
    if (!factApprovalCategories.includes(category)) continue;
    const designApprovals = approvalsByDesign.get(designId) ?? new Map();
    designApprovals.set(category, { status: row.status === "approved" ? "approved" : "pending", approvedAt: row.approved_at ? new Date(row.approved_at) : null });
    approvalsByDesign.set(designId, designApprovals);
  }
  return rows.map((row) => ({ ...catalogueReadiness({
    id: Number(row.id), slug: String(row.slug), name: String(row.name), name_el: row.name_el ? String(row.name_el) : null,
    description_el: row.description_el ? String(row.description_el) : null, description_en: row.description_en ? String(row.description_en) : null,
    details_el: row.details_el ? String(row.details_el) : null, details_en: row.details_en ? String(row.details_en) : null, active: Number(row.active),
    variant_count: Number(row.variant_count), distinct_sku_count: Number(row.distinct_sku_count), missing_inventory_count: Number(row.missing_inventory_count), invalid_price_count: Number(row.invalid_price_count), missing_media_count: Number(row.missing_media_count),
  } satisfies CatalogueReadinessRow), approvals: factApprovalCategories.map((category) => ({ category, ...(approvalsByDesign.get(Number(row.id))?.get(category) ?? { status: "pending" as const, approvedAt: null }) })) }));
}
