"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import type { CartItem } from "@/features/cart/types";
type Option = {
  id: number;
  slug?: string;
  name?: string;
  label?: string;
  code?: string;
  hex?: string | null;
};
type Variant = {
  variant: {
    id: number;
    designId: number;
    colourId: number;
    sizeId: number;
    sku: string;
    priceMinor: number;
    currency: string;
  };
  stock: { onHand: number; reserved: number } | null;
};
type ProductImage = {
  id: number;
  designId: number | null;
  colourId: number | null;
  src: string;
  alt: string;
};
export function ProductConfigurator({
  designs,
  colours,
  sizes,
  variants,
  images,
  initialDesignSlug,
  initialColourSlug,
}: {
  designs: Option[];
  colours: Option[];
  sizes: Option[];
  variants: Variant[];
  images: ProductImage[];
  initialDesignSlug?: string;
  initialColourSlug?: string;
}) {
  const initialDesign =
    designs.find((item) => item.slug === initialDesignSlug)?.id ??
    designs[0]?.id;
  const initialColour =
    colours.find((item) => item.slug === initialColourSlug)?.id ??
    colours[0]?.id;
  const [designId, setDesignId] = useState(initialDesign);
  const [colourId, setColourId] = useState(initialColour);
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const cart = useCart();
  const selected = useMemo(
    () =>
      variants.find(
        ({ variant }) =>
          variant.designId === designId &&
          variant.colourId === colourId &&
          variant.sizeId === sizeId,
      ),
    [variants, designId, colourId, sizeId],
  );
  const image = useMemo(() => {
    const exact = images.find((item) => item.designId === designId && item.colourId === colourId);
    if (exact) return exact;
    const designImages = images.filter((item) => item.designId === designId);
    const colourIndex = Math.max(0, colours.findIndex((item) => item.id === colourId));
    return designImages[colourIndex % designImages.length] ?? images.find((item) => item.colourId === colourId) ?? images[0];
  }, [images, colours, designId, colourId]);
  const available = selected
    ? selected.stock
      ? selected.stock.onHand - selected.stock.reserved > 0
      : false
    : false;
  const price = selected
    ? new Intl.NumberFormat("en-GR", {
        style: "currency",
        currency: selected.variant.currency,
      }).format(selected.variant.priceMinor / 100)
    : "—";
  const addToBag = async () => {
    if (!selected || !available || adding) return;
    setAdding(true);
    setMessage("");
    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.variant.id, quantity: 1 }),
      });
      const payload = (await response.json()) as
        | CartItem
        | { message?: string };
      if (!response.ok)
        throw new Error(
          "message" in payload
            ? payload.message
            : "Unable to add this variation.",
        );
      cart.addItem(payload as CartItem);
      setMessage("Added to your bag.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to add this variation.",
      );
    } finally {
      setAdding(false);
    }
  };
  return (
    <section className="grid min-h-[calc(100svh-5rem)] lg:grid-cols-[1.15fr_.85fr]">
      <div className="relative min-h-[62svh] overflow-hidden bg-paper-deep">
        <AnimatePresence mode="popLayout" initial={false}>
          {image && (
            <motion.div
              key={`${image.id}-${designId}-${colourId}`}
              initial={{ clipPath: "inset(0 50% 0 50%)", scale: 1.06 }}
              animate={{ clipPath: "inset(0 0% 0 0%)", scale: 1 }}
              exit={{ clipPath: "inset(0 50% 0 50%)", scale: 1.03 }}
              transition={{ duration: 1.05, ease: [0.87, 0, 0.13, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes="(min-width:1024px) 58vw,100vw"
                className="object-cover image-zoom"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center bg-paper-deep p-[var(--gutter)] py-16">
        <div className="w-full border-t border-ink/20 pt-7">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Signature collection</p>
              <h1 className="mt-3 font-display text-[clamp(4rem,7vw,7.5rem)] leading-[.88] tracking-[-.055em]">
                The Signature
                <br />
                Kimono
              </h1>
            </div>
            <p className="text-xl">{price}</p>
          </div>
          <p className="mt-7 max-w-xl leading-relaxed text-ink/65">
            A fluid, unstructured layer designed to move between quiet mornings,
            summer streets and evenings away.
          </p>
          <fieldset className="mt-9">
            <legend className="eyebrow mb-4">Design</legend>
            <div className="flex flex-wrap gap-2">
              {designs.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDesignId(item.id)}
                  className={`border px-4 py-3 text-xs uppercase tracking-[.12em] ${designId === item.id ? "border-ink bg-ink text-paper" : "border-ink/25"}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-7">
            <legend className="eyebrow mb-4">Colour</legend>
            <div className="flex flex-wrap gap-4">
              {colours.map((item) => (
                <button
                  title={item.name}
                  aria-label={item.name}
                  type="button"
                  key={item.id}
                  onClick={() => setColourId(item.id)}
                  className={`grid size-9 place-items-center rounded-full border ${colourId === item.id ? "border-ink" : "border-transparent"}`}
                >
                  <span
                    className="size-6 rounded-full border border-ink/20"
                    style={{ background: item.hex ?? "transparent" }}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-7">
            <legend className="eyebrow mb-4">Size</legend>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSizeId(item.id)}
                  className={`border py-3 text-xs ${sizeId === item.id ? "border-ink" : "border-ink/20"}`}
                >
                  {item.code}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            disabled={!available || adding}
            onClick={addToBag}
            className="mt-8 flex w-full items-center justify-center gap-3 bg-ink px-6 py-5 text-xs uppercase tracking-[.18em] text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingBag className="size-4" />
            {adding ? "Checking…" : available ? "Add to bag" : "Unavailable"}
          </button>
          <div className="mt-3 flex justify-between text-[.65rem] uppercase tracking-[.13em] text-ink/50">
            <span>{selected?.variant.sku}</span>
            <span>{available ? "In stock" : "Out of stock"}</span>
          </div>
          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 border-l border-ink pl-4 text-sm text-ink/65"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
