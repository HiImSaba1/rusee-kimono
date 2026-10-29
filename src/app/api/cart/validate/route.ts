import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { database } from "@/lib/db/connection";
import { colours, designs, inventory, productImages, products, productVariants, sizes } from "@/lib/db/schema";
import { isOptimizedKimonoImage, kimonoImage } from "@/lib/media/kimono-images";
import { provisionalSizeGallery } from "@/features/catalogue/product-media";

const inputSchema = z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) });

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid cart selection." }, { status: 400 });
  try {
    const [row] = await database.select({ variant: productVariants, product: products, design: designs, colour: colours, size: sizes, stock: inventory })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .innerJoin(designs, eq(designs.id, productVariants.designId))
      .innerJoin(colours, eq(colours.id, productVariants.colourId))
      .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(and(eq(productVariants.id, parsed.data.variantId), eq(productVariants.active, true), eq(products.status, "active")))
      .limit(1);
    if (!row) return NextResponse.json({ message: "This variation is no longer available." }, { status: 404 });
    const available = Math.max(0, (row.stock?.onHand ?? 0) - (row.stock?.reserved ?? 0));
    if (available < parsed.data.quantity) return NextResponse.json({ message: available ? `Only ${available} remaining.` : "This variation is out of stock." }, { status: 409 });
    const [image] = await database.select().from(productImages).where(and(eq(productImages.productId, row.product.id), eq(productImages.designId, row.design.id), eq(productImages.sizeId, row.size.id))).orderBy(productImages.sortOrder).limit(1);
    const fallbackImage = provisionalSizeGallery(row.design.sortOrder, row.size.sortOrder, row.design.name)[0]?.src ?? kimonoImage(row.design.sortOrder + 1);
    return NextResponse.json({ variantId: row.variant.id, sku: row.variant.sku, productTitle: row.product.title, designName: row.design.name, colourName: row.colour.name, sizeLabel: row.size.label, priceMinor: row.variant.priceMinor, currency: row.variant.currency, image: isOptimizedKimonoImage(image?.src) ? image.src : fallbackImage, quantity: parsed.data.quantity, available });
  } catch {
    return NextResponse.json({ message: "Cart validation is temporarily unavailable." }, { status: 503 });
  }
}
