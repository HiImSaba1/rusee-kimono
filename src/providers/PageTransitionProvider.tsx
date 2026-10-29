"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLenis } from "lenis/react";

type TransitionPhase = "idle" | "covering" | "covered" | "revealing";
type PageTransitionContextValue = {
  isPageReady: boolean;
  isTransitioning: () => boolean;
  navigateTo: (href: string) => void;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) throw new Error("usePageTransition must be used inside PageTransitionProvider.");
  return context;
}

function isOperationalRoute(pathname: string) {
  return ["/checkout", "/order", "/payment", "/admin"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [isPageReady, setIsPageReady] = useState(true);
  const target = useRef<string | null>(null);
  const targetPathname = useRef<string | null>(null);

  const reveal = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setIsPageReady(true);
    document.documentElement.dataset.routeReady = "true";
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase("revealing")));
  }, []);

  useEffect(() => {
    if (phase !== "covered" || targetPathname.current !== pathname) return;
    reveal();
  }, [pathname, phase, reveal]);

  const navigateTo = useCallback((href: string) => {
    const destination = new URL(href, window.location.href);
    const nextTarget = `${destination.pathname}${destination.search}${destination.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (phase !== "idle" || nextTarget === current) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      isOperationalRoute(pathname) ||
      isOperationalRoute(destination.pathname)
    ) {
      router.push(nextTarget);
      return;
    }

    target.current = nextTarget;
    targetPathname.current = destination.pathname;
    setIsPageReady(false);
    document.documentElement.dataset.routeReady = "false";
    lenis?.stop();
    setPhase("covering");
  }, [lenis, pathname, phase, router]);

  const handleCurtainTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;

    if (phase === "covering" && target.current) {
      const nextTarget = target.current;
      const samePathname = targetPathname.current === pathname;
      setPhase("covered");
      router.push(nextTarget, { scroll: false });
      if (samePathname) requestAnimationFrame(reveal);
      return;
    }

    if (phase === "revealing") {
      target.current = null;
      targetPathname.current = null;
      setPhase("idle");
      lenis?.resize();
      lenis?.start();
    }
  };

  useEffect(() => {
    const handleLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.closest("[data-admin-shell]") ||
        anchor.hasAttribute("data-no-page-transition") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) return;

      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.hash && destination.pathname === pathname && destination.search === window.location.search)
      ) return;

      event.preventDefault();
      navigateTo(`${destination.pathname}${destination.search}${destination.hash}`);
    };

    document.addEventListener("click", handleLink, true);
    return () => document.removeEventListener("click", handleLink, true);
  }, [navigateTo, pathname]);

  const curtainTransform = phase === "idle" || phase === "covering" ? "translateY(100%)" : phase === "revealing" ? "translateY(-100%)" : "translateY(0)";
  const renderedTransform = phase === "covering" || phase === "covered" ? "translateY(0)" : curtainTransform;

  return (
    <PageTransitionContext.Provider value={{ isPageReady, isTransitioning: () => phase !== "idle", navigateTo }}>
      {children}
      <div
        data-testid="page-transition"
        data-transition-state={phase}
        aria-hidden="true"
        onTransitionEnd={handleCurtainTransitionEnd}
        className="pointer-events-none fixed inset-0 z-[9500] h-svh w-screen bg-paper-deep motion-reduce:hidden"
        style={{
          transform: renderedTransform,
          visibility: phase === "idle" ? "hidden" : "visible",
          transition: phase === "idle" ? "none" : "transform 950ms cubic-bezier(0.77, 0, 0.18, 1)",
          willChange: "transform",
        }}
      />
    </PageTransitionContext.Provider>
  );
}
