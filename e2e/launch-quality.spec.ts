import AxeBuilder from "@axe-core/playwright";
import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const publicRoutes = ["/", "/shop", "/about", "/faq", "/contact", "/cart", "/checkout", "/privacy-policy", "/cookies", "/terms", "/returns"];
const cartItem = { variantId: 900000001, sku: "E2E-A11Y-01", productTitle: "Ruseè accessibility fixture", designName: "Browser contract", colourName: "Ink", sizeLabel: "M", priceMinor: 12500, currency: "EUR", image: "/kimono_images/kimono_design_artemis_main.png", quantity: 1, available: 2 };

async function installSafeState(page: Page) {
  await page.addInitScript((item) => {
    localStorage.setItem("rusee-cart-v1", JSON.stringify([item]));
    localStorage.setItem("rusee_cookie_consent_v1", JSON.stringify({ value: "essential-only", decidedAt: "2026-01-01T00:00:00.000Z" }));
  }, cartItem);
}

async function assertRouteQuality(page: Page, route: string) {
  const startedAt = Date.now();
  await page.goto(route);
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  // Audit the settled interface, not intermediate entrance-animation opacity.
  await page.waitForTimeout(1400);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const material = results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
  expect(material, `${route}\n${material.map((violation) => `${violation.id}: ${violation.help}`).join("\n")}`).toEqual([]);
  expect(Date.now() - startedAt, `${route} did not become audit-ready within the local launch budget`).toBeLessThan(12_000);
}

test.beforeEach(async ({ page }) => installSafeState(page));

test("launch routes remain accessible, hydrated and commerce-safe", async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of publicRoutes) await assertRouteQuality(page, route);
  await page.goto("/shop");
  const productHref = await page.locator('a[href^="/shop/"]').first().getAttribute("href");
  expect(productHref).toBeTruthy();
  await assertRouteQuality(page, productHref!);
});

test("primary storefront controls preserve keyboard focus and operation", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  const menu = page.locator('button[aria-controls="site-menu"]');
  await menu.focus();
  await expect(menu).toBeFocused();
  await menu.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await menu.press("Escape");
  const language = page.getByRole("button", { name: /English|Αγγλικά/i });
  await language.focus();
  await expect(language).toBeFocused();
  const product = page.locator('a[href^="/shop/"]').first();
  await product.focus();
  await expect(product).toBeFocused();
});

test("mobile and reduced-motion launch surfaces stay visible and within the viewport", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile reduced-motion contract");
  for (const route of ["/", "/shop", "/cart", "/checkout", "/admin"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
    const evidence = await page.evaluate(() => ({
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(evidence.reduced).toBe(true);
    expect(evidence.scrollWidth, `${route} has visible horizontal overflow`).toBeLessThanOrEqual(evidence.clientWidth + 4);
    await expect(page.getByTestId("site-preloader")).toBeHidden({ timeout: 4000 });
  }
});

test("authenticated admin overview has no serious accessibility violations", async ({ page }) => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the admin accessibility contract.");
  const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill("__rusee_e2e_admin__");
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await page.waitForTimeout(1400);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});
