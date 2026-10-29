"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import { gsap, SplitText as GSAPSplitText } from "@/lib/animations/gsap";
import { usePageTransition } from "@/providers/PageTransitionProvider";
import { ROUTE_ENTRANCE_DELAY } from "@/lib/animations/timing";

type SplitType = "chars" | "words" | "lines";
type TextTag = "h1" | "h2" | "h3" | "p" | "span";

type SplitTextProps = {
  as?: TextTag;
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  type?: SplitType;
  triggerOnScroll?: boolean;
};

export function SplitText({
  as: Tag = "span",
  children,
  className,
  delay = 0,
  duration = 1,
  stagger,
  type = "words",
  triggerOnScroll = true,
}: SplitTextProps) {
  const root = useRef<HTMLElement>(null);
  const { isPageReady } = usePageTransition();

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;

      if (!isPageReady) {
        gsap.set(element, { autoAlpha: 0 });
        return;
      }

      let split: GSAPSplitText | undefined;
      let animation: gsap.core.Tween | undefined;
      let cancelled = false;

      const setup = () => {
        if (cancelled || !element.isConnected) return;

        split = GSAPSplitText.create(element, {
          type,
          mask: type,
          autoSplit: type === "lines",
          aria: "none",
        });

        const targets = split[type];
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) {
          gsap.set(element, { autoAlpha: 1 });
          return;
        }

        gsap.set(element, { autoAlpha: 1 });
        gsap.set(targets, { yPercent: 110, rotate: 0.001, willChange: "transform" });
        const entranceDelay = triggerOnScroll ? delay : ROUTE_ENTRANCE_DELAY;
        animation = gsap.to(targets, {
          yPercent: 0,
          delay: entranceDelay,
          duration,
          stagger: stagger ?? (type === "chars" ? 0.018 : type === "words" ? 0.055 : 0.12),
          ease: "expo.out",
          clearProps: "transform,willChange",
          ...(triggerOnScroll
            ? {
                scrollTrigger: {
                  trigger: element,
                  start: "top 88%",
                  once: true,
                },
              }
            : {}),
        });
      };

      if (document.fonts.status === "loaded") setup();
      else void document.fonts.ready.then(setup);

      return () => {
        cancelled = true;
        animation?.kill();
        split?.revert();
      };
    },
    {
      scope: root,
      dependencies: [children, delay, duration, isPageReady, stagger, type, triggerOnScroll],
      revertOnUpdate: true,
    },
  );

  return (
    <Tag ref={root as React.Ref<never>} data-split-text className={cn("block overflow-visible", className)}>
      {children}
    </Tag>
  );
}
