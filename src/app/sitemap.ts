import type { MetadataRoute } from "next";
import { getActiveCatalogue } from "@/features/catalogue/queries";
import { siteOrigin } from "@/lib/seo/metadata";

const publicPaths = ["/", "/shop", "/about", "/faq", "/contact", "/information", "/shipping", "/payment-methods", "/care-guide", "/privacy-policy", "/cookies", "/terms", "/returns"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const staticEntries: MetadataRoute.Sitemap = publicPaths.map((path) => ({ url: new URL(path, origin).toString(), changeFrequency: path === "/" || path === "/shop" ? "weekly" : "monthly", priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.6 }));
  try {
    const catalogue = await getActiveCatalogue();
    if (!catalogue) return staticEntries;
    return [...staticEntries, ...catalogue.designs.filter((design) => design.active).map((design) => ({ url: new URL(`/shop/${encodeURIComponent(design.slug)}`, origin).toString(), lastModified: design.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 }))];
  } catch {
    return staticEntries;
  }
}
