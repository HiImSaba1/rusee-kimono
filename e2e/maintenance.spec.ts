import { expect, test } from "@playwright/test";

test("maintenance mode returns a retryable storefront holding page", async ({ page }) => {
  const response = await page.goto("/shop");
  expect(response?.status()).toBe(503);
  await expect(page.getByRole("heading", { name: /Επιστρέφουμε σύντομα|back shortly/i })).toBeVisible();
  await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/i);
});

test("maintenance mode preserves operational and in-flight routes", async ({ request }) => {
  for (const path of ["/api/health/live", "/admin", "/order/maintenance-contract", "/payment/maintenance-contract"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), `${path} must not be replaced by maintenance`).not.toBe(503);
  }
});
