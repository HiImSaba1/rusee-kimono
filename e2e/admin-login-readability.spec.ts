import { expect, test } from "@playwright/test";

test("admin login fields keep readable labels, text and password masking", async ({ page }, testInfo) => {
  await page.goto("/admin");
  await expect(page.locator("html")).toHaveAttribute("data-rusee-hydrated", "true");

  const username = page.getByTestId("admin-login-username");
  const password = page.getByTestId("admin-login-password");
  await expect(username).toHaveAttribute("autocomplete", "username");
  await expect(password).toHaveAttribute("autocomplete", "current-password");

  await username.fill("readability-check");
  await password.fill("three-large-marks");

  const styles = await page.evaluate(() => {
    const usernameInput = document.querySelector<HTMLInputElement>('[data-testid="admin-login-username"]');
    const passwordInput = document.querySelector<HTMLInputElement>('[data-testid="admin-login-password"]');
    if (!usernameInput || !passwordInput) throw new Error("Login inputs are unavailable.");
    return {
      username: Number.parseFloat(getComputedStyle(usernameInput).fontSize),
      password: Number.parseFloat(getComputedStyle(passwordInput).fontSize),
      usernameLabel: Number.parseFloat(getComputedStyle(usernameInput.closest("label")!).fontSize),
      passwordLabel: Number.parseFloat(getComputedStyle(passwordInput.closest("label")!).fontSize),
    };
  });

  expect(styles.username).toBeGreaterThanOrEqual(18);
  expect(styles.password).toBeGreaterThanOrEqual(24);
  expect(styles.usernameLabel).toBeGreaterThanOrEqual(12);
  expect(styles.passwordLabel).toBeGreaterThanOrEqual(12);

  if (testInfo.project.name !== "mobile-reduced-motion") {
    const visual = page.getByTestId("admin-login-visual");
    await expect(visual).toBeVisible();
    await expect.poll(() => visual.evaluate(element => getComputedStyle(element).clipPath)).not.toContain("100%");
  }
});
