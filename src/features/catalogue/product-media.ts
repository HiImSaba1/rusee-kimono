export type CatalogueImage = {
  designId: number | null;
  sizeId: number | null;
  src: string;
  alt: string;
  altEl: string | null;
  altEn: string | null;
};

export type ResolvedProductImage = { src: string; alt: string; persisted: boolean };

export function provisionalSizeGallery(designIndex: number, sizeIndex: number, designName: string): ResolvedProductImage[] {
  return Array.from({ length: 3 }, (_, imageIndex) => ({
    src: kimonoDesignImage(designIndex, sizeIndex * 3 + imageIndex),
    alt: `${designName} kimono, selected size view ${imageIndex + 1}`,
    persisted: false,
  }));
}

export function resolveSizeGallery(input: {
  images: CatalogueImage[];
  designId: number;
  sizeId: number;
  designIndex: number;
  sizeIndex: number;
  designName: string;
  locale: "el" | "en";
}): ResolvedProductImage[] {
  const scoped = input.images.filter((image) => image.designId === input.designId);
  const exact = scoped.filter((image) => image.sizeId === input.sizeId);
  const general = scoped.filter((image) => image.sizeId === null);
  // A design-level image may complete a partially assigned size gallery, but it
  // must not make every unassigned size look identical. With no exact images,
  // the stable size-specific provisional set remains the safer fallback.
  const candidates = exact.length > 0 ? [...exact, ...general].filter(image => isOptimizedKimonoImage(image.src)) : [];
  const selected = candidates.filter((image, index, rows) => rows.findIndex((candidate) => candidate.src === image.src) === index).slice(0, 3);
  const fallback = provisionalSizeGallery(input.designIndex, input.sizeIndex, input.designName);

  return Array.from({ length: 3 }, (_, index) => {
    const image = selected[index];
    if (!image) return fallback[index];
    return {
      src: image.src,
      alt: (input.locale === "el" ? image.altEl : image.altEn) || image.alt || fallback[index].alt,
      persisted: true,
    };
  });
}
import { isOptimizedKimonoImage, kimonoDesignImage } from "@/lib/media/kimono-images";
