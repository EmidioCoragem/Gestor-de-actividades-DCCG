import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock("next/headers", () => ({ headers: f.headers, cookies: f.cookies }));
import { probeOrigin } from "../../src/app/diagnostico-csrf/actions";
import { formOriginField, originDiagnosticCookie } from "../../src/modules/auth/form-origin";
const origin = "https://fixture-codespace-3000.app.github.dev";
const nonce = "a".repeat(64);

beforeEach(() => {
  vi.stubEnv("CODESPACES", "true");
  vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "1");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("CODESPACE_NAME", "fixture-codespace");
  vi.stubEnv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev");
  vi.stubEnv("APP_ORIGIN", origin);
  f.headers.mockResolvedValue(new Headers({ origin, "sec-fetch-site": "same-origin" }));
  f.cookies.mockResolvedValue({ get: (name: string) => name === originDiagnosticCookie ? { value: nonce } : undefined });
});
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
function form(value = nonce) { const data = new FormData(); data.set(formOriginField, value); return data; }

it("Server Action de diagnóstico apenas devolve aceitação com prova própria", async () => {
  expect(await probeOrigin({ accepted: false }, form())).toEqual({ accepted: true });
});
it("acção desligada não lê sequer cabeçalhos ou cookies", async () => {
  vi.stubEnv("GESTOR_CSRF_DIAGNOSTIC", "");
  expect(await probeOrigin({ accepted: false }, form())).toEqual({ accepted: false });
  expect(f.headers).not.toHaveBeenCalled(); expect(f.cookies).not.toHaveBeenCalled();
});
it("acção não aceita prova inventada ou duplicada", async () => {
  expect(await probeOrigin({ accepted: false }, form("b".repeat(64)))).toEqual({ accepted: false });
  const duplicated = form(); duplicated.append(formOriginField, nonce);
  expect(await probeOrigin({ accepted: false }, duplicated)).toEqual({ accepted: false });
});
it("acção recusa origem não canónica mesmo com prova válida", async () => {
  f.headers.mockResolvedValue(new Headers({ origin: "https://forged.invalid", "sec-fetch-site": "same-origin" }));
  expect(await probeOrigin({ accepted: false }, form())).toEqual({ accepted: false });
});
it("acção não usa uma sessão Auth como substituto da prova", async () => {
  f.cookies.mockResolvedValue({ get: () => undefined });
  expect(await probeOrigin({ accepted: false }, form())).toEqual({ accepted: false });
});
