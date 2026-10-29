import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret)
  .update("rusee-admin-e2e-password:v1")
  .digest("base64url")
  .slice(0, 28);

test("owner sees protected read-only worker freshness without secrets", async ({ page }) => {
  await page.goto("/admin");
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
  await page.goto("/admin/health");
  await expect(page.locator("[data-page-entrance]")).toHaveAttribute("data-page-entrance-state", "complete");
  const health = page.getByTestId("worker-health");
  await expect(health.getByRole("heading", { name: /Ρυθμός αυτοματισμών/i })).toBeVisible();
  await expect(health).toContainText(/Έτοιμες εργασίες|Due/i);
  await expect(health).toContainText(/πραγματικό timestamp|production scheduling/i);
  await expect(health.getByRole("link", { name: /Προβολή ουράς|View queue/i })).toBeVisible();
  // Explanatory copy may name a "Bearer secret". Reject only rendered
  // authorization headers or credential-shaped values.
  await expect(health).not.toContainText(
    /authorization\s*[:=]|bearer\s+[a-z0-9._~-]{12,}|password\s*=|mysql:\/\/\S+|AUTOMATION_SECRET\s*=/i,
  );
  const violations = (await new AxeBuilder({ page })
    .include("[data-testid='worker-health']")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()).violations.filter((item) => item.impact === "critical" || item.impact === "serious");
  expect(violations, violations.map((item) => `${item.id}: ${item.help}`).join("\n")).toEqual([]);
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 4);
});
