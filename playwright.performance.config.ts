import { defineConfig, devices } from "@playwright/test";

const port = 3108;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "performance-budget.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  outputDir: "artifacts/playwright-performance-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "performance-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "performance-mobile", use: { ...devices["Pixel 7"], contextOptions: { reducedMotion: "reduce" } } },
  ],
  webServer: {
    command: "powershell -ExecutionPolicy Bypass -File scripts/start-performance-server.ps1",
    url: `${baseURL}/api/health/live`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
