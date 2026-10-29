import type { Locale } from "@/i18n/config";
import { siteOrigin } from "./metadata";

type ProductSchemaInput = {
  locale: Locale;
  slug: string;
  product: { title: string; description: string };
  design: { name: string };
  variants: Array<{ variant: { sku: string; priceMinor: number; currency: string }; stock: { onHand: number; reserved: number } | null }>;
  images: string[];
};

export function productStructuredData(input: ProductSchemaInput) {
  const origin = siteOrigin();
  const url = new URL(`/shop/${encodeURIComponent(input.slug)}`, origin).toString();
  const offers = input.variants.map(({ variant, stock }) => ({
    "@type": "Offer",
    sku: variant.sku,
    price: (variant.priceMinor / 100).toFixed(2),
    priceCurrency: variant.currency,
    availability: stock && stock.onHand - stock.reserved > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    url,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${input.product.title} — ${input.design.name}`,
    description: input.product.description,
    inLanguage: input.locale,
    brand: { "@type": "Brand", name: "Ruseè" },
    url,
    ...(input.images.length ? { image: input.images.map((image) => new URL(image, origin).toString()) } : {}),
    ...(offers.length ? { offers } : {}),
  };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
