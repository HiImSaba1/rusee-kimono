"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import { gsap } from "@/lib/animations/gsap";
import { usePageTransition } from "@/providers/PageTransitionProvider";

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  delay?: number;
  duration?: number;
  once?: boolean;
  y?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 1.1,
  once = true,
  y = 32,
  ...props
}: RevealProps) {
  const root = useRef<HTMLDivElement>(null);
  const { isPageReady } = usePageTransition();

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;

      if (!isPageReady) {
        gsap.set(element, { autoAlpha: 0, y, clipPath: "inset(0 0 100% 0)" });
        return;
      }

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        gsap.set(element, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        element,
        { autoAlpha: 0, y, clipPath: "inset(0 0 100% 0)" },
        {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0 0% 0)",
          delay,
          duration,
          ease: "expo.out",
          clearProps: "transform,opacity,visibility,clipPath,willChange",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            toggleActions: once ? "play none none none" : "play none none reverse",
            once,
          },
        },
      );
    },
    { scope: root, dependencies: [delay, duration, isPageReady, once, y], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={cn("will-change-[transform,opacity]", className)} {...props}>
      {children}
    </div>
  );
}
