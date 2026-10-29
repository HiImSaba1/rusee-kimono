import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProductExperience } from "@/components/commerce/ProductExperience";
import { ProductKnowledge } from "@/components/commerce/ProductKnowledge";
import { KimonoConnectCTA } from "@/components/home/KimonoConnectCTA";
import { getActiveCatalogue } from "@/features/catalogue/queries";
import { productInformation, productInformationKeys, productInformationLabels } from "@/features/catalogue/product-information";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";
import { productStructuredData, safeJsonLd } from "@/lib/seo/product-schema";
import { isOptimizedKimonoImage, kimonoDesignImage } from "@/lib/media/kimono-images";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [catalogue, cookieStore] = await Promise.all([getActiveCatalogue(), cookies()]);
  const design = catalogue?.designs.find((item) => item.slug === slug && item.active);
  if (!catalogue || !design) return { title: "Ruseè", robots: { index: false, follow: false } };
  const saved = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(saved) ? saved : defaultLocale;
  const title = `${catalogue.product.title} — ${design.name}`;
  const description = locale === "el" ? `${design.name}: ενεργό σχέδιο της συλλογής ${catalogue.product.title} από τη Ruseè.` : `${design.name}: an active design in the ${catalogue.product.title} collection by Ruseè.`;
  const storedImage = catalogue.images.find((item) => item.designId === design.id)?.src;
  const image = isOptimizedKimonoImage(storedImage) ? storedImage : kimonoDesignImage(catalogue.designs.findIndex(item => item.id === design.id), 0);
  return { title, description, alternates: { canonical: `/shop/${encodeURIComponent(slug)}` }, openGraph: { type: "website", title, description, url: `/shop/${encodeURIComponent(slug)}`, locale: locale === "el" ? "el_GR" : "en_GB", images: [{ url: image, alt: catalogue.images.find((item) => item.src === image)?.alt ?? title }] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
}

export default async function ProductDesignPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, catalogue, cookieStore] = await Promise.all([params, getActiveCatalogue(), cookies()]);
  if (!catalogue) notFound();
  const design = catalogue.designs.find((item) => item.slug === slug && item.active);
  if (!design) notFound();
  const savedLocale = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(savedLocale) ? savedLocale : defaultLocale;
  const information = productInformation(catalogue.product.productInformation);
  const designIndex = Math.max(0, catalogue.designs.findIndex((item) => item.id === design.id));
  const displayDesign = { ...design, name: design.name, story: locale === "el" ? (design.descriptionEl ?? design.story) : (design.descriptionEn ?? design.story) };
  const sections = [{ label: locale === "el" ? "Η ιστορία του σχεδίου" : "Design story", text: locale === "el" ? (design.detailsEl ?? design.descriptionEl ?? design.story ?? "—") : (design.detailsEn ?? design.descriptionEn ?? design.story ?? "—") }, ...productInformationKeys.map((key) => ({ label: productInformationLabels[key][locale], text: information[key][locale] }))];
  const knowledgeImages = Array.from(
    { length: sections.length },
    (_, imageIndex) => kimonoDesignImage(designIndex, imageIndex),
  );
  const designVariants = catalogue.variants.filter(({ variant }) => variant.designId === design.id);
  const optimizedStructuredImages = catalogue.images.filter(item => item.designId === design.id && isOptimizedKimonoImage(item.src)).map(item => item.src);
  const structuredData = productStructuredData({ locale, slug, product: catalogue.product, design, variants: designVariants, images: optimizedStructuredImages.length > 0 ? optimizedStructuredImages : knowledgeImages.slice(0, 3) });

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
    <section className="px-[var(--gutter)] pb-[var(--section)] pt-28"><ProductExperience design={displayDesign} colours={catalogue.colours} sizes={catalogue.sizes} variants={designVariants} designIndex={designIndex} /></section>
    <ProductKnowledge
      eyebrow={locale === "el" ? "Γνωρίστε το κιμονό σας" : "Know your kimono"}
      title={locale === "el" ? "Όλα όσα θέλετε να γνωρίζετε." : "Everything you want to know."}
      intro={locale === "el" ? "Ύφασμα, εφαρμογή, φροντίδα και προέλευση συγκεντρωμένα σε ένα σημείο, ώστε η επιλογή σας να είναι καθαρή και συνειδητή." : "Fabric, fit, care and provenance in one place, so your choice can be clear and considered."}
      sections={sections}
      images={knowledgeImages}
    />
    {/* Previous product-page ending retained for reference:
    <ImageBurstCTA compact kicker={locale === "el" ? "Συνεχίστε τη μελέτη" : "Continue the study"} lines={[{ before: locale === "el" ? "Μία φόρμα, " : "One form, ", keyword: locale === "el" ? "μια άλλη διάθεση." : "another mood." }]} buttonLabel={locale === "el" ? "Δείτε όλα τα σχέδια" : "Explore all designs"} href="/shop" images={knowledgeImages} />
    */}
    <KimonoConnectCTA />
  </>;
}
