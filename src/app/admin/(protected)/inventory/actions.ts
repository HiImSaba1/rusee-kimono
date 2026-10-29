"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { databasePool } from "@/lib/db/connection";
import { logger } from "@/lib/observability/logger";

export type InventoryActionState = { ok?: boolean; message?: string };
const adjustmentInput = z.object({
  variantId: z.coerce.number().int().positive(),
  delta: z.coerce.number().int().min(-100).max(100).refine((value) => value !== 0),
  note: z.string().trim().min(5).max(300),
});

export async function adjustInventory(_: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  const admin = await requireAdminRole(["owner", "manager"]);
  const parsed = adjustmentInput.safeParse({ variantId: formData.get("variantId"), delta: formData.get("delta"), note: formData.get("note") });
  if (!parsed.success) return { message: "Enter a non-zero quantity between -100 and 100 and a short reason." };
  const { variantId, delta, note } = parsed.data;
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT i.on_hand, i.reserved, v.sku FROM inventory i
       INNER JOIN product_variants v ON v.id = i.variant_id
       WHERE i.variant_id = ? LIMIT 1 FOR UPDATE`,
      [variantId],
    );
    const stock = (rows as Array<{ on_hand: number; reserved: number; sku: string }>)[0];
    if (!stock) {
      await connection.rollback();
      return { message: "That variant no longer exists." };
    }
    const nextOnHand = stock.on_hand + delta;
    if (nextOnHand < stock.reserved || nextOnHand < 0) {
      await connection.rollback();
      return { message: `Cannot reduce ${stock.sku} below its ${stock.reserved} reserved units.` };
    }
    await connection.execute("UPDATE inventory SET on_hand = ?, updated_at = NOW() WHERE variant_id = ?", [nextOnHand, variantId]);
    await connection.execute(
      "INSERT INTO inventory_movements (variant_id, quantity_delta, reason, note) VALUES (?, ?, 'adjustment', ?)",
      [variantId, delta, note],
    );
    await connection.execute(
      "INSERT INTO admin_audit_events (admin_user_id, action, entity_type, entity_id, metadata) VALUES (?, 'inventory.adjust', 'product_variant', ?, ?)",
      [admin.id, String(variantId), JSON.stringify({ sku: stock.sku, delta, previousOnHand: stock.on_hand, nextOnHand, note })],
    );
    await connection.commit();
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/overview");
    revalidatePath("/shop");
    return { ok: true, message: `${stock.sku} updated to ${nextOnHand} on hand.` };
  } catch (error) {
    await connection.rollback();
    logger.error("inventory.adjustment_failed", { error, variantId });
    return { message: "Inventory could not be updated." };
  } finally {
    connection.release();
  }
}
