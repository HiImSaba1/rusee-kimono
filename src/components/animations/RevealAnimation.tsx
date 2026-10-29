"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { usePageTransition } from "@/providers/PageTransitionProvider";
import { ROUTE_ENTRANCE_DELAY } from "@/lib/animations/timing";

export function RevealAnimation({
  children,
  className,
  animateOnScroll = true,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  animateOnScroll?: boolean;
  delay?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { isPageReady } = usePageTransition();

  useGSAP(() => {
    const container = root.current;
    if (!container) return;
    if (!isPageReady) {
      gsap.set(container, { autoAlpha: 0 });
      return;
    }

    let cancelled = false;
    const splits: SplitText[] = [];
    let tween: gsap.core.Tween | undefined;

    const setup = () => {
      if (cancelled || !container.isConnected) return;
      gsap.set(container, { autoAlpha: 1 });
      const elements = Array.from(container.children).filter((element): element is HTMLElement => element instanceof HTMLElement);
      const lines = elements.flatMap((element) => {
        const split = SplitText.create(element, { type: "lines", mask: "lines", linesClass: "reveal-line++", aria: "none" });
        splits.push(split);
        return split.lines;
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set(lines, { yPercent: 110, willChange: "transform" });
      tween = gsap.to(lines, {
        yPercent: 0,
        duration: 1.25,
        stagger: 0.12,
        delay: animateOnScroll ? delay : ROUTE_ENTRANCE_DELAY + delay,
        ease: "power4.out",
        clearProps: "transform,willChange",
        ...(animateOnScroll ? {
          scrollTrigger: {
            trigger: container,
            start: "top 88%",
            end: "top 58%",
            scrub: 0.8,
          },
        } : {}),
      });
    };

    if (document.fonts.status === "loaded") setup();
    else void document.fonts.ready.then(setup);

    return () => {
      cancelled = true;
      tween?.kill();
      splits.forEach((split) => split.revert());
    };
  }, { scope: root, dependencies: [animateOnScroll, delay, isPageReady], revertOnUpdate: true });

  return <div ref={root} className={cn("relative", className)}>{children}</div>;
}
