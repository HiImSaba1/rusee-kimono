"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import { gsap } from "@/lib/animations/gsap";

type HoverImageEffectProps = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  accent?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

const pathA = "M227 1819C227 1819 406 2208 569 2130C843 2000 -264 1002 227 876C553 793 774 2456 1342 2130C1885 1819 15 456 761 137C1342 -111 1664 2266 2210 1973C2756 1679 1537 384 1827 137C2014 -22 2210 381 2210 381";
const pathB = "M1661 2256C1661 2256 2311 1960 2112 1817C1944 1697 718 2870 500 2256C309 1719 2458 1614 2112 964C1766 313 428 2195 132 1456C-155 736 2015 892 1709 252C1438 -314 369 909 132 567C18 402 245 193 245 193";

export function HoverImageEffect({ src, alt, title, subtitle, accent = "#d7ff4f", className, priority, sizes = "(max-width: 1024px) 100vw, 50vw" }: HoverImageEffectProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = root.current;
    if (!element) return;
    const paths = Array.from(element.querySelectorAll<SVGPathElement>("[data-ink-path]"));
    const label = element.querySelector<HTMLElement>("[data-hover-label]");
    if (!label) return;

    const lengths = paths.map((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      return length;
    });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const enter = () => {
      gsap.killTweensOf([...paths, label]);
      if (!reduceMotion) gsap.to(paths, { strokeDashoffset: 0, attr: { strokeWidth: 650 }, duration: 1.35, ease: "power2.out" });
      gsap.to(label, { autoAlpha: 1, y: 0, duration: 0.45, delay: reduceMotion ? 0 : 0.3, ease: "power2.out" });
    };
    const leave = () => {
      gsap.killTweensOf([...paths, label]);
      if (!reduceMotion) gsap.to(paths, { strokeDashoffset: (index) => lengths[index], attr: { strokeWidth: 110 }, duration: 0.85, ease: "power2.out" });
      gsap.to(label, { autoAlpha: 0, y: 12, duration: 0.25 });
    };

    element.addEventListener("mouseenter", enter);
    element.addEventListener("mouseleave", leave);
    element.addEventListener("focus", enter);
    element.addEventListener("blur", leave);
    return () => {
      element.removeEventListener("mouseenter", enter);
      element.removeEventListener("mouseleave", leave);
      element.removeEventListener("focus", enter);
      element.removeEventListener("blur", leave);
      gsap.killTweensOf([...paths, label]);
    };
  }, { scope: root });

  return (
    <div ref={root} tabIndex={0} className={cn("group relative overflow-hidden outline-none", className)}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:scale-[1.025] group-focus:scale-[1.025]" />
      <div className="pointer-events-none absolute inset-0 scale-150" aria-hidden="true">
        <svg viewBox="0 0 2453 2273" className="size-full fill-none"><path data-ink-path d={pathA} stroke={accent} strokeWidth="110" strokeLinecap="round" /></svg>
      </div>
      <div className="pointer-events-none absolute inset-0 scale-150" aria-hidden="true">
        <svg viewBox="0 0 2250 2535" className="size-full fill-none"><path data-ink-path d={pathB} stroke="#f2f0ea" strokeWidth="110" strokeLinecap="round" /></svg>
      </div>
      <div data-hover-label className="invisible absolute inset-x-0 bottom-0 z-10 translate-y-3 bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-20 text-left opacity-0">
        <p className="font-display text-3xl uppercase text-white">{title}</p>
        <p className="mt-1 text-xs text-white/70">{subtitle}</p>
      </div>
    </div>
  );
}
