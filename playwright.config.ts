import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/auth-local-flow.spec.ts", "**/auth-origin-regression.spec.ts"],
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
    // Esta suite é offline; não recolher artefactos que possam guardar sessões.
    trace: "off",
    screenshot: "off",
    video: "off",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "tablet",
      use: { ...devices["iPad Mini"], defaultBrowserType: "chromium" },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    env: {
      CODESPACES: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      APP_ORIGIN: "https://preview.example.invalid",
    },
    timeout: 120_000,
  },
});
