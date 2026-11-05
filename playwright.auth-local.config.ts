import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Cópia temporária independente; Auth HTTPS fictício, sem .next/.env do portal.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "auth-local-flow.spec.ts",
  workers: 1,
  fullyParallel: false,
  // Inclui a compilação inicial das rotas na cópia Webpack sem cache partilhada.
  timeout: 60_000,
  // A primeira Server Action também pode compilar a frio; manter todas as asserções.
  expect: { timeout: 15_000 },
  outputDir: "test-results/auth-local",
  projects: base.projects,
  use: { ...base.use, baseURL: "http://127.0.0.1:3100", trace: "off", video: "off", screenshot: "off" },
  webServer: {
    command: "node tests/fixtures/auth-local-server.mjs",
    url: "http://127.0.0.1:3100/recuperar-acesso",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
