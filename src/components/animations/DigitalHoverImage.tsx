"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { cn } from "@/lib/utils/cn";

const symbols = ["O", "X", "*", ">", "$", "W"];
const blockSize = 28;

type Block = { id: number; x: number; y: number; symbol: string; empty: boolean };

type DigitalHoverImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  parallax?: boolean;
  parallaxAxis?: "x" | "y";
  parallaxStrength?: number;
  activeCellCount?: number;
};

export function DigitalHoverImage({ src, alt, className, imageClassName, sizes = "(max-width: 768px) 100vw, 50vw", priority, parallax = false, parallaxAxis = "y", parallaxStrength = 9, activeCellCount = 10 }: DigitalHoverImageProps) {
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [active, setActive] = useState<Set<number>>(() => new Set());
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const buildGrid = () => {
      const { width, height } = element.getBoundingClientRect();
      const cols = Math.ceil(width / blockSize);
      const rows = Math.ceil(height / blockSize);
      setBlocks(Array.from({ length: cols * rows }, (_, id) => ({
        id,
        x: (id % cols) * blockSize,
        y: Math.floor(id / cols) * blockSize,
        symbol: symbols[(id * 7 + Math.floor(id / Math.max(cols, 1))) % symbols.length],
        empty: id % 5 === 0,
      })));
    };
    buildGrid();
    const observer = new ResizeObserver(buildGrid);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (!parallax || !root.current || !media.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const from = parallaxAxis === "x" ? { xPercent: -parallaxStrength } : { yPercent: -parallaxStrength };
    const to = parallaxAxis === "x" ? { xPercent: parallaxStrength } : { yPercent: parallaxStrength };
    gsap.fromTo(media.current, from, { ...to, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.7 } });
  }, { scope: root, dependencies: [parallax, parallaxAxis, parallaxStrength], revertOnUpdate: true });

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const cols = Math.ceil(rect.width / blockSize);
    const rows = Math.ceil(rect.height / blockSize);
    const pointerCol = Math.min(cols - 1, Math.max(0, Math.floor(mouseX / blockSize)));
    const pointerRow = Math.min(rows - 1, Math.max(0, Math.floor(mouseY / blockSize)));
    const radius = Math.max(2, Math.ceil(Math.sqrt(activeCellCount)));
    const nearby: Block[] = [];

    for (let row = Math.max(0, pointerRow - radius); row <= Math.min(rows - 1, pointerRow + radius); row += 1) {
      for (let col = Math.max(0, pointerCol - radius); col <= Math.min(cols - 1, pointerCol + radius); col += 1) {
        const block = blocks[row * cols + col];
        if (block) nearby.push(block);
      }
    }

    const cluster = new Set(
      nearby
        .sort((a, b) => Math.hypot(mouseX - (a.x + blockSize / 2), mouseY - (a.y + blockSize / 2)) - Math.hypot(mouseX - (b.x + blockSize / 2), mouseY - (b.y + blockSize / 2)))
        .slice(0, activeCellCount)
        .map((block) => block.id),
    );
    setActive(cluster);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setActive(new Set()), 280);
  }, [activeCellCount, blocks]);

  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  return (
    <div ref={root} data-digital-hover-image onMouseMove={handleMove} onMouseLeave={() => setActive(new Set())} className={cn("group relative overflow-hidden bg-surface", className)}>
      <div ref={media} data-digital-hover-media className={cn("absolute inset-0", parallax && parallaxAxis === "y" && "-inset-y-[12%]", parallax && parallaxAxis === "x" && "-inset-x-[12%]")}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn("object-cover transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:scale-[1.025]", imageClassName)} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 hidden overflow-hidden md:block" aria-hidden="true">
        {blocks.map((block) => (
          <span
            key={block.id}
            className={cn("absolute grid place-items-center bg-[#0a0a0a] font-mono text-[0.68rem] text-[#f1eee8] opacity-0 transition-opacity duration-75", active.has(block.id) && "opacity-100")}
            style={{ left: block.x, top: block.y, width: blockSize, height: blockSize, "--symbol-delay": `${block.id % 4}ms` } as CSSProperties}
          >
            {active.has(block.id) ? symbols[(block.id + active.size) % symbols.length] : block.empty ? "" : block.symbol}
          </span>
        ))}
      </div>
    </div>
  );
}
