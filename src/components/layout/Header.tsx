"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { Languages, ShoppingBag } from "lucide-react";
import { gsap } from "@/lib/animation/gsap";
import { navigation } from "@/lib/site";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { LetterHoverLink } from "@/components/ui/LetterHoverLink";
import { useCart } from "@/providers/CartProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { kimonoDesignModelImage } from "@/lib/media/kimono-images";

const menuModelImage = kimonoDesignModelImage(4, 8)!;
const menuHoverImage = kimonoDesignModelImage(5, 1)!;

export function Header() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const cart = useCart();
  const { locale, dictionary, setLocale } = useLocale();
  const nextLocale = locale === "en" ? "el" : "en";
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const switchLocale = () => setLocale(nextLocale);

  useGSAP(() => {
    if (!panel.current) return;
    const links = gsap.utils.toArray<HTMLElement>("[data-menu-link]");
    const visual = panel.current.querySelector<HTMLElement>("[data-menu-visual]");
    const visualImage = visual?.querySelector<HTMLImageElement>("img") ?? null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(panel.current, { display: open ? "grid" : "none", clipPath: "none" });
      gsap.set(links, { yPercent: 0 });
      return;
    }
    const timeline = gsap.timeline();
    if (open) {
      timeline
        .set(panel.current, { display: "grid", pointerEvents: "auto" })
        .fromTo(panel.current, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.95, ease: "power4.inOut" })
        .fromTo(links, { yPercent: 120 }, { yPercent: 0, duration: 0.75, stagger: 0.065, ease: "power4.out" }, 0.42);
      if (visual) timeline.fromTo(visual, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.9, ease: "power4.inOut" }, 0.38);
      if (visualImage) timeline.fromTo(visualImage, { scale: 1.12 }, { scale: 1, duration: 1.25, ease: "power3.out" }, 0.42);
    } else {
      timeline
        .to(links, { yPercent: -120, duration: 0.4, stagger: 0.035, ease: "power3.in" })
        .to(panel.current, { clipPath: "inset(0 0 100% 0)", duration: 0.75, ease: "power4.inOut" }, 0.08)
        .set(panel.current, { display: "none", pointerEvents: "none" });
    }
    return () => timeline.kill();
  }, { scope: root, dependencies: [open] });

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    let previousY = window.scrollY;
    let frame = 0;
    const update = () => {
      const currentY = window.scrollY;
      const delta = currentY - previousY;
      if (currentY <= 24 || delta < -6) setHidden(false);
      else if (!open && currentY > 96 && delta > 6) setHidden(true);
      previousY = currentY;
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [open]);

  return (
    <header ref={root} className={`fixed inset-x-0 top-0 z-[100] text-ink mix-blend-normal transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] will-change-transform ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`}>
      <div className={`relative z-[102] grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-ink/15 px-[var(--gutter)] backdrop-blur-xl transition-colors duration-500 sm:h-20 ${open ? "bg-paper-deep text-paper" : "bg-paper/75 text-ink"}`}>
        <TransitionLink href="/" className="flex h-14 w-fit items-center sm:h-16" aria-label="Ruseè home">
          <Image src="/rusee_logo_main_orig.jpg" alt="" width={368} height={275} priority sizes="96px" className="h-11 w-auto object-contain mix-blend-multiply sm:h-14" />
        </TransitionLink>
        <button data-header-control onClick={() => setOpen((value) => { const next = !value; if (next) setHidden(false); return next; })} aria-label={open ? dictionary.close : dictionary.menu} aria-expanded={open} aria-controls="site-menu" className="group relative flex h-10 cursor-pointer items-center gap-3 justify-self-center px-3 text-[0.68rem] uppercase tracking-[0.18em]">
            <span className="relative block h-3 w-5 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:rotate-180 group-focus-visible:rotate-180" aria-hidden="true"><i className={`absolute left-0 top-0 h-px w-5 bg-current transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`} /><i className={`absolute bottom-0 left-0 h-px w-5 bg-current transition-transform ${open ? "-translate-y-[6px] -rotate-45" : ""}`} /></span>
            <span className="relative hidden overflow-hidden leading-[1.15] sm:inline-grid"><span className="col-start-1 row-start-1 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full">{open ? dictionary.close : dictionary.menu}</span><span aria-hidden className="pointer-events-none absolute inset-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0">{open ? dictionary.close : dictionary.menu}</span></span>
        </button>
        <div className="flex items-center gap-2 justify-self-end">
          <button data-header-control data-no-translate type="button" onClick={switchLocale} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); switchLocale(); } }} aria-label={`${dictionary.language}: ${nextLocale === "el" ? "Ελληνικά" : "English"}`} title={nextLocale === "el" ? "Ελληνικά" : "English"} className="flex h-10 items-center gap-1.5 px-3 text-[.68rem] uppercase tracking-[.1em] sm:gap-2 sm:text-xs sm:tracking-[.12em]"><Languages className="size-3.5 sm:size-4" strokeWidth={1.5}/><span>{nextLocale === "el" ? "GR" : "EN"}</span></button>
          <button data-header-control onClick={() => cart.setOpen(true)} aria-label={`${dictionary.bag} ${cart.count}`} className="group relative flex h-10 items-center gap-2 px-4 text-[0.68rem] uppercase tracking-[0.18em]"><span className="relative hidden sm:block">{dictionary.bag}</span><ShoppingBag className="relative size-4" strokeWidth={1.5}/><span className="absolute -right-3 -top-3 flex size-6 items-center justify-center rounded-full bg-ink font-mono text-xs font-bold leading-none text-paper ring-2 ring-paper">{cart.count}</span></button>
        </div>
      </div>
      <div ref={panel} id="site-menu" className="fixed inset-0 z-[101] hidden h-svh grid-cols-1 bg-paper-deep px-[var(--gutter)] pb-8 pt-28 text-ink md:grid-cols-2">
        <nav aria-label="Primary navigation" className="flex flex-col justify-center border-y border-ink/20 md:border-r md:pr-12">
          {navigation.map((item, index) => (
            <div key={item.href} className="overflow-hidden border-b border-ink/20 transition-colors duration-300 last:border-b-0 hover:text-ink focus-within:text-ink">
              <div data-menu-link className="flex items-baseline justify-between py-2">
                <LetterHoverLink href={item.href} onClick={() => setOpen(false)} className="font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.98] tracking-[-0.045em]">{dictionary.nav[item.href] ?? item.label}</LetterHoverLink>
                <span className="font-sans text-[0.62rem] tracking-[0.18em]">0{index + 1}</span>
              </div>
            </div>
          ))}
        </nav>
        <div className="hidden min-h-0 flex-col border-y border-ink/20 p-6 md:flex lg:p-10">
          <div data-menu-visual className="group/menu-visual relative min-h-0 flex-1 overflow-hidden bg-paper">
            <Image src={menuModelImage} alt="Ruseè kimono worn in motion" fill priority sizes="50vw" className="object-cover opacity-100 transition-[opacity,transform] duration-[2400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/menu-visual:scale-[1.035] group-hover/menu-visual:opacity-20" />
            <Image src={menuHoverImage} alt="Ruseè kimono portrait outdoors" fill sizes="50vw" className="scale-[1.025] object-cover opacity-0 transition-[opacity,transform] duration-[2400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/menu-visual:scale-100 group-hover/menu-visual:opacity-100" />
          </div>
          <p className="mt-7 max-w-md font-display text-[clamp(1.65rem,2.5vw,2.8rem)] leading-[1.05] tracking-[-0.025em]">{dictionary.statement}</p>
          <div className="mt-8 flex justify-between border-t border-ink/20 pt-5 text-xs uppercase tracking-[0.15em]"><span>{dictionary.country}</span><span>{dictionary.shipping}</span></div>
        </div>
      </div>
    </header>
  );
}
