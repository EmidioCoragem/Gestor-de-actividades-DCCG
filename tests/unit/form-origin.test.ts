import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const sdk = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: sdk.create }));
import { protectFormOrigin, codespacesFormOrigin, formOriginCookie, formOriginField, originDiagnosticCookie, originDiagnosticPath } from "../../src/modules/auth/form-origin";
import { proxy } from "../../src/proxy";

const origin = "https://fixture-codespace-3000.app.github.dev";
const host = new URL(origin).host;
const nonce = "a".repeat(64);
const other = "b".repeat(64);
const require = createRequire(import.meta.url);

beforeEach(() => {
  vi.stubEnv("CODESPACES", "true");
  vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "");
  vi.stubEnv("CODESPACE_NAME", "fixture-codespace");
  vi.stubEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("APP_ORIGIN", origin);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  sdk.create.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function post(headers: Record<string, string> = {}, body?: BodyInit, pathname = "/recuperar-acesso") {
  const form = new FormData();
  form.set(formOriginField, nonce);
  return new NextRequest(`http://localhost:3000${pathname}`, {
    method: "POST", body: body ?? form,
    headers: {
      host: "localhost:3000", "x-forwarded-host": host,
      origin, "sec-fetch-site": "same-origin",
      cookie: `${formOriginCookie}=${nonce}`, ...headers,
    },
  });
}

describe("Origem dos formulários privados Codespaces", () => {
  it("emite cookie __Host- HttpOnly/Secure/Strict e torna-o disponível ao render", async () => {
    const req = new NextRequest(`${origin}/recuperar-acesso`);
    const response = await proxy(req);
    const cookie = response.cookies.get(formOriginCookie);
    expect(cookie?.value).toMatch(/^[a-f0-9]{64}$/);
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 600 });
    expect(cookie?.domain).toBeUndefined();
    expect(req.cookies.get(formOriginCookie)?.value).toBe(cookie?.value);
    expect(response.headers.get("x-middleware-request-cookie")).toContain(formOriginCookie);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("reutiliza cookie válido em vez de invalidar formulários noutra aba", async () => {
    const req = new NextRequest(`${origin}/entrar`, { headers: { cookie: `${formOriginCookie}=${nonce}` } });
    expect(await protectFormOrigin(req)).toEqual({ blocked: false });
  });
  it("preserva a prova CSRF e os cookies de sessão quando o SDK renova a sessão", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.example.invalid");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "local-public-placeholder");
    sdk.create.mockImplementation((_url, _key, options) => ({
      auth: { getUser: async () => {
        options.cookies.setAll([{ name: "synthetic-session", value: "fixture-only", options: { secure: true, sameSite: "lax", path: "/" } }]);
        return { data: { user: null }, error: null };
      } },
    }));
    const response = await proxy(new NextRequest(`${origin}/entrar`));
    expect(response.cookies.get(formOriginCookie)?.value).toMatch(/^[a-f0-9]{64}$/);
    expect(response.cookies.get("synthetic-session")?.value).toBe("fixture-only");
    expect(response.headers.get("x-middleware-request-cookie")).toContain("synthetic-session");
    expect(response.headers.get("x-middleware-request-cookie")).toContain(formOriginCookie);
  });
  it("aceita a origem HTTPS legítima sem a modificar", async () => {
    const req = post();
    expect(await protectFormOrigin(req)).toEqual({ blocked: false });
    expect(req.headers.get("origin")).toBe(origin);
  });
  it.each(["http://localhost:3000", "https://localhost:3000"])("adapta transporte %s só com prova válida", async receivedOrigin => {
    const req = post({ origin: receivedOrigin });
    const response = await proxy(req);
    expect(response.status).toBe(200);
    expect(req.headers.get("origin")).toBe(origin);
    expect(response.headers.get("x-middleware-request-origin")).toBe(origin);
    expect(response.headers.get("x-middleware-request-x-forwarded-host")).toBe(host);
  });
  it("é compatível com o FormData realmente serializado pelo React instalado", async () => {
    vi.stubGlobal("__webpack_require__", { u: () => "" });
    const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.browser") as {
      encodeReply(value: unknown): Promise<FormData>;
    };
    const form = new FormData(); form.set(formOriginField, nonce);
    form.set("password", "synthetic-password-only");
    const body = await encodeReply([{ message: "" }, form]);
    expect([...body.keys()]).toContain(`_1_${formOriginField}`);
    expect(await protectFormOrigin(post({ origin: "http://localhost:3000" }, body))).toEqual({ blocked: false });
  });
  it.each<Record<string, string>>([
    { origin: "https://attacker.invalid" },
    { origin: "null" },
    { origin: `${origin}/path` },
    { origin: `${origin}, http://localhost:3000` },
    { origin: "http://127.0.0.1:3000" },
    { origin: "http://localhost:3100" },
    { "x-forwarded-host": "attacker.invalid" },
    { "x-forwarded-host": `${host}, attacker.invalid` },
    { "x-forwarded-host": `${host}:443` },
    { "sec-fetch-site": "cross-site" },
    { "sec-fetch-site": "same-site" },
    { "sec-fetch-site": "" },
    { cookie: "" },
    { cookie: `${formOriginCookie}=${other}` },
    { cookie: `${formOriginCookie}=${nonce}; ${formOriginCookie}=${other}` },
  ])("recusa origem/cabeçalhos/cookie divergentes: %j", async headers => {
    const req = post(headers);
    expect(await protectFormOrigin(req)).toEqual({ blocked: true });
  });
  it("não confia em host/Fetch Metadata/origem original falsificados sem nonce no corpo", async () => {
    const form = new FormData(); form.set("email", "synthetic@example.invalid");
    const req = post({ origin: "http://localhost:3000", "x-original-origin": origin, "x-forwarded-origin": origin }, form);
    const response = await proxy(req);
    expect(response.status).toBe(403);
    expect(sdk.create).not.toHaveBeenCalled();
    expect(req.headers.get("origin")).toBe("http://localhost:3000");
  });
  it("recusa origem ausente mesmo com prova e host correctos", async () => {
    const req = post(); req.headers.delete("origin");
    expect((await protectFormOrigin(req)).blocked).toBe(true);
  });
  it("recusa múltiplos tokens, incluindo duplicados prefixados", async () => {
    const form = new FormData();
    form.append(formOriginField, nonce); form.append(`_1_${formOriginField}`, nonce);
    expect((await protectFormOrigin(post({}, form))).blocked).toBe(true);
  });
  it.each([false, true])("recusa corpo excessivo (comprimento declarado=%s)", async declared => {
    const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
    if (declared) headers["content-length"] = "20000";
    const body = `${formOriginField}=${nonce}&extra=${"x".repeat(17000)}`;
    expect((await protectFormOrigin(post(headers, body))).blocked).toBe(true);
  });
  it("suporta formulário HTML e preserva o corpo original para o Next", async () => {
    const body = new URLSearchParams({ [formOriginField]: nonce });
    const req = post({ origin: "http://localhost:3000" }, body);
    expect((await protectFormOrigin(req)).blocked).toBe(false);
    expect((await req.formData()).get(formOriginField)).toBe(nonce);
  });
  it("falha fechado em domínio, APP_ORIGIN ou modo de execução divergente", async () => {
    vi.stubEnv("APP_ORIGIN", "https://attacker.invalid");
    expect(() => codespacesFormOrigin()).toThrow();
    expect((await proxy(post())).status).toBe(403);
    vi.stubEnv("APP_ORIGIN", origin);
    vi.stubEnv("APP_ORIGIN", `${origin}/`);
    expect(() => codespacesFormOrigin()).toThrow();
    vi.stubEnv("APP_ORIGIN", origin);
    vi.stubEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "attacker.invalid");
    expect(() => codespacesFormOrigin()).toThrow();
    vi.stubEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => codespacesFormOrigin()).toThrow();
  });
  it("não adapta transporte local fora do Codespaces e recusa origem não canónica", async () => {
    vi.stubEnv("CODESPACES", "");
    const req = post({ origin: "http://localhost:3000" });
    expect((await protectFormOrigin(req)).blocked).toBe(true);
    expect(req.headers.get("origin")).toBe("http://localhost:3000");
  });
  it("Next continua a recusar localhost e domínios externos na sua allowlist", async () => {
    const config = (await import("../../next.config")).default;
    const actions = config.experimental?.serverActions;
    const allowed = typeof actions === "object" ? actions.allowedOrigins ?? [] : [];
    expect(allowed).toEqual([host]);
    const { isCsrfOriginAllowed } = require("next/dist/server/app-render/csrf-protection") as {
      isCsrfOriginAllowed(value: string, allowed: string[]): boolean;
    };
    expect(isCsrfOriginAllowed("localhost:3000", allowed)).toBe(false);
    expect(isCsrfOriginAllowed("attacker.invalid", allowed)).toBe(false);
    expect(isCsrfOriginAllowed(host, allowed)).toBe(true);
  });
  it("diagnóstico desactivado devolve 404 antes do SDK", async () => {
    expect((await proxy(new NextRequest(origin + originDiagnosticPath))).status).toBe(404);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("diagnóstico exige Codespaces de desenvolvimento identificado", async () => {
    vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "1");
    vi.stubEnv("CODESPACES", "");
    expect((await proxy(new NextRequest(origin + originDiagnosticPath))).status).toBe(404);
    vi.stubEnv("CODESPACES", "true");
    vi.stubEnv("NODE_ENV", "production");
    expect((await proxy(new NextRequest(origin + originDiagnosticPath))).status).toBe(404);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("GET diagnóstico usa cookie próprio sem ler ou renovar sessão Supabase", async () => {
    vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.example.invalid");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "local-public-placeholder");
    const req = new NextRequest(origin + originDiagnosticPath, {
      headers: { cookie: `${formOriginCookie}=${nonce}; synthetic-auth-session=fixture-only` },
    });
    const response = await proxy(req);
    expect(response.cookies.get(originDiagnosticCookie)).toMatchObject({ secure: true, httpOnly: true, sameSite: "strict" });
    expect(response.cookies.get(formOriginCookie)).toBeUndefined();
    expect(response.cookies.get("synthetic-auth-session")).toBeUndefined();
    expect(req.cookies.get(formOriginCookie)?.value).toBe(nonce);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("POST diagnóstico legítimo preserva a validação de origem sem SDK", async () => {
    vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.example.invalid");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "local-public-placeholder");
    const req = post({ origin: "http://localhost:3000", cookie: `${originDiagnosticCookie}=${nonce}` }, undefined, originDiagnosticPath);
    const response = await proxy(req);
    expect(response.status).toBe(200);
    expect(req.headers.get("origin")).toBe(origin);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("POST diagnóstico com origem forjada é recusado antes do SDK", async () => {
    vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "1");
    const req = post({ origin: "https://forged.invalid", cookie: `${originDiagnosticCookie}=${nonce}` }, undefined, originDiagnosticPath);
    const response = await proxy(req);
    expect(response.status).toBe(403);
    expect(response.headers.get("x-gestor-csrf-diagnostic")).toBe("rejected");
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("POST diagnóstico com prova adulterada é recusado antes do SDK", async () => {
    vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "1");
    const req = post({ cookie: `${originDiagnosticCookie}=${other}` }, undefined, originDiagnosticPath);
    expect((await proxy(req)).status).toBe(403);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("cookie Auth não serve como prova no diagnóstico", async () => {
    vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "1");
    expect((await proxy(post({}, undefined, originDiagnosticPath))).status).toBe(403);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("página restrita emite prova CSRF própria para terminar sessão", async () => {
    const response = await proxy(new NextRequest(origin + "/acesso-restrito"));
    expect(response.cookies.get(formOriginCookie)).toMatchObject({ secure: true, httpOnly: true, sameSite: "strict" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("logout restrito adapta origem apenas com prova válida", async () => {
    const req = post({ origin: "http://localhost:3000" }, undefined, "/acesso-restrito");
    expect((await protectFormOrigin(req)).blocked).toBe(false);
    expect(req.headers.get("origin")).toBe(origin);
  });
  it("compilador Next conserva o FormData CSRF da acção de logout no transporte React", async () => {
    const { transformSync } = require("next/dist/build/swc");
    const { extractInfoFromServerReferenceId, omitUnusedArgs } = require("next/dist/shared/lib/server-reference-info");
    const compiled = transformSync(readFileSync("src/modules/auth/actions.ts", "utf8"), {
      filename: "/fixture/src/modules/auth/actions.ts",
      jsc: { parser: { syntax: "typescript" } }, module: { type: "es6" },
      serverActions: { isReactServerLayer: true, isDevelopment: true,
        useCacheEnabled: false, hashSalt: "local-fixture-only", cacheKinds: ["default"] },
    });
    const metadata = compiled.code.match(/__next_internal_action_entry_do_not_use__\s+(\{[^\n]+\})/);
    expect(metadata).not.toBeNull();
    const entries = JSON.parse(metadata![1]) as Record<string, { name: string }>;
    const id = Object.entries(entries).find(([, entry]) => entry.name === "signOutFromRestricted")?.[0];
    expect(id).toBeDefined();
    const form = new FormData(); form.set(formOriginField, nonce);
    const args = omitUnusedArgs([{ message: "" }, form], extractInfoFromServerReferenceId(id));
    expect(args[1]).toBe(form);
    vi.stubGlobal("__webpack_require__", { u: () => "" });
    const { encodeReply } = require("next/dist/compiled/react-server-dom-webpack/client.browser");
    const body = await encodeReply(args);
    const request = post({ origin: "http://localhost:3000" }, body, "/acesso-restrito");
    expect((await proxy(request)).status).toBe(200);
    expect(request.headers.get("origin")).toBe(origin);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it.each<Record<string, string>>([
    { origin: "https://forged.invalid" },
    { cookie: "" },
  ])("logout restrito recusa falsificação ou ausência de prova: %j", async headers => {
    const req = post(headers, undefined, "/acesso-restrito");
    expect((await proxy(req)).status).toBe(403);
    expect(sdk.create).not.toHaveBeenCalled();
  });
});


describe("Auth fora do Codespaces: origem canónica obrigatória", () => {
  it.each([origin, "http://127.0.0.1:3100"])("aceita origem configurada %s sem reescrever", async canonical => {
    vi.stubEnv("CODESPACES", ""); vi.stubEnv("APP_ORIGIN", canonical);
    const req = post({ origin: canonical });
    expect(await protectFormOrigin(req)).toEqual({ blocked: false });
    expect(req.headers.get("origin")).toBe(canonical);
  });
  it.each([null, "null", "", "https://forged.invalid", `${origin}/path`, `${origin}, https://forged.invalid`])("recusa origem ausente/nula/falsificada: %s", async received => {
    vi.stubEnv("CODESPACES", "");
    const req = post({ "x-original-origin": origin, "sec-fetch-site": "same-origin" });
    if (received === null) req.headers.delete("origin"); else req.headers.set("origin", received);
    expect((await proxy(req)).status).toBe(403);
    expect(req.headers.get("origin")).toBe(received);
    expect(sdk.create).not.toHaveBeenCalled();
  });
  it("GET sem Origin continua permitido para confirmação/navegação", async () => {
    vi.stubEnv("CODESPACES", "");
    expect(await protectFormOrigin(new NextRequest(origin + "/recuperar-acesso"))).toEqual({ blocked: false });
  });
  it("POST com configuração de origem ausente falha fechado", async () => {
    vi.stubEnv("CODESPACES", ""); vi.stubEnv("APP_ORIGIN", "");
    expect((await proxy(post())).status).toBe(403);
    expect(sdk.create).not.toHaveBeenCalled();
  });
});
