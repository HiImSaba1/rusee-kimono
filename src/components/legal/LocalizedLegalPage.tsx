import { cookies } from "next/headers";
import { LegalPage, type LegalSection } from "./LegalPage";
import { getPublishedInformationPage, type InformationPageSlug } from "@/features/content/information-pages";
import { InformationSiblingNav } from "./InformationSiblingNav";

type LocalizedCopy = { eyebrow: string; title: string; intro: string; sections: LegalSection[] };

export async function LocalizedLegalPage({ slug, el, en }: { slug: InformationPageSlug; el: LocalizedCopy; en: LocalizedCopy }) {
  const locale = (await cookies()).get("rusee_locale")?.value === "en" ? "en" : "el";
  const stored = await getPublishedInformationPage(slug);
  return <LegalPage {...(stored ? stored[locale] : locale === "en" ? en : el)} footer={<InformationSiblingNav slug={slug} locale={locale}/>} />;
}
