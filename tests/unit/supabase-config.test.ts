import { describe, expect, it } from "vitest";
import { readSupabaseConfig } from "../../src/lib/supabase/config";
describe("Configuração Supabase opcional na Fase 0", () => {
  it("permite ausência de credenciais sem criar ligação", () => { expect(readSupabaseConfig(undefined, undefined)).toBeNull(); });
  it("rejeita configuração parcial", () => { expect(() => readSupabaseConfig("https://example.supabase.co", undefined)).toThrow(); });
  it.each(["http://example.supabase.co", "inválido"])("rejeita URL inseguro ou inválido: %s", (url) => { expect(() => readSupabaseConfig(url, "public-test-only")).toThrow(); });
  it("aceita configuração pública completa", () => { expect(readSupabaseConfig("https://example.supabase.co", "public-test-only")).toEqual({ url: "https://example.supabase.co", key: "public-test-only" }); });
});
