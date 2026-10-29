"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { useCart } from "@/providers/CartProvider";

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-GR", { style: "currency", currency }).format(amount / 100);

export default function CartPage() {
  const { items, setQuantity, removeItem } = useCart();
  const total = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);

  return (
    <section data-cart-page className="section-shell min-h-[75svh] text-[1.05rem]">
      <div className="flex items-end justify-between border-b border-ink/20 pb-7">
        <div>
          <p className="eyebrow">Your selection</p>
          <h1 className="mt-5 font-display text-[clamp(4.5rem,10vw,10rem)] leading-[0.8] tracking-[-0.06em]">Bag</h1>
        </div>
        <span className="text-sm uppercase tracking-[0.15em]">{items.length} variations</span>
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-6xl">Nothing here yet.</p>
          <TransitionLink href="/shop" className="mt-8 inline-block border-b border-ink pb-2 text-sm uppercase tracking-[0.15em]">
            Explore the collection
          </TransitionLink>
        </div>
      ) : (
        <div className="grid gap-12 pt-8 lg:grid-cols-[1fr_22rem]">
          <div>
            {items.map((item) => (
              <article key={item.variantId} className="grid grid-cols-[8rem_1fr] gap-5 border-b border-ink/15 py-6 first:pt-0">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={item.image} alt="" fill sizes="128px" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.055]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[.12em] text-ink/55">{item.productTitle}</p>
                      <h2 className="mt-1 font-display text-4xl">{item.designName}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-2"><span className="bg-ink px-2 py-1 font-mono text-xs uppercase tracking-[.1em] text-paper">{item.sizeLabel}</span><span className="text-sm text-ink/70">{item.colourName}</span></div>
                      <p className="mt-2 font-mono text-xs uppercase tracking-[.08em] text-ink/70">{item.sku}</p>
                    </div>
                    <p className="text-lg">{money(item.priceMinor * item.quantity, item.currency)}</p>
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="flex border border-ink/20">
                      <button onClick={() => item.quantity === 1 ? removeItem(item.variantId) : setQuantity(item.variantId, item.quantity - 1)} className="p-2" aria-label="Decrease quantity">
                        <Minus className="size-3" />
                      </button>
                      <span className="min-w-8 py-2 text-center text-sm">{item.quantity}</span>
                      <button disabled={item.quantity >= item.available} onClick={() => setQuantity(item.variantId, item.quantity + 1)} className="p-2 disabled:opacity-30" aria-label="Increase quantity">
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.variantId)} className="text-xs uppercase tracking-[0.14em] text-ink/70">Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="h-fit bg-paper-deep p-6">
            <p className="eyebrow">Order summary</p>
            <div className="mt-6 flex justify-between border-b border-ink/20 pb-5 text-lg">
              <span>Subtotal</span>
              <strong className="font-normal">{money(total, items[0]?.currency ?? "EUR")}</strong>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-ink/70">Shipping and the final payable total will be validated on the server before payment.</p>
            <TransitionLink data-checkout-action href="/checkout" className="mt-7 block w-full bg-ink px-6 py-5 text-center text-sm uppercase tracking-[0.18em] text-paper">
              Proceed to checkout
            </TransitionLink>
          </aside>
        </div>
      )}
    </section>
  );
}
