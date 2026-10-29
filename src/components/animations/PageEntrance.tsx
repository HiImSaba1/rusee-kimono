"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { usePageTransition } from "@/providers/PageTransitionProvider";
import { ROUTE_ENTRANCE_DELAY } from "@/lib/animations/timing";

export function PageEntrance({children}:{children:React.ReactNode}){
  const root=useRef<HTMLDivElement>(null);const pathname=usePathname();const{isPageReady}=usePageTransition();
  useGSAP(()=>{const container=root.current;if(!container)return;if(!isPageReady){container.dataset.pageEntranceState="waiting";gsap.set(container,{autoAlpha:0});return;}container.dataset.pageEntranceState="animating";gsap.set(container,{autoAlpha:1});const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduced){container.dataset.pageEntranceState="complete";return;}
    let entrance:gsap.core.Timeline|null=null;const setup=()=>{if(!container.isConnected)return;
      entrance=gsap.timeline({onComplete:()=>{if(container.isConnected)container.dataset.pageEntranceState="complete";}});
      const textElements=Array.from(container.querySelectorAll<HTMLElement>("main h1, main h2, main .eyebrow, main section > p, main [data-curtain-copy]" )).filter(element=>!element.querySelector("[data-split-text]")&&!element.closest("[data-page-entrance-skip]"));
      if(textElements.length){gsap.set(textElements,{y:24,autoAlpha:0,willChange:"transform,opacity"});entrance.to(textElements,{y:0,autoAlpha:1,duration:.9,stagger:.045,ease:"power3.out",clearProps:"transform,opacity,visibility,willChange"},ROUTE_ENTRANCE_DELAY);}
      const adminTargets=Array.from(pathname.startsWith("/admin")?container.querySelectorAll<HTMLElement>("main table thead, main table tbody tr, main form, main article, main section > div"):container.querySelectorAll<HTMLElement>("main table, main [data-page-fade]")).slice(0,100);if(adminTargets.length){gsap.set(adminTargets,{autoAlpha:0,y:18});entrance.to(adminTargets,{autoAlpha:1,y:0,duration:.75,stagger:.035,ease:"power3.out",clearProps:"opacity,visibility,transform"},ROUTE_ENTRANCE_DELAY+.16);}
      if(!textElements.length&&!adminTargets.length)container.dataset.pageEntranceState="complete";};
    if(document.fonts.status==="loaded")setup();else void document.fonts.ready.then(setup);return()=>{entrance?.kill();};
  },{scope:root,dependencies:[isPageReady,pathname],revertOnUpdate:true});
  return <div ref={root} data-page-entrance data-page-entrance-state="waiting">{children}</div>;
}
