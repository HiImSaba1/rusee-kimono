import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the email-template browser contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

test("owner sees an explicit queue-only test-delivery control", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForLoadState("domcontentloaded");
  for (let attempt = 0; attempt < 2 && !page.url().endsWith("/admin/overview"); attempt++) {
    await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
    await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
    await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
    try {
      await page.waitForURL(/\/admin\/overview$/, { timeout: 10_000 });
    } catch {
      if (attempt === 1) throw new Error("Admin login did not become interactive after one safe retry.");
    }
  }
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await page.goto("/admin/email-templates");
  await expect(page.locator("[data-page-entrance]")).toHaveAttribute("data-page-entrance-state", "complete");

  const form = page.locator("[data-testid='template-test-form'][data-template-key='payment_confirmation']");
  await expect(form.getByLabel(/Παραλήπτης δοκιμής|Test recipient/i)).toHaveAttribute("type", "email");
  await expect(form.getByRole("checkbox", { name: /Μόνο δείγμα|Sample only/i })).toHaveAttribute("required", "");
  await expect(form).toContainText(/ιδιωτικού worker|private worker/i);
  await expect(form).not.toContainText(/password=|authorization:|bearer\s|mysql:\/\//i);

  const violations = (await new AxeBuilder({ page }).include("[data-testid='template-test-form'][data-template-key='payment_confirmation']").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations
    .filter(violation => violation.impact === "critical" || violation.impact === "serious");
  expect(violations, violations.map(violation => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 4);
});
