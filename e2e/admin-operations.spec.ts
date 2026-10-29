import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the local admin browser contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

test("authenticated admin can inspect demo operations and revoke the session", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");

  await page.reload();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await expect(page.getByTestId("site-preloader")).toBeHidden({ timeout: 4000 });
  const menu = page.locator('button[aria-controls="admin-menu"]');
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.focus();
  await expect(menu).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toContainText(/Close|Κλείσιμο/i);
  await page.getByRole("link", { name: /Orders|Παραγγελίες/i }).click();

  const search = page.getByPlaceholder(/Order number or email|Αριθμός παραγγελίας ή email/i);
  await search.fill("DEMO-002");
  await search.press("Enter");
  await expect(page.getByRole("link", { name: "DEMO-002" })).toBeVisible();
  await page.getByRole("link", { name: "DEMO-002" }).click();
  await expect(page.getByRole("heading", { name: "DEMO-002" })).toBeVisible();
  await expect(page.getByText(/captured/i).first()).toBeVisible();
  await expect(page.getByText(/Status history|Ιστορικό κατάστασης/i)).toBeVisible();

  await page.getByRole("button", { name: /Sign out|Έξοδος/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/overview");
  await expect(page).toHaveURL(/\/admin$/);
});
