"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { databasePool } from "@/lib/db/connection";
import { productInformationKeys } from "@/features/catalogue/product-information";

const id = z.coerce.number().int().positive();
const order = z.coerce.number().int().min(-999).max(999);
const text = (max: number) => z.string().trim().max(max);
const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

async function auditedUpdate(input: { table: string; entity: string; action: string; id: number; values: Record<string, string | number | boolean | null> }) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const allowed = new Set(["products", "designs", "colours", "sizes", "product_variants"]);
  if (!allowed.has(input.table)) throw new Error("Unsupported catalogue entity.");
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(`SELECT * FROM ${input.table} WHERE id = ? LIMIT 1 FOR UPDATE`, [input.id]);
    const before = (rows as Array<Record<string, unknown>>)[0];
    if (!before) throw new Error("Catalogue record not found.");
    const columns = Object.keys(input.values);
    await connection.execute(`UPDATE ${input.table} SET ${columns.map((column) => `${column} = ?`).join(", ")}, updated_at = NOW() WHERE id = ?`, [...Object.values(input.values), input.id]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)", [admin.id, input.action, input.entity, String(input.id), JSON.stringify({ before, after: input.values })]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  revalidatePath("/admin/products"); revalidatePath("/admin/inventory"); revalidatePath("/shop");
}

export async function updateProduct(formData: FormData) {
  const parsed = z.object({ id, title: text(180).min(2), subtitle: text(240), description: text(10000).min(10), material: text(5000), care: text(5000), status: z.enum(["draft", "active", "archived"]), taxRateBps: z.coerce.number().int().min(0).max(10000) }).parse(Object.fromEntries(formData));
  const information = Object.fromEntries(productInformationKeys.map((key) => [key, {
    el: z.string().trim().min(10).max(5000).parse(formData.get(`${key}_el`)),
    en: z.string().trim().min(10).max(5000).parse(formData.get(`${key}_en`)),
  }]));
  await auditedUpdate({ table: "products", entity: "product", action: "catalogue.product.update", id: parsed.id, values: { title: parsed.title, subtitle: parsed.subtitle || null, description: parsed.description, material: parsed.material || null, care: parsed.care || null, product_information: JSON.stringify(information), status: parsed.status, tax_rate_bps: parsed.taxRateBps } });
}
export async function updateDesign(formData: FormData) {
  const parsed = z.object({ id, name: text(140).min(1), nameEl: text(140).min(1), story: text(10000), descriptionEl: text(10000).min(10), descriptionEn: text(10000).min(10), detailsEl: text(10000).min(10), detailsEn: text(10000).min(10), fixedColourId: id, sortOrder: order }).parse(Object.fromEntries(formData));
  await auditedUpdate({ table: "designs", entity: "design", action: "catalogue.design.update", id: parsed.id, values: { name: parsed.name, name_el: parsed.nameEl, story: parsed.story || null, description_el: parsed.descriptionEl, description_en: parsed.descriptionEn, details_el: parsed.detailsEl, details_en: parsed.detailsEn, fixed_colour_id: parsed.fixedColourId, sort_order: parsed.sortOrder, active: formData.get("active") === "on" } });
}
export async function updateColour(formData: FormData) {
  const parsed = z.object({ id, name: text(120).min(1), hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/), sortOrder: order }).parse(Object.fromEntries(formData));
  await auditedUpdate({ table: "colours", entity: "colour", action: "catalogue.colour.update", id: parsed.id, values: { name: parsed.name, hex: parsed.hex.toUpperCase(), sort_order: parsed.sortOrder } });
}
export async function updateSize(formData: FormData) {
  const parsed = z.object({ id, label: text(80).min(1), sortOrder: order }).parse(Object.fromEntries(formData));
  await auditedUpdate({ table: "sizes", entity: "size", action: "catalogue.size.update", id: parsed.id, values: { label: parsed.label, sort_order: parsed.sortOrder } });
}
export async function updateVariant(formData: FormData) {
  const parsed = z.object({ id, price: z.coerce.number().min(0).max(100000) }).parse(Object.fromEntries(formData));
  await auditedUpdate({ table: "product_variants", entity: "product_variant", action: "catalogue.variant.update", id: parsed.id, values: { price_minor: Math.round(parsed.price * 100), active: formData.get("active") === "on" } });
}

