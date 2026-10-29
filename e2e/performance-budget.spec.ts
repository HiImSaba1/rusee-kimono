import { expect, test } from "@playwright/test";

const routes = ["/", "/shop", "/shop/nocturne", "/checkout", "/admin"] as const;

type VitalState = { cls: number; lcp: number };

type PerformanceEvidence = {
  route: string;
  profile: string;
  ttfbMs: number;
  domContentLoadedMs: number;
  loadMs: number;
  fcpMs: number;
  lcpMs: number;
  cls: number;
  totalKb: number;
  scriptKb: number;
  imageKb: number;
  largestResourceKb: number;
};

for (const route of routes) {
  test(`${route} stays within the local production performance budget`, async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      const state: VitalState = { cls: 0, lcp: 0 };
      (window as unknown as { __ruseeVitals: VitalState }).__ruseeVitals = state;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!shift.hadRecentInput) state.cls += shift.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        state.lcp = entries.at(-1)?.startTime ?? state.lcp;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      localStorage.setItem("rusee_cookie_consent_v1", JSON.stringify({ value: "essential-only", decidedAt: "2026-01-01T00:00:00.000Z" }));
    });

    await page.goto(route, { waitUntil: "load" });
    await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
    await expect(page.getByTestId("site-preloader")).toBeHidden({ timeout: 4000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(250);

    const evidence = await page.evaluate(({ route, profile }): PerformanceEvidence => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const bytes = (entry: PerformanceResourceTiming) => entry.transferSize || entry.encodedBodySize || 0;
      const sum = (entries: PerformanceResourceTiming[]) => entries.reduce((total, entry) => total + bytes(entry), 0);
      const scripts = resources.filter((entry) => entry.initiatorType === "script" || /\.(?:m?js)(?:\?|$)/i.test(entry.name));
      const images = resources.filter((entry) => entry.initiatorType === "img" || /\.(?:avif|gif|jpe?g|png|webp)(?:\?|$)/i.test(entry.name));
      const fcp = performance.getEntriesByName("first-contentful-paint")[0];
      const vitals = (window as unknown as { __ruseeVitals?: VitalState }).__ruseeVitals ?? { cls: 0, lcp: 0 };
      return {
        route,
        profile,
        ttfbMs: Math.round(navigation.responseStart),
        domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
        loadMs: Math.round(navigation.loadEventEnd),
        fcpMs: Math.round(fcp?.startTime ?? 0),
        lcpMs: Math.round(vitals.lcp),
        cls: Number(vitals.cls.toFixed(4)),
        totalKb: Math.round(sum(resources) / 1024),
        scriptKb: Math.round(sum(scripts) / 1024),
        imageKb: Math.round(sum(images) / 1024),
        largestResourceKb: Math.round(Math.max(0, ...resources.map(bytes)) / 1024),
      };
    }, { route, profile: testInfo.project.name });

    console.log(`PERFORMANCE_EVIDENCE ${JSON.stringify(evidence)}`);

    const mobile = testInfo.project.name === "performance-mobile";
    expect(evidence.ttfbMs, `${route} TTFB exceeded the local production budget`).toBeLessThanOrEqual(1_500);
    expect(evidence.loadMs, `${route} load event exceeded the local production budget`).toBeLessThanOrEqual(mobile ? 7_000 : 6_000);
    expect(evidence.lcpMs, `${route} LCP exceeded the local production budget`).toBeGreaterThan(0);
    expect(evidence.lcpMs, `${route} LCP exceeded the local production budget`).toBeLessThanOrEqual(mobile ? 5_500 : 4_500);
    expect(evidence.cls, `${route} cumulative layout shift exceeded 0.1`).toBeLessThanOrEqual(0.1);
    expect(evidence.totalKb, `${route} transferred more than 12 MB`).toBeLessThanOrEqual(12_288);
    expect(evidence.scriptKb, `${route} transferred more than 2.5 MB of JavaScript`).toBeLessThanOrEqual(2_560);
    expect(evidence.imageKb, `${route} transferred more than 8 MB of images`).toBeLessThanOrEqual(8_192);
    expect(evidence.largestResourceKb, `${route} contains a transferred resource larger than 2 MB`).toBeLessThanOrEqual(2_048);
  });
}
