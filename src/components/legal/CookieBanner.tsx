"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const CONSENT_KEY = "rusee_cookie_consent_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(CONSENT_KEY)) {
      const timer = window.setTimeout(() => setVisible(true), 1400);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function decide(value: "accepted" | "essential-only") {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, decidedAt: new Date().toISOString() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-[9500] ml-auto max-w-lg border border-ink/20 bg-paper p-6 shadow-2xl md:inset-x-auto md:bottom-6 md:right-6 md:p-8">
      <p className="eyebrow text-ink/45">Cookie preferences</p>
      <h2 className="mt-4 overflow-visible py-[.08em] font-display text-4xl leading-none">A considered experience.</h2>
      <p className="mt-4 text-sm leading-relaxed text-ink/65">
        Essential storage keeps the site secure and remembers your choice. Optional analytics will only be enabled after consent.
      </p>
      <Link href="/cookies" className="mt-4 inline-block border-b border-ink/35 pb-1 text-sm">Read the cookies policy</Link>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button data-button-reveal onClick={() => decide("accepted")} className="relative overflow-hidden border border-ink bg-ink px-5 py-4 text-sm uppercase tracking-[.12em] text-paper">
          <span className="relative inline-flex items-center gap-2">Accept all <ArrowRight className="size-4" /></span>
        </button>
        <button data-button-reveal onClick={() => decide("essential-only")} className="border border-ink/30 px-5 py-4 text-sm uppercase tracking-[.12em]">Essential only</button>
      </div>
    </aside>
  );
}