async function auditedCreate(input: { statements: Array<{ sql: string; values: Array<string | number | boolean | null> }>; entity: string; action: string; metadata: Record<string, unknown> }) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    let entityId = 0;
    for (const statement of input.statements) {
      const [result] = await connection.execute(statement.sql, statement.values);
      entityId ||= Number((result as { insertId?: number }).insertId ?? 0);
    }
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)", [admin.id, input.action, input.entity, String(entityId), JSON.stringify(input.metadata)]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  revalidatePath("/admin/products"); revalidatePath("/admin/inventory"); revalidatePath("/shop");
}

export async function createDesign(formData: FormData) {
  const parsed = z.object({ productId: id, slug, name: text(140).min(1), story: text(10000), sortOrder: order }).parse(Object.fromEntries(formData));
  await auditedCreate({ statements: [{ sql: "INSERT INTO designs (product_id, slug, name, story, sort_order, active) VALUES (?, ?, ?, ?, ?, true)", values: [parsed.productId, parsed.slug, parsed.name, parsed.story || null, parsed.sortOrder] }], entity: "design", action: "catalogue.design.create", metadata: parsed });
}
export async function createColour(formData: FormData) {
  const parsed = z.object({ slug, name: text(120).min(1), hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/), sortOrder: order }).parse(Object.fromEntries(formData));
  await auditedCreate({ statements: [{ sql: "INSERT INTO colours (slug, name, hex, sort_order) VALUES (?, ?, ?, ?)", values: [parsed.slug, parsed.name, parsed.hex.toUpperCase(), parsed.sortOrder] }], entity: "colour", action: "catalogue.colour.create", metadata: parsed });
}
export async function createSize(formData: FormData) {
  const parsed = z.object({ code: z.string().trim().min(1).max(24).regex(/^[A-Za-z0-9-]+$/), label: text(80).min(1), sortOrder: order }).parse(Object.fromEntries(formData));
  await auditedCreate({ statements: [{ sql: "INSERT INTO sizes (code, label, sort_order) VALUES (?, ?, ?)", values: [parsed.code.toUpperCase(), parsed.label, parsed.sortOrder] }], entity: "size", action: "catalogue.size.create", metadata: parsed });
}
export async function createVariant(formData: FormData) {
  const parsed = z.object({ productId: id, designId: id, colourId: id, sizeId: id, sku: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9-]+$/), price: z.coerce.number().min(0).max(100000), onHand: z.coerce.number().int().min(0).max(100000) }).parse(Object.fromEntries(formData));
  const priceMinor = Math.round(parsed.price * 100);
  await auditedCreate({ statements: [
    { sql: "INSERT INTO product_variants (product_id, design_id, colour_id, size_id, sku, price_minor, currency, active) VALUES (?, ?, ?, ?, ?, ?, 'EUR', true)", values: [parsed.productId, parsed.designId, parsed.colourId, parsed.sizeId, parsed.sku.toUpperCase(), priceMinor] },
    { sql: "SET @new_variant_id = LAST_INSERT_ID()", values: [] },
    { sql: "INSERT INTO inventory (variant_id, on_hand, reserved) VALUES (@new_variant_id, ?, 0)", values: [parsed.onHand] },
    { sql: "INSERT INTO inventory_movements (variant_id, quantity_delta, reason, note) VALUES (@new_variant_id, ?, 'seed', 'Initial stock from catalogue creation')", values: [parsed.onHand] },
  ], entity: "product_variant", action: "catalogue.variant.create", metadata: { ...parsed, priceMinor } });
}
