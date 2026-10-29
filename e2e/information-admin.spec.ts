import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
const secret=process.env.ADMIN_SESSION_SECRET;if(!secret||secret.length<32)throw new Error("ADMIN_SESSION_SECRET is required.");
const username="__rusee_e2e_admin__";const password=createHmac("sha256",secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0,28);
test("owner can inspect fixed bilingual information editors", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.locator("html")).toHaveAttribute("data-route-ready", "true");

  await page.goto("/admin/information");
  await expect(page).toHaveURL(/\/admin\/information$/);
  await expect(page.getByRole("heading", { name: /Σελίδες πληροφοριών/i })).toBeVisible();
  await expect(page.locator('main a[href^="/admin/information/"]:not([href$="/preview"])')).toHaveCount(7);
  await page.locator('main a[href="/admin/information/shipping/preview"]').click();
  await expect(page.getByTestId("information-draft-preview")).toHaveAttribute("lang", "el");
  await expect(page.getByText(/Πλήρες δίγλωσσο περιεχόμενο|Structurally ready|Δεν είναι έτοιμο για δημοσίευση|Not ready/i)).toBeVisible();
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page.getByTestId("information-draft-preview")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: /Επεξεργασία|Edit/i }).click();
  await expect(page.getByRole("heading", { name: /Αποστολές & courier/i })).toBeVisible();
  await expect(page.locator('input[name="slug"]')).toHaveValue("shipping");
  await expect(page.locator('button[name="intent"]')).toHaveCount(2);
  await expect(page.locator('input[name$="Confirmation"]').first()).toBeVisible();
});
