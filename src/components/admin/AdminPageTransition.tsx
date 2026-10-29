"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { gsap } from "@/lib/animations/gsap";
import { useLocale } from "@/i18n/LocaleProvider";

const PANEL_COUNT = 6;
const COVER_DURATION = 0.32;
const REVEAL_DURATION = 0.38;
const PANEL_STAGGER = 0.035;

const routeLabels: Record<string, { el: string; en: string }> = {
  overview: { el: "Επισκόπηση", en: "Overview" },
  guide: { el: "Οδηγός χρήσης", en: "Admin guide" },
  orders: { el: "Παραγγελίες", en: "Orders" },
  "order-operations": { el: "Ροή παραγγελιών", en: "Order workflow" },
  returns: { el: "Επιστροφές", en: "Returns" },
  payments: { el: "Πληρωμές", en: "Payments" },
  reconciliation: { el: "Συμφωνία", en: "Reconciliation" },
  products: { el: "Προϊόντα", en: "Products" },
  media: { el: "Εικόνες", en: "Images" },
  "catalogue-readiness": { el: "Ετοιμότητα", en: "Readiness" },
  inventory: { el: "Απόθεμα", en: "Stock" },
  enquiries: { el: "Μηνύματα", en: "Enquiries" },
  email: { el: "Email", en: "Email" },
  "email-templates": { el: "Πρότυπα email", en: "Email templates" },
  "email-template-history": { el: "Ιστορικό προτύπων", en: "Template history" },
  privacy: { el: "Ιδιωτικότητα", en: "Privacy" },
  information: { el: "Πληροφορίες", en: "Information" },
  health: { el: "Κατάσταση", en: "System status" },
  activity: { el: "Ιστορικό", en: "Activity" },
  team: { el: "Ομάδα", en: "Team" },
};

function getRouteLabel(pathname: string, locale: "el" | "en") {
  const segment = pathname.split("/").filter(Boolean)[1] ?? "overview";
  return (routeLabels[segment] ?? routeLabels.overview)[locale];
}

export function AdminPageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const panels = useRef<Array<HTMLDivElement | null>>([]);
  const overlay = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLHeadingElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const recoveryTimer = useRef<number | null>(null);
  const transitioning = useRef(false);
  const pendingRoute = useRef<string | null>(null);
  const search = searchParams.toString();
  const routeKey = `${pathname}${search ? `?${search}` : ""}`;

  const finishTransition = useCallback(() => {
    if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
    recoveryTimer.current = null;
    transitioning.current = false;
    pendingRoute.current = null;
    overlay.current?.setAttribute("data-transition-state", "idle");
  }, []);

  const reveal = useCallback(() => {
    timeline.current?.kill();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    overlay.current?.setAttribute("data-transition-state", "revealing");
    gsap.set(panels.current, { scaleY: 1 });
    timeline.current = gsap.timeline({ onComplete: finishTransition })
      .to(caption.current, { yPercent: -115, autoAlpha: 0, duration: 0.2, ease: "power2.in" })
      .to(panels.current, {
        scaleY: 0,
        duration: REVEAL_DURATION,
        stagger: PANEL_STAGGER,
        ease: "power3.inOut",
      }, "-=0.12");
  }, [finishTransition]);

  useLayoutEffect(() => {
    gsap.set(panels.current, { scaleY: 0 });
    gsap.set(caption.current, { yPercent: 115, autoAlpha: 0 });
    overlay.current?.setAttribute("data-transition-state", "idle");
  }, []);

  useEffect(() => {
    if (!transitioning.current || pendingRoute.current !== routeKey) return;
    reveal();
  }, [reveal, routeKey]);

  const navigate = useCallback((destination: URL) => {
    const href = `${destination.pathname}${destination.search}${destination.hash}`;
    const destinationKey = `${destination.pathname}${destination.search}`;
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (transitioning.current || href === currentHref) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }

    transitioning.current = true;
    pendingRoute.current = destinationKey;
    overlay.current?.setAttribute("data-transition-state", "covering");
    if (label.current) label.current.textContent = getRouteLabel(destination.pathname, locale);
    timeline.current?.kill();
    gsap.set(panels.current, { scaleY: 0 });
    gsap.set(caption.current, { yPercent: 115, autoAlpha: 0 });

    timeline.current = gsap.timeline({
      onComplete: () => router.push(href, { scroll: false }),
    }).to(panels.current, {
      scaleY: 1,
      duration: COVER_DURATION,
      stagger: PANEL_STAGGER,
      ease: "power3.inOut",
    }).to(caption.current, { yPercent: 0, autoAlpha: 1, duration: 0.26, ease: "power3.out" }, "-=0.18");

    recoveryTimer.current = window.setTimeout(reveal, 5000);
  }, [locale, reveal, router]);

  useEffect(() => {
    const handleAdminLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("[data-admin-shell] a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.hasAttribute("data-no-admin-transition")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || !destination.pathname.startsWith("/admin")) return;
      if (destination.hash && destination.pathname === pathname && destination.search === window.location.search) return;
      event.preventDefault();
      navigate(destination);
    };

    document.addEventListener("click", handleAdminLink, true);
    return () => document.removeEventListener("click", handleAdminLink, true);
  }, [navigate, pathname]);

  useEffect(() => () => {
    timeline.current?.kill();
    if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
  }, []);

  return <div
    ref={overlay}
    data-testid="admin-page-transition"
    data-transition-state="idle"
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-[9500] flex h-svh w-screen"
  >
    {Array.from({ length: PANEL_COUNT }, (_, index) => <div
      key={index}
      ref={node => { panels.current[index] = node; }}
      className={`h-full flex-1 scale-y-0 bg-ink ${index % 2 === 0 ? "origin-top" : "origin-bottom"}`}
    />)}
    <div className="absolute inset-0 grid place-items-center overflow-hidden px-[var(--gutter)]">
      <div ref={caption} className="invisible overflow-hidden py-2">
        <p className="mb-3 text-center font-mono text-[clamp(.7rem,.8vw,.82rem)] uppercase tracking-[.22em] text-paper/65">RUSEÈ / ADMIN</p>
        <h2 suppressHydrationWarning ref={label} className="font-display text-[clamp(2.75rem,7vw,7rem)] font-light uppercase leading-[.9] tracking-[-.045em] text-paper" />
      </div>
    </div>
  </div>;
}
