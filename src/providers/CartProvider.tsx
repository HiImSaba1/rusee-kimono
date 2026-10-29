"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/features/cart/types";
import { isOptimizedKimonoImage, kimonoImage } from "@/lib/media/kimono-images";

type CartContextValue = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  replaceItems: (items: CartItem[]) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const key = "rusee-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(key);
    } catch { /* Ignore malformed or unavailable local storage. */ }
    const restore = window.setTimeout(() => {
      try { if (saved) setItems((JSON.parse(saved) as CartItem[]).map(item => ({ ...item, image: isOptimizedKimonoImage(item.image) ? item.image : kimonoImage(item.variantId) }))); } catch { /* Ignore malformed saved carts. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId);
      if (!existing) return [...current, item];
      return current.map((entry) => entry.variantId === item.variantId ? { ...entry, quantity: Math.min(entry.quantity + item.quantity, item.available), available: item.available, priceMinor: item.priceMinor } : entry);
    });
    setOpen(true);
  }, []);
  const setQuantity = useCallback((variantId: number, quantity: number) => setItems((current) => current.map((item) => item.variantId === variantId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.available)) } : item)), []);
  const removeItem = useCallback((variantId: number) => setItems((current) => current.filter((item) => item.variantId !== variantId)), []);
  const replaceItems = useCallback((nextItems: CartItem[]) => setItems(nextItems), []);
  const clear = useCallback(() => { setItems([]); setOpen(false); }, []);
  const value = useMemo(() => ({ items, count: items.reduce((sum, item) => sum + item.quantity, 0), hydrated, open, setOpen, addItem, setQuantity, removeItem, replaceItems, clear }), [items, hydrated, open, addItem, setQuantity, removeItem, replaceItems, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
