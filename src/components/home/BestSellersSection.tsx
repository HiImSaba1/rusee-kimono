"use client";

import { ArrowUpRight } from "lucide-react";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { useLocale } from "@/i18n/LocaleProvider";
import { kimonoDesignModelImage } from "@/lib/media/kimono-images";

type BestSeller = {
  id: number;
  slug: string;
  name: string;
  nameEl: string | null;
  fixedColourId: number | null;
  story: string | null;
  catalogueIndex: number;
  unitsSold: number;
};

type Colour = { id: number; name: string };

export function BestSellersSection({ designs, colours }: { designs: BestSeller[]; colours: Colour[] }) {
  const { locale } = useLocale();
  const greek = locale === "el";
  const colourNames: Record<string, string> = { Ink: "Μελάνι", Clay: "Πηλός", Sage: "Φασκόμηλο" };

  return <section data-no-translate className="px-[var(--gutter)] pb-[var(--section)]">
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-t border-ink/20 pt-8">
      <div>
        <p className="eyebrow">Ruseè selection</p>
        <h2 className="mt-4 font-display text-[clamp(3.5rem,7vw,7.5rem)] leading-[.88] tracking-[-.055em]">Best sellers<br/><em>Δημοφιλή σχέδια.</em></h2>
      </div>
      <p className="max-w-sm text-base leading-relaxed text-ink/70">{greek ? "Τα σχέδια που έχουν επιλέξει περισσότερο οι πελάτισσές μας, με σειρά πραγματικών πωλήσεων." : "The designs chosen most often by our customers, ranked by actual sales."}</p>
    </div>
    <div className="grid border-t border-ink/20 lg:grid-cols-3">
      {designs.map((design, rank) => {
        const colour = colours.find((item) => item.id === design.fixedColourId) ?? colours[0];
        const name = design.name;
        const primary = kimonoDesignModelImage(design.catalogueIndex, 0);
        if (!primary) return null;
        const secondary = kimonoDesignModelImage(design.catalogueIndex, 1) ?? primary;
        return <TransitionLink key={design.id} href={`/shop/${encodeURIComponent(design.slug)}`} className="shop-design-card group border-b border-ink/20 py-6 transition-colors duration-500 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
          <div className="relative aspect-[3/4] overflow-hidden bg-paper">
            <ParallaxImage src={primary} alt={greek ? `Κιμονό ${name}` : `${name} kimono`} sizes="(min-width:1280px) 33vw,(min-width:768px) 50vw,100vw" className="absolute inset-0" imageClassName="shop-design-card__primary object-cover" speed={6}/>
            <span className="shop-design-card__alternate absolute inset-0"><ParallaxImage src={secondary} alt={greek ? `Το κιμονό ${name} φορεμένο` : `${name} kimono worn`} sizes="(min-width:1280px) 33vw,(min-width:768px) 50vw,100vw" className="h-full w-full" imageClassName="shop-design-card__alternate-image object-cover" speed={6}/></span>
          </div>
          <div className="mt-5 flex items-start justify-between">
            <div><p className="eyebrow text-ink/70 transition-colors duration-500 group-hover:text-paper/70 group-focus-visible:text-paper/70">0{rank + 1} · {greek ? (colourNames[colour?.name ?? ""] ?? colour?.name) : colour?.name}</p><h3 className="mt-3 overflow-visible py-[.1em] font-display text-4xl tracking-[-.04em]">{name}</h3></div>
            <ArrowUpRight className="size-5" strokeWidth={1.3}/>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink/70 transition-colors duration-500 group-hover:text-paper/70 group-focus-visible:text-paper/70">{design.story}</p>
        </TransitionLink>;
      })}
    </div>
  </section>;
}
