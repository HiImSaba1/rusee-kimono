import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/information", "/shipping", "/payment-methods", "/care-guide"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("rusee_cookie_consent_v1", JSON.stringify({ value: "essential-only", decidedAt: "2026-01-01T00:00:00.000Z" })));
});

test("customer information routes are accessible and connected", async ({ page }) => {
  test.setTimeout(80_000);
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
    await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(1400);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious"), route).toEqual([]);
  }

  await page.goto("/information");
  const destinations = ["/shipping", "/payment-methods", "/returns", "/care-guide", "/cookies", "/privacy-policy"];
  for (const href of destinations) {
    const link = page.locator(`main a[href="${href}"]`);
    await link.scrollIntoViewIfNeeded();
    await expect(link, href).toBeVisible();
  }
  const firstCard = page.locator(`main a[href="${destinations[0]}"]`);
  await firstCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await firstCard.focus();
  await expect(firstCard).toBeFocused();
});
