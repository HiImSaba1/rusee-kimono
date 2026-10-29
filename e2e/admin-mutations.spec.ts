import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the local admin mutation contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);
const orderSuffix: Record<string, string> = { chromium: "CHROMIUM", firefox: "FIREFOX", webkit: "WEBKIT", "mobile-reduced-motion": "MOBILE" };

test("authenticated admin safely advances fulfilment and requests a partial refund", async ({ page }, testInfo) => {
  const suffix = orderSuffix[testInfo.project.name];
  if (!suffix) throw new Error(`No isolated order is assigned to ${testInfo.project.name}.`);
  const orderNumber = `E2E-OPS-${suffix}`;

  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await page.goto("/admin/order-operations");
  await expect(page).toHaveURL(/\/admin\/order-operations$/);

  const order = page.locator("article").filter({ hasText: orderNumber });
  const state = order.getByTestId("order-operation-state");
  await expect(state).toHaveAttribute("data-order-state", "paid");
  await expect(state).toHaveAttribute("data-payment-state", "paid");
  await expect(state).toHaveAttribute("data-fulfilment-state", "unfulfilled");
  await order.getByLabel(/Operational note|Λειτουργική σημείωση/i).fill("Sprint 08J browser fulfilment evidence");
  await order.getByRole("button", { name: /Start processing|Έναρξη επεξεργασίας/i }).click();
  await expect(state).toHaveAttribute("data-order-state", "processing");
  await expect(state).toHaveAttribute("data-payment-state", "paid");
  await expect(state).toHaveAttribute("data-fulfilment-state", "processing");
  await expect(order.getByLabel(/Courier|Ταχυμεταφορική/i)).toBeVisible();
  await expect(order.getByLabel(/Tracking code|Κωδικός αποστολής/i)).toBeVisible();
  await expect(order.getByLabel(/HTTPS tracking link|Σύνδεσμος παρακολούθησης/i)).toBeVisible();

  await order.getByLabel(/Amount|Ποσό/i).fill("25.00");
  await order.getByLabel(/Reason|Αιτία/i).fill("Sprint 08J partial refund evidence");
  await order.getByRole("button", { name: /Request provider refund|Αίτημα επιστροφής στον πάροχο/i }).click();
  await expect(order).toContainText(/Requested:.*25|Ζητήθηκε:.*25/i);
  await expect(order.getByLabel(/Amount|Ποσό/i)).toHaveAttribute("max", "164");

  await order.getByRole("link", { name: orderNumber }).click();
  await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
  await expect(page.getByText(/Status history|Ιστορικό κατάστασης/i)).toBeVisible();
  await expect(page.getByText("Sprint 08J browser fulfilment evidence")).toBeVisible();
});
