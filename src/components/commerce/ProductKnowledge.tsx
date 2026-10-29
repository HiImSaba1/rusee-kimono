"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import Image from "next/image";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { useHydrated } from "@/hooks/useHydrated";

export function ProductKnowledge({ eyebrow, title, intro, sections, images }: { eyebrow: string; title: string; intro: string; sections: Array<{ label: string; text: string }>; images: string[] }) {
  const root = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  useGSAP(() => {
    if (!hydrated || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from("[data-knowledge-heading]", { yPercent: 28, clipPath: "inset(0 0 100% 0)", autoAlpha: 0, duration: .9, stagger: .08, ease: "power4.out", scrollTrigger: { trigger: root.current, start: "top 78%", once: true }, clearProps: "clipPath" });
    gsap.utils.toArray<HTMLElement>("[data-knowledge-card]").forEach((card) => {
      const frame = card.querySelector<HTMLElement>("[data-knowledge-image]");
      const image = frame?.querySelector("img");
      const copy = card.querySelectorAll<HTMLElement>("[data-knowledge-card-copy]");
      const timeline = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 88%", once: true } });

      timeline.from(card, { y: 44, autoAlpha: 0, duration: .72, ease: "power3.out" });
      if (frame) timeline.fromTo(frame, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: .9, ease: "power4.inOut" }, "<.08");
      if (image) timeline.fromTo(image, { scale: 1.1, xPercent: -3 }, { scale: 1, xPercent: 0, duration: 1.1, ease: "power3.out" }, "<");
      timeline.from(copy, { y: 20, autoAlpha: 0, duration: .55, stagger: .07, ease: "power3.out" }, "-=.35");
    });
  }, { scope: root, dependencies: [hydrated], revertOnUpdate: true });
  return <section ref={root} className="section-shell overflow-hidden border-t border-ink/15">
    <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><p data-knowledge-heading className="eyebrow">{eyebrow}</p><h2 data-knowledge-heading className="mt-5 max-w-4xl overflow-visible py-[.12em] font-display text-[clamp(3.8rem,7vw,8.5rem)] leading-[.86] tracking-[-.06em]">{title}</h2></div><p data-knowledge-heading className="max-w-xl self-end text-lg leading-relaxed text-ink/70">{intro}</p></div>
    <div className="mt-10 grid gap-[clamp(.65rem,1.5vw,1.4rem)] md:grid-cols-2 xl:grid-cols-3">{sections.map((section, index) => <article data-knowledge-card key={section.label} className="overflow-hidden bg-paper-deep"><div data-knowledge-image className="relative aspect-[3/4] overflow-hidden"><ParallaxImage src={images[index % images.length] ?? "/kimono_images_optimized/kimono_design_artemis_main.png"} alt="" sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw" className="h-full w-full" imageClassName="object-contain object-center" speed={5} /></div><div className="px-3.5 py-4"><div data-knowledge-card-copy className="flex items-start justify-between"><span className="font-mono text-xs tracking-[.14em] text-ink/70">{String(index + 1).padStart(2, "0")}</span><Image src="/rusee-flower-logo.png" alt="" aria-hidden="true" width={48} height={68} className="h-auto w-8 object-contain" /></div><h3 data-knowledge-card-copy className="mt-4 overflow-visible py-[.08em] font-display text-[clamp(1.75rem,2.5vw,2.8rem)] leading-none">{section.label}</h3><p data-knowledge-card-copy className="mt-3 text-[clamp(1rem,.92rem+.25vw,1.15rem)] leading-[1.2] text-ink/70">{section.text}</p></div></article>)}</div>
  </section>;
}
