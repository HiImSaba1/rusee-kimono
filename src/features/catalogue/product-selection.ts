export type SellableVariant = {
  variant: { id: number; designId: number; colourId: number; sizeId: number; sku: string; priceMinor: number; currency: string };
  stock: { onHand: number; reserved: number } | null;
};

export function selectedVariant(variants: SellableVariant[], designId: number, colourId?: number, sizeId?: number) {
  if (colourId === undefined || sizeId === undefined) return undefined;
  return variants.find(({ variant }) => variant.designId === designId && variant.colourId === colourId && variant.sizeId === sizeId);
}

export function availableUnits(entry?: SellableVariant) {
  return entry?.stock ? Math.max(0, entry.stock.onHand - entry.stock.reserved) : 0;
}

export function compatibleSizeIds(variants: SellableVariant[], designId: number, colourId?: number) {
  if (colourId === undefined) return new Set<number>();
  return new Set(variants.filter(({ variant }) => variant.designId === designId && variant.colourId === colourId).map(({ variant }) => variant.sizeId));
}
