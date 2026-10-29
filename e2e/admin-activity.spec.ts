import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the activity browser contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

test("owner can inspect the redacted paginated activity log", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await page.goto("/admin/activity");
  await expect(page).toHaveURL(/\/admin\/activity$/);
  await expect(page.getByRole("heading", { name: /Ιστορικό ενεργειών/i })).toBeVisible();
  await expect(page.getByRole("region", { name: /Πίνακας ιστορικού/i })).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page.getByRole("link", { name: /Πρόσβαση|Access/i }).click();
  await expect(page).toHaveURL(/category=access/);
  await expect(page.getByRole("link", { name: /Πρόσβαση|Access/i })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("main").last()).not.toContainText(/password|token_hash|provider_payload|authorization/i);
});
