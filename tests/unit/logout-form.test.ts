import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AuthForm } from "../../src/components/auth-form";

it("logout não exige email/password e conserva o campo CSRF", () => {
  const html = renderToStaticMarkup(createElement(AuthForm, {
    mode: "logout", formOriginNonce: "a".repeat(64),
    action: async () => ({ message: "" }),
  }));
  expect(html).toContain("Terminar sessão e voltar à entrada");
  expect(html).toContain('name="gestor_form_origin"');
  expect(html).toContain('type="hidden"');
  expect(html).not.toContain('type="email"');
  expect(html).not.toContain('type="password"');
});
