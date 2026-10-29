"use client";

import Image, { type ImageProps } from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";
import { gsap } from "@/lib/animations/gsap";

type ParallaxImageProps = Omit<ImageProps, "fill"> & {
  className?: string;
  imageClassName?: string;
  mediaClassName?: string;
  speed?: number;
};

export function ParallaxImage({
  alt,
  className,
  imageClassName,
  mediaClassName,
  speed = 12,
  sizes = "(max-width: 768px) 100vw, 50vw",
  ...imageProps
}: ParallaxImageProps) {
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current || !media.current) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      gsap.fromTo(
        media.current,
        { yPercent: -speed },
        {
          yPercent: speed,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
          },
        },
      );
    },
    { scope: root, dependencies: [speed], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={cn("group/parallax relative overflow-hidden", className)}>
      <div
        ref={media}
        className={cn("absolute -inset-y-[15%] inset-x-0 will-change-transform", mediaClassName)}
      >
        <Image
          {...imageProps}
          alt={alt}
          fill
          sizes={sizes}
          className={cn("object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/parallax:scale-[1.055]", imageClassName)}
        />
      </div>
    </div>
  );
}
