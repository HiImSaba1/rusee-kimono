"use client";

import { ReactLenis } from "lenis/react";
import { PageTransitionProvider } from "@/providers/PageTransitionProvider";
import { CartProvider } from "@/providers/CartProvider";
import { CartDrawer } from "@/components/commerce/CartDrawer";

export function StorefrontProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ duration: 1.15, smoothWheel: true, syncTouch: false, wheelMultiplier: 0.9 }}>
      <PageTransitionProvider>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </PageTransitionProvider>
    </ReactLenis>
  );
}
