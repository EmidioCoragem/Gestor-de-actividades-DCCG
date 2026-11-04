import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localSession, localUserId } from "./auth-fixtures";
const f = vi.hoisted(() => ({
  create: vi.fn(), configured: vi.fn(), recover: vi.fn(), getUser: vi.fn(),
  update: vi.fn(), signOut: vi.fn(), redirect: vi.fn(), getSession: vi.fn(), getCookie: vi.fn(), setCookie: vi.fn(), getAll: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: f.getCookie, set: f.setCookie, getAll: f.getAll }) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: f.create }));
vi.mock("next/navigation", () => ({ redirect: f.redirect }));
vi.mock("@/modules/auth/environment", async (original) => ({
  ...await original<typeof import("../../src/modules/auth/environment")>(),
  supabaseIsConfigured: f.configured,
}));
import { changePassword, recoverAccess } from "../../src/modules/auth/actions";
import { issuePasswordSetup, sessionIdentity } from "../../src/modules/auth/password-setup";
const origin = "https://approved-preview.example.invalid";
const password = "Local-Synthetic-Only-123";
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_ORIGIN", origin);
  f.configured.mockReturnValue(true);
  f.create.mockResolvedValue({ auth: { resetPasswordForEmail: f.recover, getUser: f.getUser, getSession: f.getSession, updateUser: f.update, signOut: f.signOut } });
  const session = localSession();
  f.getUser.mockResolvedValue({ data: { user: session.user }, error: null });
  f.getSession.mockResolvedValue({ data: { session }, error: null });
  const grant = issuePasswordSetup(sessionIdentity(session.access_token, localUserId)!, "recovery");
  f.getCookie.mockReturnValue({ value: grant.nonce });
  f.getAll.mockReturnValue([{ name: "sb-fixture-auth-token-code-verifier", value: "synthetic-verifier" }]);
  f.recover.mockResolvedValue({ error: null });
  f.update.mockResolvedValue({ error: null });
  f.signOut.mockResolvedValue({ error: null });
  f.redirect.mockImplementation(() => { throw new Error("LOCAL_REDIRECT"); });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Recuperação sem enviar correio real", () => {
  it("usa somente origem configurada e rota de confirmação", async () => {
    const result = await recoverAccess({ message: "" }, form({ email: "at@example.invalid", redirectTo: "https://attacker.invalid" }));
    expect(f.recover).toHaveBeenCalledExactlyOnceWith("at@example.invalid", { redirectTo: origin + "/auth/confirm" });
    expect(f.create).toHaveBeenCalledExactlyOnceWith({ requireCookieWrites: true });
    expect(result.success).toBe(true);
  });
  it("não distingue endereço existente, limite ou erro de transporte", async () => {
    const data = form({ email: "at@example.invalid" });
    const ok = await recoverAccess({ message: "" }, data);
    f.recover.mockResolvedValue({ error: { message: "local provider detail" } });
    expect(await recoverAccess({ message: "" }, data)).toEqual(ok);
    f.recover.mockRejectedValue(new Error("local provider detail"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await recoverAccess({ message: "" }, data)).toEqual(ok);
    expect(log).not.toHaveBeenCalled();
  });
  it("origem ausente não envia nem cria cliente", async () => {
    vi.stubEnv("APP_ORIGIN", "");
    await recoverAccess({ message: "" }, form({ email: "at@example.invalid" }));
    expect(f.create).not.toHaveBeenCalled();
  });
  it("endereço inválido não chega ao fornecedor", async () => {
    await recoverAccess({ message: "" }, form({ email: "invalid" }));
    expect(f.create).not.toHaveBeenCalled();
  });
  it("só cria intenção HttpOnly depois de o SDK conservar o verificador", async () => {
    await recoverAccess({ message: "" }, form({ email: "at@example.invalid" }));
    expect(f.setCookie).toHaveBeenCalledWith("gestor-recovery-request", expect.any(String), expect.objectContaining({ httpOnly: true, secure: true, path: "/auth/confirm" }));
    f.setCookie.mockClear();
    f.getAll.mockReturnValue([]);
    const result = await recoverAccess({ message: "" }, form({ email: "at@example.invalid" }));
    expect(result.message).toContain("Se existir uma conta autorizada");
    expect(f.setCookie).not.toHaveBeenCalled();
  });
});

