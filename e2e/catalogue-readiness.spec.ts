import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the catalogue-readiness contract.");
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

test("owner sees a safe actionable catalogue-readiness matrix", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill("__rusee_e2e_admin__");
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");

  await page.goto("/admin/catalogue-readiness");
  await expect(page).toHaveURL(/\/admin\/catalogue-readiness$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await expect(page.getByRole("heading", { name: /Ετοιμότητα προϊόντων/i })).toBeVisible();
  const matrix = page.getByRole("region", { name: /Ετοιμότητα σχεδίων/i });
  await expect(matrix.getByTestId("catalogue-readiness-card")).toHaveCount(15);
  await expect(matrix.getByTestId("fact-approval-list")).toHaveCount(15);
  await expect(matrix.getByText(/Ύφασμα & σύνθεση|Fabric & composition/i).first()).toBeVisible();
  await expect(matrix.getByRole("link", { name: /Επεξεργασία/i }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/password_hash|token_hash|provider_payload|authorization/i);
});
