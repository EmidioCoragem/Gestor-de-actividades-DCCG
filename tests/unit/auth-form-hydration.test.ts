import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AuthForm } from "../../src/components/auth-form";

it.each(["login", "recovery", "password", "logout"] as const)("SSR %s não permite submissão antes da hidratação", mode => {
  const html = renderToStaticMarkup(createElement(AuthForm, {
    mode, formOriginNonce: "a".repeat(64), action: async () => ({ message: "" }),
  }));
  const controls = [...html.matchAll(/<(input|button)\b([^>]*)>/g)]
    .filter(([, , attributes]) => !attributes.includes('type="hidden"'));
  expect(controls.length).toBeGreaterThan(0);
  for (const [, , attributes] of controls) expect(attributes).toContain('disabled=""');
  expect(html).toContain("Active o JavaScript para utilizar este formulário.");
  // A prova CSRF continua serializável; não é removida nem desactivada.
  expect(html).toContain('name="gestor_form_origin"');
  expect(html).toContain('value="' + "a".repeat(64) + '"');
});
