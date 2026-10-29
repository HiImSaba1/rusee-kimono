import defaults from "@/data/product-information-default.json";
import type { Locale } from "@/i18n/config";

export const productInformationKeys = ["fabric", "feel", "fit", "measurements", "construction", "opacity", "care", "provenance", "packaging", "shippingReturns"] as const;
export type ProductInformationKey = (typeof productInformationKeys)[number];
export type ProductInformation = Record<ProductInformationKey, Record<Locale, string>>;

export function productInformation(value: unknown): ProductInformation {
  if (!value || typeof value !== "object") return defaults;
  const source = value as Partial<Record<ProductInformationKey, Partial<Record<Locale, unknown>>>>;
  const text = (key: ProductInformationKey, locale: Locale) => {
    const candidate = source[key]?.[locale];
    return typeof candidate === "string" && candidate.trim() ? candidate : defaults[key][locale];
  };
  return Object.fromEntries(productInformationKeys.map((key) => [key, { el: text(key, "el"), en: text(key, "en") }])) as ProductInformation;
}

export const productInformationLabels: Record<ProductInformationKey, Record<Locale, string>> = {
  fabric: { el: "Ύφασμα", en: "Fabric" },
  feel: { el: "Αίσθηση", en: "Feel" },
  fit: { el: "Εφαρμογή", en: "Fit" },
  measurements: { el: "Μετρήσεις", en: "Measurements" },
  construction: { el: "Κατασκευή", en: "Construction" },
  opacity: { el: "Διαφάνεια & layering", en: "Opacity & layering" },
  care: { el: "Πλύσιμο & φροντίδα", en: "Washing & care" },
  provenance: { el: "Προέλευση", en: "Provenance" },
  packaging: { el: "Συσκευασία", en: "Packaging" },
  shippingReturns: { el: "Αποστολή & επιστροφές", en: "Shipping & returns" }
};
