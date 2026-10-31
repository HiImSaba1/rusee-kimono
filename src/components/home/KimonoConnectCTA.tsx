import { ArrowUpRight } from "lucide-react";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { Reveal } from "@/components/animations/Reveal";
import { LetterHoverLink } from "@/components/ui/LetterHoverLink";
import { kimonoDesignModelImage } from "@/lib/media/kimono-images";

export function KimonoConnectCTA() {
  const centre = kimonoDesignModelImage(12, 2)!;
  const left = kimonoDesignModelImage(5, 1)!;
  const right = kimonoDesignModelImage(9, 3)!;

  return <section className="overflow-hidden px-[var(--gutter)] py-[clamp(6rem,12vw,13rem)]">
    <div className="grid items-end gap-8 lg:grid-cols-[.24fr_1fr_.24fr]">
      <div className="hidden h-full flex-col justify-between lg:flex">
        <ParallaxImage src={left} alt="Ruseè kimono portrait" sizes="18vw" className="aspect-[3/4]" speed={5}/>
        <p className="max-w-[15rem] text-sm leading-relaxed text-ink/65">A question about a design, fit or the way a kimono moves? We would love to hear from you.</p>
      </div>

      <div className="relative mx-auto w-full max-w-5xl text-center">
        <Reveal className="relative z-30"><p className="eyebrow">Begin with a feeling</p><h2 className="mt-2 font-display text-[3.15rem] leading-[.78] tracking-[-.065em] sm:text-[4.5rem] lg:mt-0 lg:text-[clamp(6rem,15vw,17rem)] lg:leading-[.68] lg:tracking-[-.08em]">Find your<br/>Ruseè.</h2></Reveal>
        <div className="relative z-10 mx-auto mt-5 w-[min(68%,24rem)] lg:-mt-[clamp(2.5rem,5vw,5rem)]"><ParallaxImage src={centre} alt="Ruseè kimono collection" sizes="(min-width:1024px) 24rem, 68vw" className="aspect-[3/4]" speed={8}/></div>
        <Reveal className="relative z-20 mt-6 flex justify-center"><LetterHoverLink href="/shop" trailingVisual={<ArrowUpRight className="size-4"/>} className="gap-2.5 px-5 py-3.5 text-[.68rem] uppercase tracking-[.14em] sm:gap-3 sm:px-7 sm:py-5 sm:text-xs sm:tracking-[.16em]">Explore the collection</LetterHoverLink></Reveal>
      </div>

      <div className="hidden lg:block"><ParallaxImage src={right} alt="Ruseè kimono styled in daylight" sizes="18vw" className="aspect-[3/4]" speed={6}/></div>
    </div>
  </section>;
}
