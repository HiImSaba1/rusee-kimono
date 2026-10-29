import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const secret = process.env.ADMIN_SESSION_SECRET;
if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is required for the admin transition contract.");
const username = "__rusee_e2e_admin__";
const password = createHmac("sha256", secret).update("rusee-admin-e2e-password:v1").digest("base64url").slice(0, 28);

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await page.getByLabel(/Username|Όνομα χρήστη/i).fill(username);
  await page.getByLabel(/Password|Κωδικός πρόσβασης/i).fill(password);
  await page.getByRole("button", { name: /Enter the studio|Είσοδος στο ατελιέ/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
}

test("protected admin navigation uses a scoped editorial transition", async ({ page }, testInfo) => {
  await signIn(page);
  const transition = page.getByTestId("admin-page-transition");
  await expect(transition).toHaveAttribute("data-transition-state", "idle");
  await transition.evaluate(element => {
    const states: string[] = [];
    (window as typeof window & { __adminTransitionStates?: string[] }).__adminTransitionStates = states;
    new MutationObserver(() => states.push(element.getAttribute("data-transition-state") ?? "missing"))
      .observe(element, { attributes: true, attributeFilter: ["data-transition-state"] });
  });

  await page.getByRole("link", { name: /Προβολή όλων|View all/i }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(transition).toHaveAttribute("data-transition-state", "idle");

  const states = await page.evaluate(() => (window as typeof window & { __adminTransitionStates?: string[] }).__adminTransitionStates ?? []);
  if (testInfo.project.name === "mobile-reduced-motion") {
    expect(states).not.toContain("covering");
  } else {
    expect(states).toContain("covering");
    expect(states).toContain("revealing");
  }
});

test("admin transition preserves query strings and respects explicit bypass links", async ({ page }) => {
  await signIn(page);
  await page.locator("[data-admin-shell]").evaluate(shell => {
    const transitionLink = document.createElement("a");
    transitionLink.href = "/admin/orders?status=pending";
    transitionLink.textContent = "Filtered orders contract";
    transitionLink.dataset.testid = "admin-query-transition-link";
    shell.appendChild(transitionLink);
  });
  await page.getByTestId("admin-query-transition-link").click();
  await expect(page).toHaveURL(/\/admin\/orders\?status=pending$/);

  await page.locator("[data-admin-shell]").evaluate(shell => {
    const bypassLink = document.createElement("a");
    bypassLink.href = "/admin/overview";
    bypassLink.textContent = "Bypass transition contract";
    bypassLink.dataset.testid = "admin-bypass-transition-link";
    bypassLink.dataset.noAdminTransition = "";
    shell.appendChild(bypassLink);
  });
  await page.getByTestId("admin-bypass-transition-link").click();
  await expect(page).toHaveURL(/\/admin\/overview$/);
  await expect(page.getByTestId("admin-page-transition")).toHaveAttribute("data-transition-state", "idle");
});
