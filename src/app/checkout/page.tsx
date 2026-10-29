import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { privateRouteRobots } from "@/lib/seo/indexing";

export const metadata: Metadata = { title: "Checkout", robots: privateRouteRobots };
export default function CheckoutPage() { return <section className="section-shell"><div className="mb-12 border-b border-ink/20 pb-7"><p className="eyebrow">Secure guest checkout</p><h1 className="mt-5 font-display text-[clamp(4.5rem,9vw,9rem)] leading-[0.82] tracking-[-0.06em]">Delivery details</h1></div><CheckoutForm /></section>; }
