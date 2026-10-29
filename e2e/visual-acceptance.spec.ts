import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the visual acceptance contract.");

const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);
const publicRoutes = [
  { path: "/", name: "home" },
  { path: "/shop", name: "shop" },
  { path: "/shop/nocturne", name: "product-nocturne" },
  { path: "/information", name: "information" },
  { path: "/checkout", name: "checkout" },
] as const;
const locales = ["el", "en"] as const;

async function waitForSettledRoute(page: Page, locale: (typeof locales)[number]) {
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await expect(page.getByTestId("site-preloader")).toBeHidden({ timeout: 4000 });
  await page.waitForTimeout(350);
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll, "The captured route has visible horizontal overflow.").toBeLessThanOrEqual(width.client + 4);
}

async function selectLocale(page: Page, locale: (typeof locales)[number], redirect: string) {
  await page.goto(`/api/locale?locale=${locale}&redirect=${encodeURIComponent(redirect)}`);
  await waitForSettledRoute(page, locale);
}

async function captureVisual(page: Page, file: string) {
  const metrics = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
  }));
  if (metrics.height * metrics.pixelRatio <= 30_000) {
    await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
    console.log(`VISUAL_CAPTURE ${file}`);
    return;
  }

  const extension = file.lastIndexOf(".png");
  const base = extension >= 0 ? file.slice(0, extension) : file;
  const positions = [
    { name: "top", y: 0 },
    { name: "middle", y: Math.max(0, Math.round((metrics.height - metrics.viewport) / 2)) },
    { name: "bottom", y: Math.max(0, metrics.height - metrics.viewport) },
  ];
  for (const position of positions) {
    await page.evaluate(y => window.scrollTo(0, y), position.y);
    await page.waitForTimeout(100);
    const segment = `${base}-${position.name}.png`;
    await page.screenshot({ path: segment, fullPage: false, animations: "disabled" });
    console.log(`VISUAL_CAPTURE ${segment}`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test("capture bilingual storefront and owner visual acceptance pack", async ({ page }, testInfo) => {
  const profile = testInfo.project.name.replace("visual-", "");
  await page.addInitScript(() => {
    localStorage.setItem("rusee_cookie_consent_v1", JSON.stringify({ value: "essential-only", decidedAt: "2026-01-01T00:00:00.000Z" }));
  });

  for (const locale of locales) {
    for (const route of publicRoutes) {
      await selectLocale(page, locale, route.path);
      const file = `artifacts/visual-acceptance/${profile}-${locale}-${route.name}.png`;
      await captureVisual(page, file);
    }

    await page.goto(`/api/locale?locale=${locale}&redirect=${encodeURIComponent("/admin")}`);
    if (page.url().endsWith("/admin")) {
      await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
      await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
      await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
    }
    await expect(page).toHaveURL(/\/admin\/overview$/);
    await waitForSettledRoute(page, locale);
    const file = `artifacts/visual-acceptance/${profile}-${locale}-admin-overview.png`;
    await captureVisual(page, file);
  }
});
