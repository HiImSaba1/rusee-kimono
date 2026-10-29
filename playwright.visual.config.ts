import { defineConfig, devices } from "@playwright/test";

const port = 3107;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "visual-acceptance.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  outputDir: "artifacts/playwright-visual-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "visual-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "visual-mobile", use: { ...devices["iPhone 13"], contextOptions: { reducedMotion: "reduce" } } },
  ],
  webServer: {
    command: "npm run dev:test",
    url: `${baseURL}/api/health/live`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
