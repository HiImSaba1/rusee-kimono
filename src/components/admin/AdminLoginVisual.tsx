"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

export function AdminLoginVisual() {
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!media.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(media.current, { clipPath: "inset(0% 0% 0% 0%)", clearProps: "willChange" });
      return;
    }
    const reveal = gsap.fromTo(
      media.current,
      { clipPath: "inset(0% 0% 100% 0%)", willChange: "clip-path" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.05, ease: "power4.inOut", clearProps: "willChange" },
    );
    return () => reveal.kill();
  }, { scope: root });

  return (
    <div ref={root} className="relative hidden overflow-hidden bg-ink p-[var(--gutter)] text-paper lg:flex lg:flex-col lg:justify-between">
      <div ref={media} data-testid="admin-login-visual" style={{ clipPath: "inset(0% 0% 100% 0%)" }} className="absolute inset-0">
        <Image src="/kimono_images_optimized/kimono_design_birds_4.webp" alt="" fill loading="eager" fetchPriority="high" sizes="55vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/[.65]" />
      </div>
      <p className="eyebrow relative z-10 text-paper/70">Private operations</p>
      <h1 className="relative z-10 font-display text-[clamp(6rem,12vw,13rem)] leading-[0.68] tracking-[-0.07em]">Ruseè<br /><em>studio.</em></h1>
      <p className="relative z-10 max-w-sm text-sm leading-relaxed text-paper/75">Catalogue, reservations, orders and payment attention in one protected workspace.</p>
    </div>
  );
}
