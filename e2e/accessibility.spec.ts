import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/shop", "/contact"];

for (const route of publicRoutes) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const material = results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    expect(material, material.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  });
}

test("keyboard navigation and locale switching remain operable", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  const language = page.getByRole("button", { name: /English|Αγγλικά/i });
  await language.focus();
  await expect(language).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  const menu = page.locator('button[aria-controls="site-menu"]');
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#site-menu").getByRole("navigation")).toBeVisible();
});

test("mobile layout has no document-width overflow", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only assertion");
  await page.goto("/shop");
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  // Mobile engines can round opposing sub-pixel gutters in different
  // directions. Four CSS pixels permits that rounding, not visible overflow.
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 4);
});
