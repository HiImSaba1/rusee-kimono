import { ArrowUpRight } from "lucide-react";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { DesignCarousel } from "@/components/home/DesignCarousel";
import { BestSellersSection } from "@/components/home/BestSellersSection";
import { HomeHero } from "@/components/home/HomeHero";
import { KimonoCraftSection } from "@/components/home/KimonoCraftSection";
import { KimonoConnectCTA } from "@/components/home/KimonoConnectCTA";
import { getActiveCatalogue, getBestSellingDesignIds } from "@/features/catalogue/queries";
import { localizedPageMetadata } from "@/lib/seo/metadata";
import { kimonoDesignHasModelImages, kimonoDesignModelImage } from "@/lib/media/kimono-images";
import { LetterHoverLink } from "@/components/ui/LetterHoverLink";

export function generateMetadata() { return localizedPageMetadata({ path: "/", title: { el: "Η μελέτη του κιμονό", en: "The Kimono Study" }, description: { el: "Μία εκδοτική μελέτη της Ruseè στο κιμονό, το χρώμα, το ύφασμα και την κίνηση.", en: "Ruseè is an editorial study in kimono, colour, cloth and movement." } }); }

export default async function HomePage() {
  const [catalogue, bestSellingRows] = await Promise.all([getActiveCatalogue(), getBestSellingDesignIds(15)]);
  const designSlides = catalogue?.designs.flatMap((design, index) => {
    if (!design.active || !kimonoDesignHasModelImages(index)) return [];
    return [{ id: design.id, slug: design.slug, name: design.name, story: design.story, image: kimonoDesignModelImage(index, 0)!, alt: `${design.name} Ruseè kimono worn by a model` }];
  }) ?? [];
  const rankedIds = new Map(bestSellingRows.map((row, index) => [row.id, { rank: index, unitsSold: Number(row.units_sold) }]));
  const bestSellers = catalogue?.designs.filter(design => rankedIds.has(design.id)).sort((a, b) => rankedIds.get(a.id)!.rank - rankedIds.get(b.id)!.rank).map(design => ({ ...design, catalogueIndex: catalogue.designs.findIndex(item => item.id === design.id), unitsSold: rankedIds.get(design.id)!.unitsSold })).filter(design => kimonoDesignHasModelImages(design.catalogueIndex)).slice(0, 3) ?? [];
  return (
    <>
      <HomeHero />

      <KimonoCraftSection />

      <DesignCarousel slides={designSlides} />

      <BestSellersSection designs={bestSellers} colours={catalogue?.colours ?? []} />

      <section className="grid min-h-[90svh] bg-paper-deep text-paper lg:grid-cols-2">
        <div className="group/collection relative min-h-[60svh] overflow-hidden">
          <ParallaxImage src="/kimono_images_optimized/kimono_design_grouped_1.webp" alt="Ruseè kimono collection" sizes="(min-width:1024px) 50vw, 100vw" className="absolute inset-0 opacity-100 transition-[opacity,transform] duration-[2400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/collection:scale-[1.025] group-hover/collection:opacity-20" speed={8} />
          <ParallaxImage src="/kimono_images_optimized/kimono_design_grouped_2.webp" alt="Ruseè kimono collection styled together" sizes="(min-width:1024px) 50vw, 100vw" className="absolute inset-0 scale-[1.025] opacity-0 transition-[opacity,transform] duration-[2400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/collection:scale-100 group-hover/collection:opacity-100" speed={6} />
        </div>
        <div className="flex flex-col justify-between p-[var(--gutter)] py-[clamp(4rem,8vw,8rem)]"><p className="eyebrow text-paper/70">Signature collection</p><div><h2 className="font-display text-[clamp(4rem,8vw,9rem)] leading-[0.84] tracking-[-0.06em]">One form.<br />Fifteen designs.</h2><p className="mt-8 max-w-lg leading-relaxed text-paper/80">Choose a design, colour and size. Each variation keeps the same easy architecture and changes its atmosphere.</p><LetterHoverLink href="/shop" trailingVisual={<ArrowUpRight className="size-4" />} className="mt-10 gap-3 bg-paper px-6 py-4 text-xs uppercase tracking-[0.16em] text-ink">Shop the kimono</LetterHoverLink></div><p className="text-xs uppercase tracking-[0.14em] text-paper/70">Made in considered runs</p></div>
      </section>

      <KimonoConnectCTA />
    </>
  );
}
