import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/demo",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3120",
    trace: "off",
    screenshot: "off",
    video: "off",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "tablet", use: { ...devices["iPad Mini"], defaultBrowserType: "chromium" } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "node scripts/demo-fase1.mjs --port 3120",
    url: "http://127.0.0.1:3120",
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    timeout: 30_000,
  },
});
