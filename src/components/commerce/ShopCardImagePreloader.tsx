"use client";

import { useEffect } from "react";

export function ShopCardImagePreloader({ sources }: { sources: string[] }) {
  useEffect(() => {
    const preload = () => {
      for (const source of sources) {
        const image = new window.Image();
        image.decoding = "async";
        image.src = source;
      }
    };
    const browser = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (browser.requestIdleCallback) {
      const id = browser.requestIdleCallback(preload, { timeout: 1200 });
      return () => browser.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(preload, 250);
    return () => window.clearTimeout(id);
  }, [sources]);
  return null;
}
