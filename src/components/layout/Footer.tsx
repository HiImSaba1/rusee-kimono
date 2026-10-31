"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/animations/gsap";
import { navigation, site } from "@/lib/site";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { LetterHoverLink } from "@/components/ui/LetterHoverLink";

export function Footer() {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    const footer=root.current;if(!footer)return;const items=footer.querySelectorAll<HTMLElement>("[data-footer-item]");const title=footer.querySelector<HTMLElement>("[data-footer-title]");if(!title)return;
    const split = SplitText.create(title, { type: "lines", mask: "lines", aria: "none" });
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){gsap.set(footer,{clipPath:"inset(0% 0 0 0)"});gsap.set([...items,...split.lines],{autoAlpha:1,y:0,yPercent:0});return()=>split.revert();}
    gsap.set(footer,{clipPath:"inset(100% 0 0 0)",willChange:"clip-path"});gsap.set(items,{y:28,autoAlpha:0});gsap.set(split.lines,{yPercent:115,autoAlpha:0,willChange:"transform"});const timeline=gsap.timeline({scrollTrigger:{trigger:footer,start:"bottom bottom",once:true}});timeline.to(footer,{clipPath:"inset(0% 0 0 0)",duration:.95,ease:"power4.inOut",clearProps:"willChange"}).to(items,{y:0,autoAlpha:1,duration:.65,stagger:.065,ease:"power3.out"},"-=.3").to(split.lines,{yPercent:0,autoAlpha:1,duration:1,stagger:.13,ease:"power4.out",clearProps:"transform,willChange"},"-=.3");return()=>{timeline.kill();split.revert();};
  }, { scope: root });

  return (
    <footer ref={root} data-site-footer className="sticky bottom-0 z-0 min-h-0 overflow-hidden bg-paper-deep px-[var(--gutter)] pb-4 pt-6 text-paper sm:pb-6 sm:pt-12">
      <div className="grid grid-cols-2 gap-x-5 border-t border-paper/25 pt-5 sm:gap-x-[clamp(1.25rem,6vw,8rem)] sm:pt-7 lg:grid-cols-12 lg:gap-x-8 xl:gap-x-14">
        <nav data-footer-item aria-label="Footer navigation" className="col-start-1 row-start-1 flex min-w-0 flex-col items-start gap-1 lg:col-span-3 lg:col-start-6 lg:gap-1.5">
          {navigation.map((item) => <LetterHoverLink key={item.href} href={item.href} className="font-display text-[1.15rem] leading-[1.05] sm:text-[clamp(1.55rem,3vw,2.65rem)] sm:leading-[1]">{item.label}</LetterHoverLink>)}
        </nav>

        <div data-footer-item className="col-span-2 col-start-1 row-start-2 mt-7 min-w-0 sm:col-span-1 sm:mt-14 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:mt-0">
          <p className="eyebrow text-paper/55">Letters from the studio</p>
          <h2 className="mt-3 max-w-xl font-display text-[1.8rem] leading-[0.92] tracking-[-0.04em] sm:mt-4 sm:text-[clamp(2rem,5vw,5.5rem)] sm:leading-[0.9] sm:tracking-[-0.05em]">Stories of colour,<br />cloth and movement.</h2>
          <NewsletterForm />
        </div>

        <div className="col-start-2 row-start-1 min-w-0 text-right text-[.7rem] leading-tight sm:row-span-2 sm:text-sm lg:col-span-4 lg:col-start-9 lg:row-span-1">
          <nav data-footer-item aria-label="Information" className="flex flex-col items-end gap-1 sm:gap-1.5">
            <p className="eyebrow mb-1 text-paper/55 sm:mb-2">Information</p>
            <LetterHoverLink href="/privacy-policy">Privacy policy</LetterHoverLink>
            <LetterHoverLink href="/cookies">Cookies</LetterHoverLink>
            <LetterHoverLink href="/terms">Terms</LetterHoverLink>
            <LetterHoverLink href="/returns">Returns</LetterHoverLink>
            <LetterHoverLink href="/shipping">Shipping</LetterHoverLink>
            <LetterHoverLink href="/payment-methods">Payments</LetterHoverLink>
            <LetterHoverLink href="/care-guide">Care & fit</LetterHoverLink>
          </nav>
          <div data-footer-item className="mt-6 sm:mt-14">
            <a href={`mailto:${site.email}`} className="break-words border-b border-paper/35 pb-1">{site.email}</a>
            <p className="pt-3 text-paper/55 sm:pt-5">{site.location}<br />Shipping worldwide</p>
            <div className="flex flex-col items-end gap-1 pt-3 uppercase tracking-[0.12em] sm:flex-row sm:justify-end sm:gap-4 sm:pt-5 sm:tracking-[0.14em]"><a href="#">Instagram</a><a href="#">Pinterest</a></div>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-end justify-between border-b border-paper/25 pb-2 sm:mt-[clamp(2.5rem,7vh,5.5rem)] sm:pb-3">
        <p data-footer-title role="img" aria-label="RUSEÈ" className="overflow-visible py-[0.1em] font-display text-[3.75rem] leading-[1em] tracking-[-0.055em] sm:text-[clamp(4.5rem,14vw,13rem)] sm:leading-[1.2em] sm:tracking-[-0.065em]">RUSEÈ</p>
        <span data-footer-item className="mb-1 max-w-24 text-right text-[0.5rem] uppercase tracking-[0.13em] sm:max-w-none sm:text-[0.62rem] sm:tracking-[0.18em]">Kimono study Nº 01</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-[0.58rem] uppercase tracking-[0.11em] text-paper/50 sm:mt-4 sm:text-[0.72rem] sm:tracking-[0.14em]">
        <span>© {new Date().getFullYear()} Ruseè</span>
        <a href="https://sabaweb.gr" target="_blank" rel="noreferrer" className="text-right transition-colors hover:text-paper focus-visible:text-paper">Made by Sabaweb Solutions</a>
      </div>
    </footer>
  );
}
