import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { localSession } from "./auth-fixtures";

const fixture = vi.hoisted(() => ({
  verifyOtp: vi.fn(), exchange: vi.fn(), createClient: vi.fn(), configured: vi.fn(),
  onAuth: vi.fn(), unsubscribe: vi.fn(), listener: undefined as undefined | ((event: string) => void),
  getCookie: vi.fn(), getAll: vi.fn(), setCookie: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: fixture.getCookie, getAll: fixture.getAll, set: fixture.setCookie }) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: fixture.createClient }));
vi.mock("@/modules/auth/environment", async (original) => ({
  ...await original<typeof import("../../src/modules/auth/environment")>(),
  supabaseIsConfigured: fixture.configured,
}));
import { GET } from "../../src/app/auth/confirm/route";
import { applicationOrigin } from "../../src/modules/auth/environment";
import { issueRecoveryRequest, verifierFingerprint } from "../../src/modules/auth/password-setup";

// Valores sintéticos; nenhuma credencial real, chamada Auth ou leitura de ambiente remoto.
const marker = "local-synthetic-confirmation";
const origin = "https://approved-preview.example.invalid";
function request(query: string) {
  return new NextRequest("http://internal-untrusted.invalid/auth/confirm?" + query, {
    headers: { host: "attacker.invalid", "x-forwarded-host": "attacker.invalid", "x-forwarded-proto": "http" },
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("APP_ORIGIN", origin);
  fixture.configured.mockReturnValue(true);
  const session = localSession();
  const verifier = [{ name: "sb-fixture-auth-token-code-verifier", value: "local-verifier-recovery" }];
  fixture.getAll.mockReturnValue(verifier);
  fixture.getCookie.mockReturnValue({ value: issueRecoveryRequest(session.user.email, verifierFingerprint(verifier)!) });
  fixture.verifyOtp.mockResolvedValue({ data: { session, user: session.user }, error: null });
  fixture.listener = undefined;
  fixture.onAuth.mockImplementation((callback) => {
    fixture.listener = callback;
    return { data: { subscription: { unsubscribe: fixture.unsubscribe } } };
  });
  fixture.exchange.mockImplementation(async () => {
    fixture.listener?.("PASSWORD_RECOVERY");
    return { data: { session, user: session.user }, error: null };
  });
  fixture.createClient.mockResolvedValue({ auth: { verifyOtp: fixture.verifyOtp, exchangeCodeForSession: fixture.exchange, onAuthStateChange: fixture.onAuth } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Confirmação no servidor e origem explícita", () => {
  it.each(["invite", "recovery"])("verifica %s e elimina dados do URL de destino", async (type) => {
    const response = await GET(request(`token_hash=${marker}&type=${type}&next=https://attacker.invalid`));
    expect(fixture.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: marker, type });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(origin + "/actualizar-palavra-passe");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await response.text()).not.toContain(marker);
    expect(response.cookies.get("gestor-password-setup")?.httpOnly).toBe(true);
    expect(response.cookies.get("gestor-password-setup")?.secure).toBe(true);
  });
  it.each([
    "", `token_hash=${marker}`, "type=invite", `token_hash=${marker}&type=signup`,
    `token_hash=${marker}&type=invite&type=recovery`,
    `token_hash=${marker}&token_hash=other&type=invite`,
    "token_hash=%0Ainvalid&type=invite", "token_hash=" + "a".repeat(2049) + "&type=invite",
  ])("recusa parâmetros ausentes, ambíguos ou inválidos (%#)", async (query) => {
    const response = await GET(request(query));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(origin + "/entrar?erro=ligacao-invalida");
    expect(fixture.createClient).not.toHaveBeenCalled();
  });
  it("recusa ligação expirada/consumida sem revelar erro do fornecedor", async () => {
    fixture.verifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: { message: marker, status: 403 } });
    const response = await GET(request(`token_hash=${marker}&type=invite`));
    expect(response.headers.get("location")).toBe(origin + "/entrar?erro=ligacao-invalida");
    expect(await response.text()).not.toContain(marker);
  });
  it("não imprime excepções com URLs, cookies ou sessão", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    fixture.verifyOtp.mockRejectedValue(new Error("cookie=session; " + marker));
    const response = await GET(request(`token_hash=${marker}&type=recovery`));
    expect(response.headers.get("location")).toBe(origin + "/entrar?erro=ligacao-invalida");
    expect(error).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
  });
  it("não cria cliente quando Supabase está ausente", async () => {
    fixture.configured.mockReturnValue(false);
    await GET(request(`token_hash=${marker}&type=invite`));
    expect(fixture.createClient).not.toHaveBeenCalled();
  });
  it("sem APP_ORIGIN falha fechado, sem usar host ou verificar convite", async () => {
    vi.stubEnv("APP_ORIGIN", "");
    const response = await GET(request(`token_hash=${marker}&type=invite`));
    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await response.text()).not.toContain(marker);
    expect(fixture.createClient).not.toHaveBeenCalled();
  });
});

