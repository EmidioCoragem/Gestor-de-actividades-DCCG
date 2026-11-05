import { cpSync, existsSync, mkdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";

// Copiar só os inputs da aplicação. Nunca copiar .env, .git, .next ou sessões.
// node_modules é apenas reutilizado para resolver as dependências instaladas.
export function prepareAuthLocalApp(projectRoot: string, destination: string): string {
  mkdirSync(destination, { recursive: true });
  for (const name of ["src", "package.json", "package-lock.json", "next.config.ts",
    "postcss.config.mjs", "tsconfig.json"])
    cpSync(join(projectRoot, name), join(destination, name), { recursive: true });
  if (existsSync(join(projectRoot, "public")))
    cpSync(join(projectRoot, "public"), join(destination, "public"), { recursive: true });
  symlinkSync(join(projectRoot, "node_modules"), join(destination, "node_modules"), "dir");
  return destination;
}

export function authLocalEnvironment(inherited: NodeJS.ProcessEnv, cert: string): NodeJS.ProcessEnv {
  const environment = { ...inherited };
  for (const name of Object.keys(environment))
    if (/supabase/i.test(name)) delete environment[name];
  return { ...environment,
    CODESPACES: "", CODESPACE_NAME: "", GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "",
    GESTOR_CSRF_DIAGNOSTIC: "0", NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SUPABASE_URL: "https://127.0.0.1:4343",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-public-placeholder",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "",
    APP_ORIGIN: "http://127.0.0.1:3100",
    // Confiança apenas no certificado temporário fictício; TLS continua validado.
    NODE_EXTRA_CA_CERTS: cert,
  };
}
