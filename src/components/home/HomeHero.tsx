"use client";

import { useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { LetterHoverLink } from "@/components/ui/LetterHoverLink";
import { gsap } from "@/lib/animations/gsap";
import { ROUTE_ENTRANCE_DELAY } from "@/lib/animations/timing";
import { usePageTransition } from "@/providers/PageTransitionProvider";

export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const { isPageReady } = usePageTransition();

  useGSAP(() => {
    if (!root.current || !isPageReady) return;
    const background = root.current.querySelector<HTMLElement>("[data-home-hero-background]");
    const video = root.current.querySelector<HTMLElement>("[data-home-hero-video]");
    const copy = gsap.utils.toArray<HTMLElement>("[data-home-hero-copy]");
    if (!background || !video || !copy.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([background, video, ...copy], { clearProps: "all" });
      return;
    }

    const timeline = gsap.timeline({ delay: ROUTE_ENTRANCE_DELAY });
    timeline
      .fromTo(background, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.15, ease: "power4.inOut" })
      .fromTo(video, { clipPath: "inset(100% 0 0 0)", autoAlpha: 0 }, { clipPath: "inset(0% 0 0 0)", autoAlpha: 1, duration: 1, ease: "power4.inOut" }, "-=.62")
      .fromTo(copy, { y: 38, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, stagger: .1, ease: "power3.out", clearProps: "transform,opacity,visibility" }, "-=.42");
    return () => timeline.kill();
  }, { scope: root, dependencies: [isPageReady], revertOnUpdate: true });

  return <section ref={root} data-page-entrance-skip className="relative h-[80svh] max-h-[80svh] overflow-hidden border-b border-ink/20 bg-paper">
    <div data-home-hero-background className="absolute inset-0">
      <ParallaxImage src="/kimono_images_optimized/kimono_design_grouped_2.webp" alt="" aria-hidden="true" sizes="100vw" className="absolute inset-0 hidden md:block" speed={5} />
      <div className="absolute inset-0 hidden bg-ink/50 md:block" />
    </div>
    <video data-home-hero-video className="absolute inset-0 size-full object-cover md:inset-auto md:left-1/2 md:top-1/2 md:h-[68svh] md:max-h-[52rem] md:w-auto md:max-w-[min(42vw,32rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:object-cover md:shadow-[0_2rem_6rem_rgba(0,0,0,.4)] lg:h-[64svh]" autoPlay muted loop playsInline preload="metadata" poster="/kimono_images_optimized/kimono_design_grouped_1.webp" aria-label="Ruseè kimono in motion">
      <source src="/kimono_images_optimized/kimono-home-group-dance.mp4" type="video/mp4" />
    </video>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-ink/10" />
    <div className="absolute inset-x-0 bottom-0 px-[var(--gutter)] pb-6 text-paper">
      <div className="flex items-end justify-between gap-5"><p data-home-hero-copy className="max-w-xs text-sm leading-relaxed">A study in cloth, colour and the freedom of an open silhouette.</p><div data-home-hero-copy><LetterHoverLink href="/shop" trailingVisual={<ArrowDownRight className="size-4" />} className="gap-3 bg-ink px-6 py-4 text-xs uppercase tracking-[0.16em] text-paper">Discover the collection</LetterHoverLink></div></div>
      <h1 data-home-hero-copy className="mt-5 font-display text-[clamp(6.5rem,24vw,26rem)] leading-[0.58] tracking-[-0.08em]">RUSEÈ</h1>
    </div>
  </section>;
}
