import Link from "next/link";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import type { Locale } from "@/i18n/config";
import { kimonoDesignImage } from "@/lib/media/kimono-images";
import { ShopCardImagePreloader } from "@/components/commerce/ShopCardImagePreloader";

type Option = { id: number; slug: string; name: string; nameEl?: string | null; fixedColourId?: number | null };

export function ShopDesignGrid({ designs, colours, locale }: { designs: Option[]; colours: Option[]; locale: Locale }) {
  const greek = locale === "el";
  const colourNames: Record<string, string> = { Ink: "Μελάνι", Clay: "Πηλός", Sage: "Φασκόμηλο" };
  const cards = designs.slice(0,15).map((design,index) => {
    const colour = colours.find(item=>item.id===design.fixedColourId) ?? colours[0];
    return {
      index,
      design,
      colour,
      name: design.name,
      primary: kimonoDesignImage(index, 0),
      secondary: kimonoDesignImage(index, 1),
    };
  }).filter((card) => card.design && card.colour);

  return (
    <section data-no-translate className="section-shell border-b border-ink/20">
      <ShopCardImagePreloader sources={cards.slice(3).map(card => card.secondary)} />
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{greek ? "Ευρετήριο σχεδίων" : "The design index"}</p>
          <h1 className="mt-4 overflow-visible py-[.14em] font-display text-[clamp(4rem,8vw,9rem)] leading-[.9] tracking-[-.06em]">
            {greek ? "Δεκαπέντε διαθέσεις." : "Fifteen moods."}<br /><em>{greek ? "Μία σιλουέτα." : "One silhouette."}</em>
          </h1>
        </div>
        <p className="max-w-sm text-base leading-relaxed text-ink/70">
          {greek ? "Περάστε πάνω από κάθε μελέτη για να δείτε πώς ζει το σχέδιο πάνω στο σώμα. Κάθε κιμονό έχει το δικό του σχέδιο και χρώμα· εσείς επιλέγετε το μέγεθος." : "Hover each study to see how the design lives on the body. Every kimono owns its design and colour; you choose the size."}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.index}
            href={`/shop/${encodeURIComponent(card.design.slug)}`}
            className="shop-design-card group border border-ink/20 bg-[#e9e7e1] p-3 transition-colors hover:bg-[#dedbd3]"
          >
            <div className="relative aspect-[3/4] overflow-hidden border border-ink/10 bg-paper">
              <ParallaxImage src={card.primary} alt={greek ? `Μελέτη σχεδίου κιμονό ${card.name}` : `${card.name} kimono design study`} sizes="(min-width:1280px) 33vw,(min-width:768px) 50vw,100vw" className="absolute inset-0" imageClassName="shop-design-card__primary object-cover" speed={6} />
              <span className="shop-design-card__alternate absolute inset-0">
                <ParallaxImage src={card.secondary} alt={greek ? `Γυναίκα φορά το κιμονό ${card.name}` : `Woman wearing the ${card.name} kimono`} loading={card.index < 3 ? "eager" : "lazy"} fetchPriority={card.index < 3 ? "high" : "auto"} sizes="(min-width:1280px) 33vw,(min-width:768px) 50vw,100vw" className="h-full w-full" imageClassName="shop-design-card__alternate-image object-cover" speed={6} />
              </span>
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-ink/15 px-1 pb-1 pt-4">
              <div>
                <p className="font-mono text-base uppercase tracking-[.12em] text-ink/70">{greek ? "Μελέτη" : "Study"} {String(card.index + 1).padStart(2, "0")} &middot; {greek ? (colourNames[card.colour.name] ?? card.colour.name) : card.colour.name}</p>
                <h2 className="mt-3 overflow-visible py-[.1em] font-display text-4xl tracking-[-.04em]">{card.name}</h2>
              </div>
              <span className="pb-1 text-sm uppercase tracking-[.12em]">{greek ? "Προβολή" : "View"}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
