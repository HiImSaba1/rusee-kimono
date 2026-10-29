import { ArrowDown } from "lucide-react";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { SplitText } from "@/components/animations/SplitText";
import type { Locale } from "@/i18n/config";
import { kimonoDesignModelImage } from "@/lib/media/kimono-images";

export function ShopHero({ locale }: { locale: Locale }) {
  const heroImage = kimonoDesignModelImage(6, 2)!;
  const detailImage = kimonoDesignModelImage(9, 3)!;
  const copy = locale === "el"
    ? { one: "Μία", signature: "Χαρακτηριστική", form: "Φόρμα", design: "ΑΡΩΜΑΤΑ", index: "ΠΑΡΑΔΟΣΗΣ", scroll: "Κύλιση για", moods: "Δεκαπέντε διαθέσεις" }
    : { one: "One", signature: "Signature", form: "Form", design: "Design", index: "Index", scroll: "Scroll for", moods: "Fifteen moods" };

  return (
    <section data-no-translate className="relative min-h-svh overflow-hidden px-[var(--gutter)] pb-[13vh] pt-24">
      <ParallaxImage src={heroImage} alt="Ruseè kimono worn in motion" loading="eager" fetchPriority="high" sizes="100vw" className="h-[clamp(12rem,50vh,40rem)] w-full" speed={8} />
      <div className="mt-[clamp(2rem,5vh,4rem)] flex flex-col uppercase">
        <div className="relative mb-2 flex justify-between overflow-hidden font-mono text-sm tracking-[.12em]">
          <span>{copy.one}</span><span className="absolute left-1/2 -translate-x-1/2">{copy.signature}</span><span>{copy.form}</span>
        </div>
        <div className="flex w-full flex-col lg:flex-row lg:items-end lg:justify-between lg:gap-[2vw]">
          <div className="min-w-0 overflow-visible py-[.16em]"><SplitText as="p" type="words" triggerOnScroll={false} className={`font-display text-[clamp(4rem,12.2vw,11.5rem)] leading-[.92] tracking-[-.025em] ${locale === "el" ? "greek-display-heading" : ""}`}>{copy.design}</SplitText></div>
          <div className="min-w-0 overflow-visible py-[.16em]"><SplitText as="p" type="words" triggerOnScroll={false} className={`text-right font-display text-[clamp(4rem,12.2vw,11.5rem)] leading-[.92] tracking-[-.025em] ${locale === "el" ? "greek-display-heading" : ""}`}>{copy.index}</SplitText></div>
        </div>
      </div>
      <div className="absolute inset-x-[var(--gutter)] bottom-4 grid h-[10vh] min-w-0 grid-cols-[1fr_minmax(5rem,18vw)_1fr] items-center gap-4 font-mono text-sm uppercase">
        <div className="flex min-w-0 items-center gap-2"><ArrowDown className="shrink-0" size={16} /><span>{copy.scroll}</span></div>
        <ParallaxImage src={detailImage} alt="Ruseè kimono styled outdoors" sizes="18vw" className="h-full w-full" speed={7} />
        <div className="flex min-w-0 items-center justify-end gap-2 text-right"><span>{copy.moods}</span><ArrowDown className="shrink-0" size={16} /></div>
      </div>
    </section>
  );
}
