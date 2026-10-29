"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

export function EditorialSectionChoreography({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = Array.from(root.current.querySelectorAll<HTMLElement>(":scope > section, [data-editorial-section]"));
    const timelines = sections.map(section => {
      const media = Array.from(section.querySelectorAll<HTMLElement>("img, video")).slice(0, 18);
      const copy = Array.from(section.querySelectorAll<HTMLElement>("h1, h2, h3, .eyebrow, p, a, button")).filter(element => !element.closest("[data-burst-photo]")).slice(0, 40);
      const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 88%", once: true } });
      timeline.fromTo(section, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.05, ease: "power4.inOut", clearProps: "clipPath" });
      if (media.length) timeline.fromTo(media, { clipPath: "inset(100% 0 0 0)", autoAlpha: 0 }, { clipPath: "inset(0% 0 0 0)", autoAlpha: 1, duration: .85, stagger: .035, ease: "power4.inOut", clearProps: "clipPath,opacity,visibility" }, "-=.62");
      if (copy.length) timeline.fromTo(copy, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .75, stagger: .035, ease: "power3.out", clearProps: "transform,opacity,visibility" }, "-=.52");
      return timeline;
    });
    return () => timelines.forEach(timeline => timeline.kill());
  }, { scope: root });

  return <div ref={root} data-page-entrance-skip>{children}</div>;
}
