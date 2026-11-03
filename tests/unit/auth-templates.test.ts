import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../../next.config";

describe("Modelos e protecção de dados Auth", () => {
  it.each([["invite", "invite"], ["recovery", "recovery"]])("modelo %s usa confirmação servidor, também no painel", (file, type) => {
    const html = readFileSync(`supabase/templates/${file}.html`, "utf8");
    expect(html).toContain(`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}`);
    expect(html).not.toContain(".ConfirmationURL");
    expect(html).not.toContain(".RedirectTo");
    expect(html).not.toContain("access_token");
  });
  it("desactiva logs de desenvolvimento, incluindo argumentos e URLs", () => {
    expect(config.logging).toBe(false);
    expect(config.experimental?.serverActions).toBeTruthy();
    const actions = config.experimental?.serverActions;
    if (typeof actions === "object") {
      expect(actions.allowedOrigins?.some((host) => host.includes("*"))).toBe(false);
    }
  });
  it("páginas Auth não enviam Referer e pedem não armazenamento", async () => {
    const headers = await config.headers!();
    for (const source of ["/auth/confirm", "/actualizar-palavra-passe", "/recuperar-acesso", "/entrar"]) {
      const rule = headers.find((r) => r.source === source);
      expect(rule?.headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
      expect(rule?.headers.some((h) => h.key === "Cache-Control" && h.value.includes("no-store"))).toBe(true);
    }
  });
});
