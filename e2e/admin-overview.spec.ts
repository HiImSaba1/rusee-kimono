import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the overview browser contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

test("owner sees a bounded Greek-first daily action centre", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await expect(page.getByRole("heading", { name: /Σήμερα/i })).toBeVisible();
  const attention = page.getByRole("heading", { name: /Τι χρειάζεται προσοχή/i }).locator("xpath=ancestor::section");
  await expect(attention.getByRole("link")).toHaveCount(8);
  await expect(attention.getByRole("link", { name: /Εγκρίσεις launch/i })).toBeVisible();
  await expect(page.getByRole("region", { name: /Πίνακας πρόσφατων παραγγελιών/i })).toBeVisible();
  await expect(page.locator("main").last()).not.toContainText(/provider_payload|token_hash|password_hash|authorization/i);
});
