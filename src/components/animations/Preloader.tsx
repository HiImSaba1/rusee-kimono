"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";

function announceComplete() {
  document.documentElement.dataset.loaderComplete = "true";
  window.dispatchEvent(new CustomEvent("rusee:loader-complete"));
}

export function Preloader({ enabled = true }: { enabled?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const progressLine = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      announceComplete();
      return;
    }
    document.documentElement.dataset.loaderComplete = "false";
    const safetyTimer = window.setTimeout(() => {
      document.documentElement.style.overflow = "";
      announceComplete();
      setVisible(false);
    }, 2500);
    return () => window.clearTimeout(safetyTimer);
  }, [enabled]);

  useGSAP(() => {
    if (!enabled || !root.current || !counter.current || !progressLine.current) return;
    const previousOverflow = document.documentElement.style.overflow;
    const finish = () => {
      document.documentElement.style.overflow = previousOverflow;
      announceComplete();
      setVisible(false);
    };
    document.documentElement.style.overflow = "hidden";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(root.current, { display: "none" });
      const reducedTimer = window.setTimeout(finish, 0);
      return () => window.clearTimeout(reducedTimer);
    }

    const progress = { value: 0 };
    gsap.set(progressLine.current, { scaleX: 0, transformOrigin: "left center" });
    const timeline = gsap.timeline({ delay: 0.05, onComplete: finish });
    timeline
      .to(progress, {
        value: 100,
        duration: 0.85,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counter.current) counter.current.textContent = String(Math.round(progress.value)).padStart(3, "0");
        },
      })
      .to(progressLine.current, { scaleX: 1, duration: 0.85, ease: "power2.inOut" }, 0)
      .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 0.55, ease: "power4.inOut" }, "+=0.08");

    return () => {
      timeline.kill();
      document.documentElement.style.overflow = previousOverflow;
    };
  }, { scope: root, dependencies: [enabled] });

  if (!visible) return null;

  return <div ref={root} data-testid="site-preloader" className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-ink text-paper [clip-path:inset(0_0_0%_0)]" aria-hidden="true">
    <div className="w-[min(30rem,72vw)]">
      <div className="flex items-end justify-between gap-8 font-mono text-[0.65rem] uppercase tracking-[0.18em]">
        <span>Ruseè</span>
        <span><span ref={counter}>000</span>%</span>
      </div>
      <div className="mt-4 h-px overflow-hidden bg-paper/25">
        <div ref={progressLine} data-testid="preloader-progress-line" className="h-full w-full bg-paper" />
      </div>
    </div>
  </div>;
}
