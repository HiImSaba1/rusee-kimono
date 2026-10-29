import { expect, test } from "@playwright/test";

const cartItem = {
  variantId: 900000001,
  sku: "E2E-SAFE-01",
  productTitle: "Ruseè test kimono",
  designName: "Browser contract",
  colourName: "Ink",
  sizeLabel: "M",
  priceMinor: 12500,
  currency: "EUR",
  image: "/kimono_images/kimono_design_artemis_main.png",
  quantity: 1,
  available: 2,
};

test("product choices expose keyboard-operable size guidance", async ({ page }) => {
  await page.goto("/shop");
  const productLink = page.locator('a[href^="/shop/"]').first();
  await expect(productLink).toBeVisible();
  const href = await productLink.getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  const guide = page.locator("summary").filter({ hasText: /Οδηγός μεγέθους|Size guide/i }).filter({ visible: true }).first();
  await guide.focus();
  await guide.press("Enter");
  await expect(guide.locator("xpath=ancestor::details")).toHaveAttribute("open", "");
  const selectedSize = page.getByRole("group", { name: /Μέγεθος|Size/i }).getByRole("button", { pressed: true });
  await expect(selectedSize).toBeEnabled();
});

test("cart and checkout submit the expected isolated browser contract", async ({ page }) => {
  let orderPayload: { items?: Array<{ variantId: number; quantity: number }>; acceptedTerms?: boolean } | undefined;
  await page.route("**/api/cart/validate", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(cartItem) }));
  await page.route("**/api/orders", async (route) => {
    orderPayload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ publicId: "00000000-0000-4000-8000-000000000007", orderNumber: "E2E-SAFE", status: "pending_payment" }) });
  });
  await page.route("**/api/payments/create", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ redirectUrl: "/e2e-browser-complete" }) }));
  await page.route("**/e2e-browser-complete", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Complete</title><main>Complete</main>" }));
  await page.addInitScript((item) => {
    localStorage.setItem("rusee-cart-v1", JSON.stringify([item]));
    localStorage.setItem("rusee_cookie_consent_v1", JSON.stringify({ value: "essential-only", decidedAt: "2026-01-01T00:00:00.000Z" }));
  }, cartItem);
  await page.goto("/checkout");
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  await page.getByLabel(/First name|Όνομα/i).fill("Browser");
  await page.getByLabel(/Last name|Επώνυμο/i).fill("Test");
  await page.getByLabel(/^Email/i).fill("browser-test@rusee.invalid");
  await page.getByLabel(/Phone|Τηλέφωνο/i).fill("6900000000");
  await page.locator('input[name="line1"]').fill("1 Test Street");
  await page.getByLabel(/City|Πόλη/i).fill("Athens");
  await page.getByLabel(/Postal code|Ταχυδρομικός/i).fill("10558");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Pay securely|Ασφαλής πληρωμή/i }).click();
  await expect.poll(() => orderPayload).toBeTruthy();
  expect(orderPayload).toMatchObject({ items: [{ variantId: cartItem.variantId, quantity: 1 }], acceptedTerms: true });
  await expect(page).toHaveURL(/\/e2e-browser-complete$/);
});

test("protected admin pages redirect anonymous visitors to sign in", async ({ page }) => {
  await page.goto("/admin/overview");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("textbox", { name: /Username|Όνομα χρήστη/i })).toBeVisible();
  await expect(page.getByLabel(/Password|Κωδικός/i)).toBeVisible();
});
