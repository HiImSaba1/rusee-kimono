import { expect, test } from "@playwright/test";

for (const pathname of ["/cart", "/checkout", "/admin"]) {
  test(`${pathname} emits a direct noindex boundary`, async ({ page }) => {
    await page.goto(pathname);
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/i);
    await expect(robots).toHaveAttribute("content", /nofollow/i);
  });
}
