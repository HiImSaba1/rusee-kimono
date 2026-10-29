import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the automation browser contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

test("owner can inspect the Greek-first automation queue without sensitive output", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await page.goto("/admin/automation");

  await expect(page.getByRole("heading", { name: "Αυτοματισμοί." })).toBeVisible();
  await expect(page.locator("[data-page-entrance]")).toHaveAttribute("data-page-entrance-state", "complete");
  await expect(page.getByText(/marketing, abandoned-cart/i)).toBeVisible();
  await expect(page.getByTestId("automation-dashboard")).not.toContainText(/password=|authorization:|bearer\s|mysql:\/\//i);
  const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations
    .filter(violation => violation.impact === "critical" || violation.impact === "serious");
  expect(violations, violations.map(violation => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);

  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 4);
});
