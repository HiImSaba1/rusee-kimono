"use client";

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import type { CartItem } from "@/features/cart/types";
import { availableUnits, compatibleSizeIds, selectedVariant, type SellableVariant } from "@/features/catalogue/product-selection";
import { useLocale } from "@/i18n/LocaleProvider";
import { gsap } from "@/lib/animations/gsap";
import { useHydrated } from "@/hooks/useHydrated";

type Option = { id: number; slug?: string; name?: string; label?: string; code?: string; hex?: string | null };
type Copy = {
  study: string; kimono: string; colour: string; size: string; checking: string; add: string;
  unavailable: string; inStock: string; outOfStock: string; added: string; failed: string;
  sizeGuide: string; guideIntro: string; howToMeasure: string; measureBody: string;
  chooseFit: string; provisional: string; noCombination: string;
};

const copy: Record<"el" | "en", Copy> = {
  el: {
    study: "Μελέτη σχεδίου Ruseè", kimono: "Χαρακτηριστικό κιμονό", colour: "Χρώμα", size: "Μέγεθος",
    checking: "Έλεγχος…", add: "Προσθήκη στην τσάντα", unavailable: "Μη διαθέσιμο", inStock: "Σε απόθεμα",
    outOfStock: "Εξαντλημένο", added: "Προστέθηκε στην τσάντα σας.", failed: "Δεν ήταν δυνατή η προσθήκη αυτής της παραλλαγής.",
    sizeGuide: "Οδηγός μεγέθους", guideIntro: "Το κιμονό έχει χαλαρή γραμμή και φοριέται ανοιχτό. Επιλέξτε με βάση την επιθυμητή άνεση και επικάλυψη.",
    howToMeasure: "Πώς να μετρήσετε", measureBody: "Μετρήστε ένα παρόμοιο ένδυμα επίπεδο: στήθος από μασχάλη σε μασχάλη, μήκος από τον ώμο, άνοιγμα μανικιού και συνολικό τελείωμα.",
    chooseFit: "Αν βρίσκεστε ανάμεσα σε μεγέθη, επιλέξτε το μεγαλύτερο για περισσότερη επικάλυψη ή επικοινωνήστε με το studio.",
    provisional: "Οι αριθμητικές μετρήσεις ανά μέγεθος θα δημοσιευτούν μόνο μετά την επιβεβαίωση του τελικού δείγματος.",
    noCombination: "Ο συγκεκριμένος συνδυασμός χρώματος και μεγέθους δεν είναι διαθέσιμος.",
  },
  en: {
    study: "Ruseè design study", kimono: "Signature kimono", colour: "Colour", size: "Size",
    checking: "Checking…", add: "Add to bag", unavailable: "Unavailable", inStock: "In stock", outOfStock: "Out of stock",
    added: "Added to your bag.", failed: "Unable to add this variation.", sizeGuide: "Size guide",
    guideIntro: "The kimono has a relaxed silhouette and is designed to be worn open. Choose by preferred ease and coverage.",
    howToMeasure: "How to measure", measureBody: "Measure a similar garment laid flat: chest from underarm to underarm, length from shoulder, sleeve opening and total sweep.",
    chooseFit: "If you are between sizes, choose the larger size for more coverage or contact the studio for guidance.",
    provisional: "Numerical measurements by size will be published only after the final production sample is confirmed.",
    noCombination: "This colour and size combination is not available.",
  },
};

