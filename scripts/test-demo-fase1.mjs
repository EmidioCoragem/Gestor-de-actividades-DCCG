// Executa apenas a demonstração fictícia; sem .env, Next ou bindings Supabase.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const area = mkdtempSync(join(tmpdir(), "gestor-demo-tests-"));
const env = { ...process.env };
for (const name of Object.keys(env)) if (/supabase/i.test(name)) delete env[name];
Object.assign(env, { npm_config_update_notifier: "false" });
if (!env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && existsSync("/usr/bin/chromium"))
  env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "/usr/bin/chromium";

try {
  const result = spawnSync("npx", [
    "--no-install", "playwright", "test", "--config=playwright.demo.config.ts",
    `--output=${join(area, "results")}`, "--global-timeout=180000",
    ...process.argv.slice(2).filter(arg => /^(--project=|--grep=)/.test(arg)),
  ], { cwd: root, env, stdio: "inherit", detached: true, timeout: 240_000 });
  if (result.error) {
    // Apenas o grupo de processos criado por este runner, nunca o portal real.
    try { process.kill(-result.pid, "SIGTERM"); } catch {}
    await delay(500);
    try { process.kill(-result.pid, "SIGKILL"); } catch {}
    console.error("Demonstração local: execução não concluída.");
  }
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(area, { recursive: true, force: true });
}
