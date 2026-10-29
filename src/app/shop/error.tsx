"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLocale();
  useEffect(() => { document.title = locale === "el" ? "Προσωρινό πρόβλημα | Ruseè" : "Temporary issue | Ruseè"; }, [locale]);
  return <main className="section-shell grid min-h-[75svh] content-center pt-28">
    <p className="eyebrow">Ruseè · {locale === "el" ? "Συλλογή" : "Collection"}</p>
    <h1 className="mt-6 max-w-5xl font-display text-[clamp(4rem,9vw,9rem)] leading-[.88]">{locale === "el" ? "Η συλλογή χρειάζεται μια στιγμή." : "The collection needs a moment."}</h1>
    <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/60">{locale === "el" ? "Δεν ήταν δυνατή η φόρτωση των διαθέσιμων σχεδίων. Δοκιμάστε ξανά χωρίς να χαθούν οι επιλογές σας." : "We could not load the available designs. Try again without losing your selections."}</p>
    <div className="mt-10 flex flex-wrap gap-3"><button type="button" onClick={reset} className="border border-ink bg-ink px-7 py-4 text-sm uppercase tracking-[.15em] text-paper outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">{locale === "el" ? "Δοκιμή ξανά" : "Try again"}</button><Link href="/" className="border border-ink px-7 py-4 text-sm uppercase tracking-[.15em] outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">{locale === "el" ? "Αρχική" : "Home"}</Link></div>
  </main>;
}
