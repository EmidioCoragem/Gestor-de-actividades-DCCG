import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localSession } from "./auth-fixtures";
const f = vi.hoisted(() => ({ cookies: vi.fn(), fetch: vi.fn(), set: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: f.cookies }));
import { createSupabaseServerClient } from "../../src/lib/supabase/server";

const jar = new Map<string, { name: string; value: string }>();
let events: string[];
let challenge: string;
beforeEach(() => {
  vi.resetAllMocks(); jar.clear(); events = []; challenge = "";
  vi.stubEnv("APP_ORIGIN", "https://approved-preview.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "local-public-placeholder");
  f.set.mockImplementation((name, value, options) => {
    events.push("cookie");
    if (options.maxAge === 0) jar.delete(name); else jar.set(name, { name, value });
  });
  f.cookies.mockResolvedValue({ getAll: () => [...jar.values()], set: f.set });
  f.fetch.mockImplementation(async (input, options) => {
    events.push("fetch");
    const url = new URL(String(input));
    if (url.origin !== "https://fixture.example.invalid") throw new Error("Apenas fixture");
    const body = JSON.parse(options.body);
    if (url.pathname === "/auth/v1/recover") {
      expect(body.code_challenge_method).toBe("s256");
      expect(body.code_challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(url.searchParams.get("redirect_to")).toBe("https://approved-preview.example.invalid/auth/confirm");
      challenge = body.code_challenge;
      return Response.json({});
    }
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "pkce") {
      expect(body.auth_code).toBe("local-valid-code");
      expect(createHash("sha256").update(body.code_verifier).digest("base64url")).toBe(challenge);
      return Response.json(localSession());
    }
    throw new Error("Endpoint fictício inesperado");
  });
  vi.stubGlobal("fetch", f.fetch);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("SDK real com transporte fictício: PKCE e Set-Cookie", () => {
  it("grava verificador antes do pedido e recupera-o num novo cliente SSR", async () => {
    const initial = await createSupabaseServerClient({ requireCookieWrites: true });
    const request = await initial.auth.resetPasswordForEmail("at@example.invalid", {
      redirectTo: "https://approved-preview.example.invalid/auth/confirm",
    });
    expect(request.error).toBeNull();
    expect(events.indexOf("cookie")).toBeLessThan(events.indexOf("fetch"));
    expect([...jar.keys()].some((key) => key.endsWith("-code-verifier"))).toBe(true);
    expect(f.set.mock.calls[0][2]).toMatchObject({ secure: true, sameSite: "lax" });
    const callback = await createSupabaseServerClient({ requireCookieWrites: true });
    const eventsAuth: string[] = [];
    const { data: { subscription } } = callback.auth.onAuthStateChange((event) => { eventsAuth.push(event); });
    const result = await callback.auth.exchangeCodeForSession("local-valid-code");
    subscription.unsubscribe();
    expect(result.error).toBeNull();
    expect(eventsAuth).toContain("PASSWORD_RECOVERY");
    expect(jar.has("sb-fixture-auth-token-code-verifier")).toBe(false);
    expect([...jar.keys()].some((key) => key.includes("auth-token"))).toBe(true);
    expect(f.fetch).toHaveBeenCalledTimes(2);
  });
  it("falha de Set-Cookie impede o pedido de recuperação", async () => {
    f.set.mockImplementation(() => { throw new Error("local cookie failure"); });
    const client = await createSupabaseServerClient({ requireCookieWrites: true });
    await expect(client.auth.resetPasswordForEmail("at@example.invalid")).rejects.toThrow("guardar a sessão");
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it("ausência de verificador não chega a trocar código no serviço Auth", async () => {
    const client = await createSupabaseServerClient({ requireCookieWrites: true });
    const result = await client.auth.exchangeCodeForSession("local-valid-code");
    expect(result.error?.code).toBe("pkce_code_verifier_not_found");
    expect(f.fetch).not.toHaveBeenCalled();
  });
});
