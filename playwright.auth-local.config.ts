import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Processo Next separado; Auth HTTPS fictício em loopback, sem Supabase remoto.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "auth-local-flow.spec.ts",
  workers: 1,
  fullyParallel: false,
  projects: base.projects,
  use: { ...base.use, baseURL: "http://127.0.0.1:3100", trace: "off", video: "off", screenshot: "off" },
  webServer: {
    command: "node tests/fixtures/auth-local-server.mjs",
    url: "http://127.0.0.1:3100/recuperar-acesso",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