describe("Definição de palavra-passe sem privilégios funcionais", () => {
  it.each([
    { password: "short", confirmation: "short" },
    { password, confirmation: password + "different" },
  ])("recusa palavra-passe inválida (%#)", async (values) => {
    await changePassword({ message: "" }, form(values));
    expect(f.create).not.toHaveBeenCalled();
  });
  it("sem sessão não actualiza nem termina sessão", async () => {
    f.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await changePassword({ message: "" }, form({ password, confirmation: password }));
    expect(result.message).toContain("expirou");
    expect(f.update).not.toHaveBeenCalled(); expect(f.signOut).not.toHaveBeenCalled();
  });
  it("erro de verificação da sessão impede alteração", async () => {
    f.getUser.mockResolvedValue({ data: { user: { id: "local" } }, error: { message: "invalid" } });
    await changePassword({ message: "" }, form({ password, confirmation: password }));
    expect(f.update).not.toHaveBeenCalled();
  });
  it("actualiza apenas a palavra-passe, termina sessão e redirecciona sem dados", async () => {
    await expect(changePassword({ message: "" }, form({ password, confirmation: password }))).rejects.toThrow("LOCAL_REDIRECT");
    expect(f.update).toHaveBeenCalledExactlyOnceWith({ password });
    expect(f.signOut).toHaveBeenCalledOnce();
    expect(f.redirect).toHaveBeenCalledExactlyOnceWith("/entrar?mensagem=palavra-passe-actualizada");
    expect(f.getUser.mock.invocationCallOrder[0]).toBeLessThan(f.update.mock.invocationCallOrder[0]);
    expect(f.update.mock.invocationCallOrder[0]).toBeLessThan(f.signOut.mock.invocationCallOrder[0]);
  });
  it("falha de actualização não produz sucesso ou logout", async () => {
    f.update.mockResolvedValue({ error: { message: password } });
    const result = await changePassword({ message: "" }, form({ password, confirmation: password }));
    expect(result.message).not.toContain(password);
    expect(f.signOut).not.toHaveBeenCalled(); expect(f.redirect).not.toHaveBeenCalled();
  });
  it("falha de logout não declara sessão terminada", async () => {
    f.signOut.mockResolvedValue({ error: { message: "local" } });
    const result = await changePassword({ message: "" }, form({ password, confirmation: password }));
    expect(result.message).toContain("não foi possível terminar");
    expect(f.redirect).not.toHaveBeenCalled();
  });
  it("excepção não revela palavra-passe ou erro do fornecedor", async () => {
    f.update.mockRejectedValue(new Error(password));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await changePassword({ message: "" }, form({ password, confirmation: password }));
    expect(result.message).not.toContain(password); expect(log).not.toHaveBeenCalled();
  });
  it("sessão autenticada normal sem grant não altera password", async () => {
    f.getCookie.mockReturnValue(undefined);
    const result = await changePassword({ message: "" }, form({ password, confirmation: password }));
    expect(result.message).toContain("expirou");
    expect(f.update).not.toHaveBeenCalled();
  });
  it("grant é de uso único mesmo quando updateUser falha", async () => {
    f.update.mockResolvedValue({ error: { message: "local" } });
    const data = form({ password, confirmation: password });
    await changePassword({ message: "" }, data);
    await changePassword({ message: "" }, data);
    expect(f.update).toHaveBeenCalledOnce();
    expect(f.setCookie).toHaveBeenCalledWith("gestor-password-setup", "", expect.objectContaining({ httpOnly: true, secure: true, maxAge: 0 }));
  });
});
