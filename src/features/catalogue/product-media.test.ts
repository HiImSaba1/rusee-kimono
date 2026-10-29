import { describe, expect, it } from "vitest";
import { resolveSizeGallery } from "./product-media";

const image = (designId: number, sizeId: number | null, src: string) => ({ designId, sizeId, src, alt: "Legacy alt", altEl: "Ελληνικό alt", altEn: "English alt" });

describe("resolveSizeGallery", () => {
  it("prefers exact size media and localizes its alt text", () => {
    const result = resolveSizeGallery({ images: [image(1, null, "/kimono_images_optimized/kimono_design_artemis_main.png"), image(1, 8, "/kimono_images_optimized/kimono_design_artemis_main.png")], designId: 1, sizeId: 8, designIndex: 0, sizeIndex: 0, designName: "Artemis", locale: "el" });
    expect(result[0]).toMatchObject({ src: "/kimono_images_optimized/kimono_design_artemis_main.png", alt: "Ελληνικό alt", persisted: true });
  });

  it("never borrows persisted media from another design", () => {
    const result = resolveSizeGallery({ images: [image(2, 8, "/kimono_images_optimized/kimono_design_birds_main.png")], designId: 1, sizeId: 8, designIndex: 0, sizeIndex: 0, designName: "Artemis", locale: "en" });
    expect(result).toHaveLength(3);
    expect(result.every((entry) => entry.src.startsWith("/kimono_images_optimized/") && !entry.persisted)).toBe(true);
  });
});
