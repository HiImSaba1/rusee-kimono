"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageEntrance } from "@/components/animations/PageEntrance";
import { CookieBanner } from "@/components/legal/CookieBanner";

export function ApplicationFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  if (admin) return <PageEntrance><main className="min-h-svh">{children}</main></PageEntrance>;
  return <><Header /><PageEntrance><main data-public-site className="relative z-10 min-h-screen bg-paper pt-20">{children}</main></PageEntrance><Footer /><CookieBanner /></>;
}
