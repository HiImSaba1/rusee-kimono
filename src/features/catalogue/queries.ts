import "server-only";

import { asc, eq } from "drizzle-orm";
import { database, databasePool } from "@/lib/db/connection";
import { colours, designs, inventory, productImages, products, productVariants, sizes } from "@/lib/db/schema";

export async function getActiveCatalogue() {
  const product = await database.query.products.findFirst({
    where: eq(products.status, "active"),
    orderBy: asc(products.id),
  });

  if (!product) return null;

  const [designRows, colourRows, sizeRows, variantRows, imageRows] = await Promise.all([
    database.select().from(designs).where(eq(designs.productId, product.id)).orderBy(asc(designs.sortOrder)),
    database.select().from(colours).orderBy(asc(colours.sortOrder)),
    database.select().from(sizes).orderBy(asc(sizes.sortOrder)),
    database.select({ variant: productVariants, stock: inventory }).from(productVariants).leftJoin(inventory, eq(inventory.variantId, productVariants.id)).where(eq(productVariants.productId, product.id)).orderBy(asc(productVariants.id)),
    database.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder)),
  ]);

  return { product, designs: designRows, colours: colourRows, sizes: sizeRows, variants: variantRows, images: imageRows };
}

export async function getBestSellingDesignIds(limit = 3) {
  const safeLimit = Math.max(1, Math.min(15, Math.trunc(limit)));
  const [rows] = await databasePool.execute(`SELECT d.id,
      COALESCE(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END),0) AS units_sold
    FROM designs d
    INNER JOIN products p ON p.id=d.product_id AND p.status='active'
    LEFT JOIN product_variants v ON v.design_id=d.id AND v.active=true
    LEFT JOIN order_items oi ON oi.variant_id=v.id
    LEFT JOIN orders o ON o.id=oi.order_id
      AND o.payment_status IN ('paid','partially_refunded')
      AND o.order_number NOT LIKE 'DEMO-%'
    WHERE d.active=true
    GROUP BY d.id,d.sort_order
    ORDER BY units_sold DESC,d.sort_order ASC,d.id ASC
    LIMIT ${safeLimit}`);
  return rows as Array<{ id: number; units_sold: number }>;
}
