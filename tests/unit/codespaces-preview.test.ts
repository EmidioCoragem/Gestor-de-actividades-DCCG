import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function preview(ghSucceeds: boolean, confirmed = false) {
  const directory = mkdtempSync(join(tmpdir(), "portal-preview-test-"));
  temporaryDirectories.push(directory);
  const trace = join(directory, "trace");
  writeFileSync(
    join(directory, "gh"),
    `#!/bin/sh\nprintf '%s\\n' "$*" >> "$PREVIEW_TEST_TRACE"\nexit ${ghSucceeds ? 0 : 1}\n`,
    { mode: 0o755 },
  );
  writeFileSync(
    join(directory, "node"),
    '#!/bin/sh\nprintf "node-started\\n" >> "$PREVIEW_TEST_TRACE"\n',
    { mode: 0o755 },
  );
  const result = spawnSync(
    "bash",
    [resolve(".devcontainer/start-preview.sh")],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        CODESPACES: "true",
        CODESPACE_NAME: "test-codespace",
        PORTAL_PREVIEW_PRIVATE_CONFIRMED: confirmed ? "1" : "",
        PREVIEW_TEST_TRACE: trace,
      },
    },
  );
  return { result, trace: readFileSync(trace, "utf8") };
}

describe("Arranque privado no Codespaces", () => {
  it("pede apenas private e inicia após sucesso da API", () => {
    const { result, trace } = preview(true);
    expect(result.status).toBe(0);
    expect(trace).toContain(
      "codespace ports visibility 3000:private --codespace test-codespace",
    );
    expect(trace).toContain("node-started");
  });
  it("não inicia o servidor quando a definição privada falha", () => {
    const { result, trace } = preview(false);
    expect(result.status).toBe(1);
    expect(trace).not.toContain("node-started");
    expect(result.stderr).toContain("No separador Ports");
  });
  it("aceita confirmação explícita feita no painel sem chamar a API", () => {
    const { result, trace } = preview(false, true);
    expect(result.status).toBe(0);
    expect(trace).not.toContain("codespace ports visibility");
    expect(trace).toContain("node-started");
  });
});
