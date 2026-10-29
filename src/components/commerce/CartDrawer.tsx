"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { TransitionLink } from "@/components/ui/TransitionLink";
import type { CartItem } from "@/features/cart/types";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GR", { style: "currency", currency }).format(amount / 100);

export function CartDrawer() {
  const { items, count, open, setOpen, setQuantity, removeItem, replaceItems } = useCart();
  const total = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);
  const refreshedKey = useRef("");
  useEffect(() => {
    if (!open || !items.length) return;
    const key = items.map((item) => `${item.variantId}:${item.quantity}`).join("|");
    if (refreshedKey.current === key) return;
    const controller = new AbortController();
    let active = true;
    void Promise.all(items.map(async (item) => {
      const response = await fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: item.variantId, quantity: item.quantity }), signal: controller.signal });
      if (!response.ok) throw new Error("Unable to refresh cart item.");
      return response.json() as Promise<CartItem>;
    })).then((validated) => {
      if (!active) return;
      refreshedKey.current = key;
      replaceItems(validated);
    }).catch(() => { /* Checkout provides the actionable stock recovery state. */ });
    return () => { active = false; controller.abort(); };
  }, [items, open, replaceItems]);
  return <AnimatePresence>{open && <>
    <motion.button aria-label="Close bag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[210] bg-ink/35 backdrop-blur-sm" />
    <motion.aside role="dialog" aria-modal="true" aria-label="Shopping bag" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }} className="fixed inset-y-0 right-0 z-[211] flex w-full max-w-xl flex-col bg-paper p-[var(--gutter)] text-ink">
      <div className="flex items-center justify-between border-b border-ink/20 pb-5"><p className="font-display text-4xl">Your bag <span className="font-sans text-xs">({count})</span></p><button onClick={() => setOpen(false)} aria-label="Close bag"><X className="size-5" /></button></div>
      <div className="flex-1 overflow-y-auto py-5">{items.length === 0 ? <div className="grid h-full place-items-center text-center"><div><p className="font-display text-5xl">Your bag is waiting.</p><button onClick={() => setOpen(false)} className="mt-7 border-b border-ink pb-2 text-xs uppercase tracking-[0.15em]">Continue exploring</button></div></div> : <div className="space-y-6">{items.map((item) => <article key={item.variantId} data-sku={item.sku} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-ink/15 pb-6"><div className="relative aspect-[3/4] overflow-hidden"><Image src={item.image} alt="" fill sizes="112px" className="object-cover" /></div><div className="flex flex-col"><div className="flex justify-between gap-4"><div><p className="text-[.62rem] uppercase tracking-[.12em] text-ink/55">{item.productTitle}</p><h3 className="mt-1 font-display text-2xl">{item.designName}</h3><div className="mt-3 flex flex-wrap items-center gap-2"><span className="bg-ink px-2 py-1 font-mono text-[.62rem] uppercase tracking-[.1em] text-paper">{item.sizeLabel}</span><span className="text-xs text-ink/60">{item.colourName}</span></div><p className="mt-2 font-mono text-[.58rem] uppercase tracking-[.08em] text-ink/50">{item.sku}</p></div><p className="text-sm">{money(item.priceMinor * item.quantity, item.currency)}</p></div><div className="mt-auto flex items-end justify-between"><div className="flex items-center border border-ink/20"><button aria-label={`Decrease ${item.designName} quantity`} onClick={() => item.quantity === 1 ? removeItem(item.variantId) : setQuantity(item.variantId, item.quantity - 1)} className="p-2"><Minus className="size-3" /></button><span className="min-w-7 text-center text-xs">{item.quantity}</span><button aria-label={`Increase ${item.designName} quantity`} onClick={() => setQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.available} className="p-2 disabled:opacity-30"><Plus className="size-3" /></button></div><button onClick={() => removeItem(item.variantId)} className="text-[0.62rem] uppercase tracking-[0.14em] text-ink/50">Remove</button></div></div></article>)}</div>}</div>
      {items.length > 0 && <div className="border-t border-ink/20 pt-5"><div className="flex justify-between"><span className="text-xs uppercase tracking-[0.15em]">Subtotal</span><strong className="font-normal">{money(total, items[0]?.currency ?? "EUR")}</strong></div><p className="mt-3 text-xs text-ink/50">Shipping and final taxes are calculated at checkout.</p><TransitionLink data-button-reveal href="/cart" onClick={() => setOpen(false)} className="mt-6 w-full px-6 py-5 text-center text-xs uppercase tracking-[0.18em]">Review bag</TransitionLink></div>}
    </motion.aside>
  </>}</AnimatePresence>;
}
