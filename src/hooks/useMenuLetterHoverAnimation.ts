"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/animations/gsap";

export function useMenuLetterHoverAnimation(ref: RefObject<HTMLElement | null>, contentKey: string) {
  useGSAP(() => {
    const element = ref.current;
    if (!element) return;
    const base = element.querySelector<HTMLElement>("[data-hover-text-base]");
    const active = element.querySelector<HTMLElement>("[data-hover-text-active]");
    if (!base || !active) return;
    const media = gsap.matchMedia();
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const baseSplit = SplitText.create(base, { type: "chars", aria: "none" });
      const activeSplit = SplitText.create(active, { type: "chars", aria: "none" });
      gsap.set(activeSplit.chars, { yPercent: 125 });
      const timeline = gsap.timeline({ paused: true, defaults: { duration: 0.38, ease: "power3.inOut" } })
        .to(baseSplit.chars, { yPercent: -125, stagger: 0.012 }, 0)
        .to(activeSplit.chars, { yPercent: 0, stagger: 0.012 }, 0);
      const enter = () => timeline.play();
      const leave = () => timeline.reverse();
      element.addEventListener("mouseenter", enter); element.addEventListener("mouseleave", leave); element.addEventListener("focus", enter); element.addEventListener("blur", leave);
      return () => { element.removeEventListener("mouseenter", enter); element.removeEventListener("mouseleave", leave); element.removeEventListener("focus", enter); element.removeEventListener("blur", leave); timeline.kill(); baseSplit.revert(); activeSplit.revert(); };
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [contentKey] });
}
