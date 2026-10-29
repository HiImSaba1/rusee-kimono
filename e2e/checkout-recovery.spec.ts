import { expect, test } from "@playwright/test";

const cartItem = { variantId: 900000001, sku: "E2E-RECOVERY-01", productTitle: "Ruseè recovery kimono", designName: "Recovery", colourName: "Ink", sizeLabel: "M", priceMinor: 12500, currency: "EUR", image: "/kimono_images/kimono_design_artemis_main.png", quantity: 1, available: 2 };

test("checkout recovers without losing details or changing its idempotency key", async ({ page }) => {
  let validationCalls = 0;
  let paymentCalls = 0;
  const orderIds: string[] = [];

  await page.addInitScript((item) => {
    localStorage.setItem("rusee-cart-v1", JSON.stringify([item]));
    localStorage.setItem("rusee_cookie_consent_v1", JSON.stringify({ value: "essential-only", decidedAt: "2026-01-01T00:00:00.000Z" }));
  }, cartItem);
  await page.route("**/api/cart/validate", (route) => {
    validationCalls += 1;
    return validationCalls === 1
      ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Unavailable" }) })
      : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(cartItem) });
  });
  await page.route("**/api/orders", async (route) => {
    const payload = route.request().postDataJSON() as { publicId: string };
    orderIds.push(payload.publicId);
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ publicId: payload.publicId, orderNumber: "E2E-RECOVERY", status: "pending_payment" }) });
  });
  await page.route("**/api/payments/create", (route) => {
    paymentCalls += 1;
    return paymentCalls === 1
      ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Unavailable" }) })
      : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ redirectUrl: "/e2e-recovery-complete" }) });
  });
  await page.route("**/e2e-recovery-complete", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Complete</title><main>Complete</main>" }));

  await page.goto("/checkout");
  await expect(page.getByTestId("checkout-recovery-alert")).toContainText(/temporarily|προσωρινά/i);
  await page.getByRole("button", { name: /Try again|Δοκιμή ξανά/i }).click();
  await page.getByLabel(/First name|Όνομα/i).fill("Recovery");
  await page.getByLabel(/Last name|Επώνυμο/i).fill("Test");
  await page.getByLabel(/^Email/i).fill("recovery-test@rusee.invalid");
  await page.getByLabel(/Phone|Τηλέφωνο/i).fill("6900000000");
  await page.locator('input[name="line1"]').fill("1 Test Street");
  await page.getByLabel(/City|Πόλη/i).fill("Athens");
  await page.getByLabel(/Postal code|Ταχυδρομικός/i).fill("10558");
  await page.getByRole("checkbox").check();
  const pay = page.getByRole("button", { name: /Pay securely|Ασφαλής πληρωμή/i });
  await pay.click();
  await expect(page.getByTestId("checkout-submit-alert")).toContainText(/preserved|διατηρήθηκε/i);
  await expect(page.getByLabel(/First name|Όνομα/i)).toHaveValue("Recovery");
  await pay.click();
  await expect(page).toHaveURL(/\/e2e-recovery-complete$/);
  expect(orderIds).toHaveLength(2);
  expect(new Set(orderIds).size).toBe(1);
});
