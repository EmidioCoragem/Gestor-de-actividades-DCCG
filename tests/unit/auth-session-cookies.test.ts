import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const f = vi.hoisted(() => ({ create: vi.fn(), cookies: vi.fn(), set: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: f.create }));
vi.mock("next/headers", () => ({ cookies: f.cookies }));
import { createSupabaseServerClient } from "../../src/lib/supabase/server";
import { proxy } from "../../src/proxy";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("APP_ORIGIN", "https://approved-preview.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "local-public-placeholder");
  f.cookies.mockResolvedValue({ getAll: () => [], set: f.set });
});
afterEach(() => vi.unstubAllEnvs());
describe("Sessão SSR sem transportar tokens no redireccionamento", () => {
  it("configura cookies Secure/SameSite no HTTPS e preserva a escrita feita pelo SDK", async () => {
    await createSupabaseServerClient();
    const options = f.create.mock.calls[0][2];
    expect(options.auth.debug).toBe(false);
    expect(options.cookieOptions).toEqual({ secure: true, sameSite: "lax" });
    const attributes = { secure: true, sameSite: "lax", path: "/", maxAge: 60 };
    options.cookies.setAll([{ name: "local-test-session", value: "synthetic-only", options: attributes }]);
    expect(f.set).toHaveBeenCalledExactlyOnceWith("local-test-session", "synthetic-only", attributes);
  });
  it("cookies locais HTTP apenas em desenvolvimento/teste", async () => {
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3000");
    await createSupabaseServerClient();
    expect(f.create.mock.calls[0][2].cookieOptions.secure).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    await expect(createSupabaseServerClient()).rejects.toThrow();
  });
  it("não cria cliente com origem ausente", async () => {
    vi.stubEnv("APP_ORIGIN", "");
    await expect(createSupabaseServerClient()).rejects.toThrow();
    expect(f.create).not.toHaveBeenCalled();
  });
  it("proxy mantém cookies Secure na renovação atrás de origem interna HTTP", async () => {
    f.create.mockImplementation((_url, _key, options) => ({
      auth: { getUser: async () => {
        options.cookies.setAll([{ name: "local-test-session", value: "synthetic-only", options: { secure: options.cookieOptions.secure, sameSite: "lax", path: "/" } }]);
        return { data: { user: null }, error: null };
      } },
    }));
    const response = await proxy(new NextRequest("http://internal.invalid/actualizar-palavra-passe"));
    expect(f.create.mock.calls[0][2].cookieOptions).toEqual({ secure: true, sameSite: "lax" });
    expect(response.cookies.get("local-test-session")?.secure).toBe(true);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