describe("PKCE no callback", () => {
  it("troca código no servidor, em contexto recovery e com cookies obrigatórios", async () => {
    const response = await GET(request("code=local-valid-code&next=https://attacker.invalid"));
    expect(fixture.exchange).toHaveBeenCalledExactlyOnceWith("local-valid-code");
    expect(fixture.verifyOtp).not.toHaveBeenCalled();
    expect(fixture.createClient).toHaveBeenCalledExactlyOnceWith({ requireCookieWrites: true });
    expect(response.headers.get("location")).toBe(origin + "/actualizar-palavra-passe");
    expect(response.cookies.get("gestor-password-setup")?.path).toBe("/actualizar-palavra-passe");
    expect(response.headers.get("location")).not.toContain("code=");
    expect(fixture.unsubscribe).toHaveBeenCalledOnce();
  });
  it.each([
    "code=", "code=a&code=b", `code=a&token_hash=${marker}&type=recovery`,
    "code=a&type=recovery", "code=a&access_token=local", "code=a&refresh_token=local",
    "code=a&error=local", "code=%0Ainvalid",
  ])("recusa parâmetros ambíguos ou sensíveis (%#)", async (query) => {
    const response = await GET(request(query));
    expect(response.headers.get("location")).toBe(origin + "/entrar?erro=ligacao-invalida");
    expect(fixture.createClient).not.toHaveBeenCalled();
  });
  it.each(["expired", "used", "missing-verifier"])("erro %s não permite fallback OTP ou grant", async (reason) => {
    fixture.exchange.mockResolvedValue({ data: { session: null, user: null }, error: { message: reason } });
    const response = await GET(request("code=local-valid-code"));
    expect(response.cookies.get("gestor-password-setup")).toBeUndefined();
    expect(response.headers.get("location")).toBe(origin + "/entrar?erro=ligacao-invalida");
    expect(fixture.verifyOtp).not.toHaveBeenCalled();
  });
  it("sessão SIGNED_IN normal não recebe autorização de recuperação", async () => {
    const session = localSession();
    fixture.exchange.mockResolvedValue({ data: { session, user: session.user, redirectType: null }, error: null });
    const response = await GET(request("code=local-signin-code"));
    expect(response.cookies.get("gestor-password-setup")).toBeUndefined();
    expect(response.headers.get("location")).toBe(origin + "/entrar?erro=ligacao-invalida");
  });
  it("excepção não revela código ou sessão", async () => {
    fixture.exchange.mockRejectedValue(new Error("local-private-code"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET(request("code=local-private-code"));
    expect(await response.text()).not.toContain("local-private-code");
    expect(response.cookies.get("gestor-password-setup")).toBeUndefined();
    expect(log).not.toHaveBeenCalled();
  });
  it("verificador alterado ou pedido não iniciado no portal não chega a Auth", async () => {
    fixture.getAll.mockReturnValue([{ name: "sb-fixture-auth-token-code-verifier", value: "other" }]);
    await GET(request("code=local-valid-code"));
    expect(fixture.createClient).not.toHaveBeenCalled();
    fixture.getCookie.mockReturnValue(undefined);
    await GET(request("code=local-valid-code"));
    expect(fixture.createClient).not.toHaveBeenCalled();
  });
  it("utilizador diferente do pedido de recuperação não recebe grant", async () => {
    const session = localSession();
    fixture.exchange.mockImplementation(async () => {
      fixture.listener?.("PASSWORD_RECOVERY");
      return { data: { session, user: { ...session.user, email: "other@example.invalid" } }, error: null };
    });
    const response = await GET(request("code=local-valid-code"));
    expect(response.cookies.get("gestor-password-setup")).toBeUndefined();
  });
});

describe("Validação de APP_ORIGIN", () => {
  it.each([
    "http://preview.example.invalid", "//preview.example.invalid", "javascript:alert(1)",
    "https://user:password@preview.example.invalid", "https://preview.example.invalid/path",
    "https://preview.example.invalid/?token_hash=local", "https://preview.example.invalid/#local",
    " https://preview.example.invalid", "https://preview.example.invalid ",
  ])("recusa origem insegura ou que contenha dados (%#)", (value) => {
    vi.stubEnv("APP_ORIGIN", value);
    expect(() => applicationOrigin()).toThrow();
  });
  it("aceita origem HTTPS sem caminho, incluindo barra final", () => {
    vi.stubEnv("APP_ORIGIN", origin + "/");
    expect(applicationOrigin()).toBe(origin);
  });
  it("HTTP local é exclusivo de desenvolvimento/teste", () => {
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3000");
    expect(applicationOrigin()).toBe("http://127.0.0.1:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => applicationOrigin()).toThrow();
  });
});
