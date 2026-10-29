import "server-only";
import { z } from "zod";
import { databasePool } from "@/lib/db/connection";

export const informationPageSlugs = ["shipping", "payment-methods", "returns", "cookies", "privacy-policy", "terms", "care-guide"] as const;
export const informationPageSlug = z.enum(informationPageSlugs);
export type InformationPageSlug = z.infer<typeof informationPageSlug>;

export const informationPageLabels: Record<InformationPageSlug, { el: string; en: string }> = {
  shipping: { el: "Αποστολές & courier", en: "Shipping & courier" },
  "payment-methods": { el: "Τρόποι πληρωμής", en: "Payment methods" },
  returns: { el: "Πολιτική επιστροφών", en: "Returns policy" },
  cookies: { el: "Πολιτική cookies", en: "Cookies policy" },
  "privacy-policy": { el: "Πολιτική απορρήτου", en: "Privacy policy" },
  terms: { el: "Όροι & προϋποθέσεις", en: "Terms & conditions" },
  "care-guide": { el: "Φροντίδα & εφαρμογή", en: "Care & fit" },
};

const section = z.object({ heading: z.string().trim().min(2).max(180), content: z.string().trim().min(10).max(5000) });
export const localizedSections = z.object({ el: z.array(section).max(12), en: z.array(section).max(12) }).refine((value) => value.el.length === value.en.length, "Greek and English section counts must match.");

export type StoredInformationPage = {
  slug: InformationPageSlug; status: "draft" | "published"; eyebrow_el: string; eyebrow_en: string;
  title_el: string; title_en: string; intro_el: string; intro_en: string; sections: unknown; updated_at: Date;
};

export function decodeStoredSections(value: unknown) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value) as unknown; } catch { return null; }
}

export function parseStoredInformationPage(row: StoredInformationPage) {
  const sections = localizedSections.safeParse(decodeStoredSections(row.sections));
  if (!sections.success || row.status !== "published" || sections.data.el.length === 0) return null;
  return { slug: row.slug, el: { eyebrow: row.eyebrow_el, title: row.title_el, intro: row.intro_el, sections: sections.data.el }, en: { eyebrow: row.eyebrow_en, title: row.title_en, intro: row.intro_en, sections: sections.data.en } };
}

export function assessInformationPageReadiness(row: StoredInformationPage) {
  const parsedSections = localizedSections.safeParse(decodeStoredSections(row.sections));
  const missingFields = (["eyebrow_el", "eyebrow_en", "title_el", "title_en", "intro_el", "intro_en"] as const)
    .filter((field) => row[field].trim().length < 2);
  const sectionCount = parsedSections.success ? parsedSections.data.el.length : 0;
  return {
    ready: missingFields.length === 0 && parsedSections.success && sectionCount > 0,
    missingFields,
    sectionCount,
    sections: parsedSections.success ? parsedSections.data : { el: [], en: [] },
  };
}

export type InformationPublicationIntent = "save_draft" | "publish" | "withdraw";

export function resolveInformationPublication(currentStatus: StoredInformationPage["status"], intent: InformationPublicationIntent, confirmation: boolean, sectionCount: number) {
  if (intent === "save_draft") {
    if (currentStatus === "published") throw new Error("Withdraw the published page before saving it as a draft.");
    return { status: "draft" as const, auditAction: "content.information.draft_saved" };
  }
  if (!confirmation) throw new Error(intent === "publish" ? "Publication confirmation is required." : "Withdrawal confirmation is required.");
  if (intent === "publish" && sectionCount < 1) throw new Error("A published page requires at least one bilingual section.");
  return intent === "publish"
    ? { status: "published" as const, auditAction: currentStatus === "published" ? "content.information.published_updated" : "content.information.published" }
    : { status: "draft" as const, auditAction: "content.information.withdrawn" };
}

export async function getPublishedInformationPage(slug: InformationPageSlug) {
  try {
    const [rows] = await databasePool.execute("SELECT slug,status,eyebrow_el,eyebrow_en,title_el,title_en,intro_el,intro_en,sections,updated_at FROM store_information_pages WHERE slug=? AND status='published' LIMIT 1", [slug]);
    const row = (rows as StoredInformationPage[])[0];
    return row ? parseStoredInformationPage(row) : null;
  } catch { return null; }
}

export async function listAdminInformationPages() {
  const [rows] = await databasePool.execute("SELECT slug,status,title_el,title_en,updated_at FROM store_information_pages ORDER BY FIELD(slug,'shipping','payment-methods','returns','cookies','privacy-policy','terms','care-guide')");
  return rows as Array<Pick<StoredInformationPage,"slug"|"status"|"title_el"|"title_en"|"updated_at">>;
}

export async function getAdminInformationPage(slug: InformationPageSlug) {
  const [rows] = await databasePool.execute("SELECT slug,status,eyebrow_el,eyebrow_en,title_el,title_en,intro_el,intro_en,sections,updated_at FROM store_information_pages WHERE slug=? LIMIT 1", [slug]);
  return (rows as StoredInformationPage[])[0] ?? null;
}
