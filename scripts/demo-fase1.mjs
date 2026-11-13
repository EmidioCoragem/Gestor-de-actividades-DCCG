// Demonstração fictícia autónoma. Não iniciar Next nem carregar configuração Auth.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

if (Number(process.versions.node.split(".")[0]) !== 24) {
  console.error("A demonstração requer Node.js 24.");
  process.exitCode = 1;
} else {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("./demo-fase1-server.mjs", import.meta.url)), ...process.argv.slice(2)],
    {
      // Lista positiva: não transmitir URLs, chaves, loaders ou outras variáveis
      // herdadas. O processo inicial não constitui uma sandbox do sistema operativo.
      env: { NODE_ENV: "development", TZ: "Africa/Luanda" },
      stdio: "inherit",
    },
  );
  let stopping = false;
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      stopping = true;
      if (child.exitCode === null && child.signalCode === null) child.kill(signal);
    });
  }
  child.once("error", () => {
    console.error("Não foi possível iniciar a demonstração fictícia.");
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    process.exitCode = stopping ? 0 : (code ?? 1);
  });
}
