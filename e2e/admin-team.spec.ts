import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the team browser contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

test("owner can inspect safe staff controls without exposing credentials", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");
  await page.goto("/admin/team");
  await expect(page.getByRole("heading", { name: /Ομάδα διαχείρισης/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: username })).toBeVisible();
  await expect(page.locator('select[name="role"] option[value="owner"]')).toHaveCount(0);
  await expect(page.locator('input[name="password"]').first()).toHaveAttribute("type", "password");
  await expect(page.locator("main").last()).not.toContainText(/password_hash|token_hash|scrypt\$/i);
});
