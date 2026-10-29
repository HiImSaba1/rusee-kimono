import { cookies } from "next/headers";
import { ShopDesignGrid } from "@/components/commerce/ShopDesignGrid";
import { ShopHero } from "@/components/commerce/ShopHero";
import { ImageBurstCTA } from "@/components/ui/ImageBurstCTA";
import { getActiveCatalogue } from "@/features/catalogue/queries";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";
import { localizedPageMetadata } from "@/lib/seo/metadata";
import { EditorialSectionChoreography } from "@/components/animations/EditorialSectionChoreography";

export function generateMetadata() { return localizedPageMetadata({ path: "/shop", title: { el: "Συλλογή κιμονό", en: "Kimono collection" }, description: { el: "Εξερευνήστε τα ενεργά σχέδια, χρώματα και μεγέθη της συλλογής κιμονό Ruseè.", en: "Explore the active designs, colours and sizes in the Ruseè kimono collection." }, image: "/kimono_images_optimized/kimono_design_figs_main.png" }); }

export default async function ShopPage() {
  const [catalogue, cookieStore] = await Promise.all([getActiveCatalogue(), cookies()]);
  const saved = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(saved) ? saved : defaultLocale;
  const activeDesigns = catalogue?.designs.filter((design) => design.active) ?? [];
  if (!catalogue || activeDesigns.length === 0 || catalogue.colours.length === 0) return <section className="section-shell grid min-h-[70svh] content-center pt-28"><p className="eyebrow">Ruseè · {locale === "el" ? "Συλλογή" : "Collection"}</p><h1 className="mt-5 max-w-5xl font-display text-[clamp(4rem,9vw,9rem)] leading-[.9]">{locale === "el" ? "Η επόμενη μελέτη ετοιμάζεται." : "The next study is being prepared."}</h1><p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/60">{locale === "el" ? "Τα σχέδια θα εμφανιστούν εδώ μόλις είναι ενεργά και έτοιμα για επιλογή." : "Designs will appear here as soon as they are active and ready to select."}</p></section>;
  return (
    <EditorialSectionChoreography>
      <div data-editorial-section><ShopHero locale={locale} /></div>
      <div data-editorial-section><ShopDesignGrid designs={activeDesigns} colours={catalogue.colours} locale={locale} /></div>
      <div data-editorial-section><ImageBurstCTA kicker="The Ruseè study" lines={[{before:"Find the mood ",keyword:"that moves."},{before:"Make the form ",keyword:"your own."}]} buttonLabel="Return to the design index" href="/shop" images={["/kimono_images_optimized/kimono_design_birds_1.webp","/kimono_images_optimized/kimono_design_birds_2.webp","/kimono_images_optimized/kimono_design_birds_3.webp","/kimono_images_optimized/kimono_design_birds_4.webp","/kimono_images_optimized/kimono_design_birds_5.webp","/kimono_images_optimized/kimono_design_birds_6.webp"]}/></div>
    </EditorialSectionChoreography>
  );
}