export function ProductPurchasePanel({ design, sizes, variants, onSizeChange }: {
  design: { id: number; name: string; story: string | null; fixedColourId?: number | null };
  colours: Option[]; sizes: Option[]; variants: SellableVariant[]; onSizeChange?: (sizeId: number) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const { locale } = useLocale();
  const text = copy[locale];
  const colourId = design.fixedColourId ?? variants[0]?.variant.colourId;
  const firstSize = sizes.find((size) => compatibleSizeIds(variants, design.id, colourId).has(size.id))?.id;
  const [sizeId, setSizeId] = useState<number | undefined>(firstSize);
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const hydrated = useHydrated();
  const cart = useCart();
  const compatibleSizes = useMemo(() => compatibleSizeIds(variants, design.id, colourId), [variants, design.id, colourId]);
  const selected = useMemo(() => selectedVariant(variants, design.id, colourId, sizeId), [variants, design.id, colourId, sizeId]);
  const units = availableUnits(selected);
  const available = units > 0;
  const price = selected ? new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-GR", { style: "currency", currency: selected.variant.currency }).format(selected.variant.priceMinor / 100) : "—";

  useGSAP(() => {
    if (!hydrated || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from("[data-product-reveal]", { yPercent: 42, clipPath: "inset(0 0 100% 0)", autoAlpha: 0, duration: 1.05, stagger: .075, ease: "power4.out", clearProps: "clipPath" });
  }, { scope: root, dependencies: [hydrated], revertOnUpdate: true });

  async function add() {
    if (!selected || !available || adding) return;
    setAdding(true);
    setMessage("");
    try {
      const response = await fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: selected.variant.id, quantity: 1 }) });
      const payload = await response.json() as CartItem | { message?: string };
      if (!response.ok) throw new Error("message" in payload && payload.message ? payload.message : text.failed);
      cart.addItem(payload as CartItem);
      setMessage(text.added);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.failed);
    } finally {
      setAdding(false);
    }
  }

  return <aside ref={root} className="flex h-full self-stretch flex-col justify-center bg-paper-deep px-[clamp(.75rem,2vw,1.75rem)] py-[clamp(1.5rem,4vw,3.5rem)]">
    <p data-product-reveal className="font-mono text-base uppercase tracking-[.12em] text-ink/70">{text.study}</p>
    <h1 data-product-reveal className="mt-5 overflow-visible py-[.14em] font-display text-[clamp(4.5rem,8vw,8rem)] font-normal leading-[.9] tracking-[-.06em] text-ink">{design.name}</h1>
    <p data-product-reveal className="mt-6 max-w-lg text-lg leading-relaxed text-ink/65">{design.story}</p>
    <div data-product-reveal className="mt-8 flex items-center justify-between border-y border-ink/15 py-5"><span className="text-sm uppercase tracking-[.12em]">{text.kimono}</span><span className="font-display text-3xl">{price}</span></div>
    <fieldset data-product-reveal className="mt-8"><legend className="mb-4 font-mono text-sm uppercase tracking-[.13em]">{text.size}</legend><div className="grid grid-cols-[repeat(auto-fit,minmax(4rem,1fr))] gap-2">{sizes.map((item) => { const compatible = compatibleSizes.has(item.id); return <button data-product-size type="button" key={item.id} disabled={!compatible} aria-pressed={sizeId === item.id} aria-label={`${text.size} ${item.label ?? item.code}`} onClick={() => { setSizeId(item.id); onSizeChange?.(item.id); setMessage(""); }} className={`border py-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 ${sizeId === item.id ? "border-ink bg-ink text-paper" : "border-ink/20"}`}>{item.code}</button>; })}</div></fieldset>
    <details className="group mt-5 border-y border-ink/15 py-4"><summary onKeyDown={(event) => { if (event.key !== "Enter" && event.key !== " ") return; event.preventDefault(); const details = event.currentTarget.closest("details"); if (details) details.open = !details.open; }} className="flex cursor-pointer list-none items-center justify-between font-mono text-sm uppercase tracking-[.12em] outline-none focus-visible:ring-2 focus-visible:ring-ink"><span>{text.sizeGuide}</span><ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" /></summary><div className="mt-5 space-y-4 text-sm leading-relaxed text-ink/65"><p>{text.guideIntro}</p><h2 className="font-semibold text-ink">{text.howToMeasure}</h2><p>{text.measureBody}</p><p>{text.chooseFit}</p><p className="border-l border-ink/30 pl-3 text-xs">{text.provisional}</p></div></details>
    <button data-product-add data-testid="add-selected-variant" type="button" disabled={!available || adding} onClick={add} className="mt-8 flex w-full items-center justify-center gap-3 border border-ink bg-ink px-6 py-5 text-sm uppercase tracking-[.16em] text-paper outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag aria-hidden="true" className="size-4" />{adding ? text.checking : available ? text.add : text.unavailable}</button>
    <div className="mt-4 flex justify-between font-mono text-sm uppercase tracking-[.1em] text-ink/70"><span data-testid="selected-sku">{selected?.variant.sku ?? "—"}</span><span>{available ? text.inStock : text.outOfStock}</span></div>
    {!selected && <p className="mt-3 text-sm text-ink/60">{text.noCombination}</p>}
    <div aria-live="polite" aria-atomic="true" role="status"><AnimatePresence>{message && <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 border-l border-ink pl-4 text-sm text-ink/65">{message}</motion.p>}</AnimatePresence></div>
  </aside>;
}
