"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { ProductPurchasePanel } from "@/components/commerce/ProductPurchasePanel";
import { compatibleSizeIds, type SellableVariant } from "@/features/catalogue/product-selection";
import { gsap } from "@/lib/animations/gsap";
import { kimonoDesignGallery } from "@/lib/media/kimono-images";

type Option = { id: number; slug?: string; name?: string; label?: string; code?: string; hex?: string | null };

export function ProductExperience({ design, colours, sizes, variants, designIndex }: {
  design: { id: number; name: string; story: string | null; fixedColourId?: number | null };
  colours: Option[];
  sizes: Option[];
  variants: SellableVariant[];
  designIndex: number;
}) {
  const galleryRoot = useRef<HTMLDivElement>(null);
  const fixedColourId = design.fixedColourId ?? variants[0]?.variant.colourId;
  const initialSizeId = sizes.find(size => compatibleSizeIds(variants, design.id, fixedColourId).has(size.id))?.id;
  const [activeSizeId, setActiveSizeId] = useState(initialSizeId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previousImageIndex, setPreviousImageIndex] = useState<number | null>(null);
  const [autoplayRevision, setAutoplayRevision] = useState(0);
  const activeImageIndexRef = useRef(0);
  const gallery = kimonoDesignGallery(designIndex);

  const showImage = useCallback((nextIndex: number) => {
    const normalized = ((nextIndex % gallery.length) + gallery.length) % gallery.length;
    if (normalized === activeImageIndexRef.current) return;
    setPreviousImageIndex(activeImageIndexRef.current);
    activeImageIndexRef.current = normalized;
    setActiveImageIndex(normalized);
  }, [gallery.length]);

  const selectImage = useCallback((nextIndex: number) => {
    showImage(nextIndex);
    setAutoplayRevision(revision => revision + 1);
  }, [showImage]);

  useEffect(() => {
    if (gallery.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => showImage(activeImageIndexRef.current + 1), 3000);
    return () => window.clearInterval(timer);
  }, [autoplayRevision, gallery.length, showImage]);

  useGSAP(() => {
    if (!galleryRoot.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo("[data-product-carousel]", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.05, ease: "power4.inOut", clearProps: "clipPath" });
  }, { scope: galleryRoot });

  useGSAP(() => {
    if (previousImageIndex === null || !galleryRoot.current) return;
    const incoming = galleryRoot.current.querySelector<HTMLElement>("[data-carousel-incoming]");
    if (!incoming) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPreviousImageIndex(null); return; }
    const transition = gsap.fromTo(incoming, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.05, ease: "power4.inOut", onComplete: () => setPreviousImageIndex(null) });
    return () => transition.kill();
  }, { scope: galleryRoot, dependencies: [activeImageIndex, previousImageIndex], revertOnUpdate: true });

  const activeImage = gallery[activeImageIndex] ?? gallery[0];
  const activeAlt = `${design.name} kimono — view ${activeImageIndex + 1} of ${gallery.length}`;

  return <div className="grid items-stretch gap-[clamp(.5rem,1vw,1rem)] lg:grid-cols-2">
    <div ref={galleryRoot} data-testid="size-responsive-gallery" data-active-size={activeSizeId} className="flex h-full min-w-0 flex-col justify-center">
      <div data-product-carousel className="relative mx-auto aspect-[9/16] h-[min(80svh,56rem)] max-w-full overflow-visible">
        {previousImageIndex !== null && <ParallaxImage key={`previous-${gallery[previousImageIndex]}`} src={gallery[previousImageIndex]} alt="" sizes="(min-width:1024px) 62vw,100vw" className="absolute inset-0 h-full w-full" mediaClassName="!inset-y-0" imageClassName="object-contain object-center" speed={0} />}
        <div data-carousel-incoming className="absolute inset-0"><ParallaxImage key={activeImage} src={activeImage} alt={activeAlt} loading="eager" fetchPriority="high" sizes="(min-width:1024px) 62vw,100vw" className="h-full w-full" mediaClassName="!inset-y-0" imageClassName="object-contain object-center" speed={0} /></div>
        {gallery.length > 1 && <><button type="button" onClick={() => selectImage(activeImageIndex - 1)} aria-label={`Previous ${design.name} image`} className="group absolute left-2 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-ink text-paper shadow-lg transition-all duration-300 hover:scale-110 hover:bg-paper-deep focus-visible:scale-110 focus-visible:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:-left-14"><ChevronLeft aria-hidden="true" className="size-5 transition-transform duration-300 group-hover:-translate-x-0.5" /></button><button type="button" onClick={() => selectImage(activeImageIndex + 1)} aria-label={`Next ${design.name} image`} className="group absolute right-2 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-ink text-paper shadow-lg transition-all duration-300 hover:scale-110 hover:bg-paper-deep focus-visible:scale-110 focus-visible:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:-right-14"><ChevronRight aria-hidden="true" className="size-5 transition-transform duration-300 group-hover:translate-x-0.5" /></button><span className="absolute bottom-4 left-4 z-20 font-mono text-[.62rem] uppercase tracking-[.14em] text-white mix-blend-difference">{String(activeImageIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</span></>}
      </div>
      {gallery.length > 1 && <div className="mt-[5px] grid grid-cols-4 gap-[5px] sm:grid-cols-6 lg:grid-cols-8" aria-label={`${design.name} image thumbnails`}>
        {gallery.map((src, index) => <button key={src} type="button" onClick={() => selectImage(index)} aria-label={`Show ${design.name} image ${index + 1}`} aria-current={index === activeImageIndex ? "true" : undefined} className={`relative aspect-square overflow-hidden border bg-paper transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${index === activeImageIndex ? "border-ink opacity-100" : "border-transparent opacity-60 hover:opacity-100"}`}>
          <Image src={src} alt="" fill sizes="(min-width:1024px) 8vw,25vw" className="object-contain" />
        </button>)}
      </div>}
    </div>
    <ProductPurchasePanel design={design} colours={colours} sizes={sizes} variants={variants} onSizeChange={setActiveSizeId} />
  </div>;
}
