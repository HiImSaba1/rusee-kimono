"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import { gsap } from "@/lib/animations/gsap";

export type TextImageRevealLine = {
  before?: string;
  image: string;
  imageAlt?: string;
  after?: string;
};

export function TextImageReveal({ lines, className }: { lines: readonly TextImageRevealLine[]; className?: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const imageSpans = gsap.utils.toArray<HTMLElement>("[data-text-image]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetWidth = () => Math.min(300, Math.max(110, window.innerWidth * 0.2));

    if (reduceMotion) {
      gsap.set(imageSpans, { width: targetWidth });
      return;
    }

    imageSpans.forEach((imageSpan) => {
      gsap.fromTo(imageSpan, { width: 0 }, {
        width: targetWidth,
        ease: "none",
        scrollTrigger: {
          trigger: imageSpan.closest("[data-text-line]"),
          start: "top 90%",
          end: "top 42%",
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      });
    });
  }, { scope: root, dependencies: [lines], revertOnUpdate: true });

  return (
    <section ref={root} className={cn("flex min-h-svh items-center justify-center overflow-hidden border-y border-line px-[var(--page-gutter)] py-[var(--section-space)]", className)}>
      <div className="w-full">
        {lines.map((line, index) => (
          <div key={`${line.before}-${line.after}-${index}`} data-text-line className="flex flex-wrap items-center justify-center gap-x-[clamp(.65rem,1.6vw,1.5rem)] font-display text-[clamp(2.65rem,6.4vw,6.5rem)] uppercase leading-[0.92] tracking-[-0.03em]">
            {line.before && <span>{line.before}</span>}
            <span data-text-image className="relative my-2 inline-block h-[clamp(3.2rem,7.5vw,7rem)] shrink-0 overflow-hidden rounded-sm will-change-[width]">
              <Image src={line.image} alt={line.imageAlt ?? ""} fill sizes="300px" className="object-cover" />
            </span>
            {line.after && <span>{line.after}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
