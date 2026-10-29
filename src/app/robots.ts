import type { MetadataRoute } from "next";
import { isIndexableProduction, siteOrigin } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin().toString();
  if (!isIndexableProduction()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/cart", "/checkout", "/order/", "/payment/"] },
    sitemap: new URL("/sitemap.xml", origin).toString(),
    host: origin,
  };
}
