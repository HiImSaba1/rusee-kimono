"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { databasePool } from "@/lib/db/connection";

const imageInput = z.object({ productId: z.coerce.number().int().positive(), designId: z.string(), colourId: z.string().default(""), sizeId: z.string().default(""), src: z.string().trim().min(5).max(500).regex(/^\/(?:images|webp)\/[A-Za-z0-9/_ .-]+$/), altEl: z.string().trim().min(5).max(240), altEn: z.string().trim().min(5).max(240), sortOrder: z.coerce.number().int().min(-999).max(999) });
const nullableId = (value: string) => value ? z.coerce.number().int().positive().parse(value) : null;
const refresh = (designId?: number | null) => { revalidatePath("/admin/media"); if (designId) revalidatePath(`/admin/products/${designId}`); revalidatePath("/shop"); revalidatePath("/"); };
async function assertMediaScope(productId: number, designId: number | null, sizeId: number | null) {
  if (sizeId && !designId) throw new Error("A size-specific image must belong to a design.");
  if (!designId) return;
  const [rows] = await databasePool.execute(`SELECT d.id FROM designs d
    WHERE d.id=? AND d.product_id=?
      AND (? IS NULL OR EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id=d.product_id AND v.design_id=d.id AND v.size_id=?))
    LIMIT 1`, [designId, productId, sizeId, sizeId]);
  if ((rows as unknown[]).length !== 1) throw new Error("The selected design/size does not belong to this product.");
}

export async function createProductImage(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]); const parsed = imageInput.parse(Object.fromEntries(formData));
  const designId = nullableId(parsed.designId); const sizeId = nullableId(parsed.sizeId); await assertMediaScope(parsed.productId, designId, sizeId); const values = [parsed.productId, designId, nullableId(parsed.colourId), sizeId, parsed.src, parsed.altEn, parsed.altEl, parsed.altEn, parsed.sortOrder];
  const [result] = await databasePool.execute("INSERT INTO product_images (product_id, design_id, colour_id, size_id, src, alt, alt_el, alt_en, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", values);
  const imageId = Number((result as { insertId: number }).insertId);
  await databasePool.execute("INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, 'catalogue.image.create', 'product_image', ?, ?)", [admin.id, String(imageId), JSON.stringify({ designId, sizeId: nullableId(parsed.sizeId), src: parsed.src, altEl: parsed.altEl, altEn: parsed.altEn })]); refresh(designId);
}
export async function updateProductImage(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]); const imageId = z.coerce.number().int().positive().parse(formData.get("imageId")); const parsed = imageInput.parse(Object.fromEntries(formData));
  const [rows] = await databasePool.execute("SELECT src, alt, alt_el, alt_en, design_id, colour_id, size_id, sort_order FROM product_images WHERE id = ? LIMIT 1", [imageId]); const before = (rows as Array<Record<string, unknown>>)[0]; if (!before) throw new Error("Image no longer exists.");
  const designId = nullableId(parsed.designId); const sizeId = nullableId(parsed.sizeId); await assertMediaScope(parsed.productId, designId, sizeId); await databasePool.execute("UPDATE product_images SET design_id=?, colour_id=?, size_id=?, src=?, alt=?, alt_el=?, alt_en=?, sort_order=?, updated_at=NOW() WHERE id=?", [designId, nullableId(parsed.colourId), sizeId, parsed.src, parsed.altEn, parsed.altEl, parsed.altEn, parsed.sortOrder, imageId]);
  await databasePool.execute("INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, 'catalogue.image.update', 'product_image', ?, ?)", [admin.id, String(imageId), JSON.stringify({ before, after: parsed })]); refresh(designId);
}
export async function deleteProductImage(formData: FormData) {
  const admin = await requireAdminRole(["owner"]); const imageId = z.coerce.number().int().positive().parse(formData.get("imageId"));
  const connection = await databasePool.getConnection(); let designId: number | null = null; try { await connection.beginTransaction(); const [rows] = await connection.execute("SELECT src, alt, design_id FROM product_images WHERE id=? LIMIT 1 FOR UPDATE", [imageId]); const image = (rows as Array<{src:string;alt:string;design_id:number|null}>)[0]; if (!image) throw new Error("Image no longer exists."); designId=image.design_id; await connection.execute("DELETE FROM product_images WHERE id=?", [imageId]); await connection.execute("INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, 'catalogue.image.delete', 'product_image', ?, ?)", [admin.id, String(imageId), JSON.stringify(image)]); await connection.commit(); } catch(error) { await connection.rollback(); throw error; } finally { connection.release(); } refresh(designId);
}
