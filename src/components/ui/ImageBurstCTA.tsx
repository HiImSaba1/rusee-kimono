"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { LetterHoverLink } from "@/components/ui/LetterHoverLink";
import { kimonoImage } from "@/lib/media/kimono-images";
import { useHydrated } from "@/hooks/useHydrated";

type CtaLine = { before?: string; keyword: string; after?: string };
const defaultImages = [1, 2, 3, 4, 5, 6].map(kimonoImage);

export function ImageBurstCTA({ kicker, lines, buttonLabel, href = "/shop", images = defaultImages, compact = false }: { kicker: string; lines: readonly CtaLine[]; buttonLabel: string; href?: string; images?: readonly string[]; compact?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const activeTimeline = useRef<gsap.core.Timeline | null>(null);
  const hydrated = useHydrated();
  useGSAP(() => {
    if (!hydrated || !root.current) return;
    const photos = gsap.utils.toArray<HTMLElement>("[data-burst-photo]");
    const triggers = gsap.utils.toArray<HTMLElement>("[data-burst-trigger]");
    const hide = () => gsap.set(photos, { left: "50%", top: "50%", xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: 0, clipPath: "inset(100% 0 0 0)" });
    const stop = () => { activeTimeline.current?.kill(); activeTimeline.current = null; gsap.killTweensOf(photos); hide(); };
    const play = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      stop();
      photos.forEach((photo, index) => gsap.set(photo, { left: `${gsap.utils.random(5, 95)}%`, top: `${gsap.utils.random(8, 92)}%`, x: gsap.utils.random(-42, 42), y: gsap.utils.random(45, 100), rotation: gsap.utils.random(-3, 3), zIndex: index }));
      const revealStagger = 0.075;
      const revealDuration = 0.32;
      const revealEnd = (photos.length - 1) * revealStagger + revealDuration;
      const timeline = gsap.timeline({ onComplete: stop });
      activeTimeline.current = timeline;
      photos.forEach((photo, index) => timeline.to(photo, { x: gsap.utils.random(-35, 35), y: gsap.utils.random(-25, 25), rotation: gsap.utils.random(-11, 11), clipPath: "inset(0% 0 0 0)", duration: revealDuration, ease: "power3.out" }, index * revealStagger));
      photos.forEach((photo, index) => timeline.to(photo, { x: `+=${gsap.utils.random(-50, 50)}`, y: `+=${gsap.utils.random(170, 260)}`, rotation: `+=${gsap.utils.random(-9, 9)}`, clipPath: "inset(0% 0 100% 0)", duration: 0.3, ease: "power2.in" }, revealEnd + index * 0.06));
    };
    hide();
    triggers.forEach((trigger) => { trigger.addEventListener("mouseenter", play); trigger.addEventListener("focus", play); trigger.addEventListener("mouseleave", stop); trigger.addEventListener("blur", stop); });
    return () => { triggers.forEach((trigger) => { trigger.removeEventListener("mouseenter", play); trigger.removeEventListener("focus", play); trigger.removeEventListener("mouseleave", stop); trigger.removeEventListener("blur", stop); }); stop(); };
  }, { scope: root, dependencies: [hydrated, images], revertOnUpdate: true });

  return <section ref={root} className={`relative flex flex-col items-center justify-center overflow-hidden border-y border-ink/20 bg-paper px-[var(--gutter)] text-center ${compact ? "max-h-[70svh] min-h-0 py-[clamp(10rem,30svh,15rem)]" : "min-h-[88svh] py-[var(--section)]"}`}>
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">{images.map((src, index) => <div key={`${src}-${index}`} data-burst-photo className="absolute aspect-[3/4] w-[clamp(7rem,18vw,13.5rem)] overflow-hidden will-change-transform"><Image src={src} alt="" fill sizes="220px" className="object-cover" /></div>)}</div>
    <p className={`eyebrow relative z-10 ${compact ? "mb-5" : "mb-10"}`}>{kicker}</p>
    <h2 className="relative z-10 font-display text-[clamp(4rem,9vw,10rem)] leading-[0.82] tracking-[-0.06em]">{lines.map((line) => <span key={`${line.before}-${line.keyword}`} className="block">{line.before}<span data-burst-trigger tabIndex={0} className="group/keyword relative z-20 cursor-default outline-none">{line.keyword}<span aria-hidden="true" className="absolute inset-x-0 -bottom-[.04em] h-px origin-left scale-x-0 bg-ink transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover/keyword:scale-x-100 group-focus/keyword:scale-x-100" /></span>{line.after}</span>)}</h2>
    <LetterHoverLink href={href} className={`relative z-20 bg-ink px-7 py-4 text-xs uppercase tracking-[0.18em] text-paper ${compact ? "mt-7" : "mt-12"}`}>{buttonLabel}</LetterHoverLink>
  </section>;
}
