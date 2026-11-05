import { mkdtempSync, mkdirSync, readFileSync, existsSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { prepareAuthLocalApp, authLocalEnvironment } from "../fixtures/auth-local-workspace";

it("Next fictício escreve só na cópia e não herda .env, lock ou tipos do portal", () => {
  const folder = mkdtempSync(join(tmpdir(), "gestor-workspace-test-"));
  try {
    const root = join(folder, "portal"); const copy = join(folder, "isolated");
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(join(root, "node_modules"));
    mkdirSync(join(root, ".next/dev"), { recursive: true });
    writeFileSync(join(root, "src/page.tsx"), "fixture-source");
    for (const name of ["package.json", "package-lock.json", "next.config.ts", "postcss.config.mjs", "tsconfig.json"])
      writeFileSync(join(root, name), "fixture-input");
    writeFileSync(join(root, ".env.local"), "SYNTHETIC_ONLY=not-for-tests");
    writeFileSync(join(root, ".next/dev/lock"), "fixture-live-lock");
    writeFileSync(join(root, "next-env.d.ts"), "fixture-live-types");
    prepareAuthLocalApp(root, copy);
    expect(existsSync(join(copy, ".env.local"))).toBe(false);
    expect(existsSync(join(copy, ".next"))).toBe(false);
    expect(realpathSync(join(copy, "node_modules"))).toBe(join(root, "node_modules"));
    writeFileSync(join(copy, "next-env.d.ts"), "generated-test-types");
    writeFileSync(join(copy, "tsconfig.json"), "generated-test-config");
    writeFileSync(join(copy, "src/page.tsx"), "changed-copy");
    expect(readFileSync(join(root, "next-env.d.ts"), "utf8")).toBe("fixture-live-types");
    expect(readFileSync(join(root, "tsconfig.json"), "utf8")).toBe("fixture-input");
    expect(readFileSync(join(root, "src/page.tsx"), "utf8")).toBe("fixture-source");
    expect(readFileSync(join(root, ".next/dev/lock"), "utf8")).toBe("fixture-live-lock");
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

it("simulador substitui bindings Auth herdados e desliga diagnóstico Codespaces", () => {
  const inherited: NodeJS.ProcessEnv = { NODE_ENV: "production", PATH: "/fixture/bin", NODE_OPTIONS: "--fixture-policy",
    NEXT_PUBLIC_SUPABASE_URL: "https://unused.example.invalid", SUPABASE_SECRET_KEY: "synthetic-only",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-unused", APP_ORIGIN: "https://unused.example.invalid",
    CODESPACES: "true", GESTOR_CSRF_DIAGNOSTIC: "1" };
  const environment = authLocalEnvironment(inherited, "/fixture/cert.pem");
  expect(environment).toMatchObject({ PATH: inherited.PATH, NODE_OPTIONS: inherited.NODE_OPTIONS,
    CODESPACES: "", CODESPACE_NAME: "", GESTOR_CSRF_DIAGNOSTIC: "0", NODE_ENV: "development",
    APP_ORIGIN: "http://127.0.0.1:3100", NEXT_PUBLIC_SUPABASE_URL: "https://127.0.0.1:4343",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-public-placeholder",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "",
    NODE_EXTRA_CA_CERTS: "/fixture/cert.pem" });
  expect(environment.SUPABASE_SECRET_KEY).toBeUndefined();
  expect(inherited.CODESPACES).toBe("true");
});
