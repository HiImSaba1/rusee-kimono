import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("rusee_cookie_consent_v1", JSON.stringify({ value: "essential-only", decidedAt: "2026-01-01T00:00:00.000Z" }));
  });
});

test("the final product composition preserves the authoritative SKU and adds that variant", async ({ page }) => {
  await page.goto("/shop");
  const href = await page.locator('a[href^="/shop/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  const productUrl = new URL(href!, "http://127.0.0.1:3107");

  await page.goto(`${productUrl.pathname}${productUrl.search}`);
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  const selectedSkuElement = page.getByTestId("selected-sku").filter({ visible: true }).first();
  const selectedSku = await selectedSkuElement.innerText();
  expect(selectedSku).not.toBe("—");
  const gallery = page.getByTestId("size-responsive-gallery").filter({ visible: true }).first();
  const initialSize = await gallery.getAttribute("data-active-size");
  const initialImages = await gallery.locator("img").all().then((images) => Promise.all(images.map((image) => image.getAttribute("src"))));
  const nextSize = page.getByRole("group", { name: /Μέγεθος|Size/i }).getByRole("button", { pressed: false }).filter({ visible: true }).first();
  await expect(nextSize).toBeEnabled();
  await nextSize.click();
  await expect(gallery).not.toHaveAttribute("data-active-size", initialSize ?? "");
  const changedImages = await gallery.locator("img").all().then((images) => Promise.all(images.map((image) => image.getAttribute("src"))));
  expect(changedImages).toEqual(initialImages);
  await expect(gallery.getByRole("button", { name: /Show .* image/i }).first()).toBeVisible();

  let requestedVariantId: number | undefined;
  await page.route("**/api/cart/validate", async (route) => {
    const body = route.request().postDataJSON() as { variantId: number; quantity: number };
    requestedVariantId = body.variantId;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ variantId: body.variantId, sku: selectedSku, productTitle: "Ruseè kimono", designName: "Selected design", colourName: "Selected colour", sizeLabel: "Selected size", priceMinor: 18900, currency: "EUR", image: "/kimono_images/kimono_design_artemis_main.png", quantity: 1, available: 1 }) });
  });
  await page.getByTestId("add-selected-variant").filter({ visible: true }).first().click();
  await expect.poll(() => requestedVariantId).toBeGreaterThan(0);
  await expect(page.getByRole("status")).toContainText(/Προστέθηκε|Added/i);
});

test("a direct admin open completes the compact loader and reveals sign in", async ({ page }) => {
  await page.goto("/admin");
  const loader = page.getByTestId("site-preloader");
  const reducedMotion = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (!reducedMotion) {
    await expect(loader).toBeVisible();
    await expect(page.getByTestId("preloader-progress-line")).toBeVisible();
  }
  await expect(loader).toBeHidden({ timeout: 4000 });
  await expect(page.locator("[data-page-entrance]")).toBeVisible();
  await expect(page.getByLabel(/Username|Όνομα χρήστη/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
});
