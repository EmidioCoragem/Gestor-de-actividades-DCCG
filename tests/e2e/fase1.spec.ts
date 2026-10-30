import { test, expect } from "@playwright/test";
import { modules } from "../../src/modules/catalog";
for (const slug of ["", ...modules.map((m) => m.slug)]) {
  test(`rota privada bloqueada sem Supabase: /${slug}`, async ({ page }) => {
    await page.goto(`/${slug}`);
    await expect(page).toHaveURL(/\/configuracao$/);
    await expect(
      page.getByRole("heading", { name: "Configuração necessária" }),
    ).toBeVisible();
    await expect(
      page.getByText("As rotas privadas estão protegidas.", { exact: false }),
    ).toBeVisible();
    await expect(page.locator(".brand-mark")).toHaveText("G");
    await expect(page.locator(".brand-mark")).toHaveCSS(
      "background-color",
      "rgb(16, 42, 67)",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
test("entrada sem registo público nem credenciais fictícias", async ({
  page,
}) => {
  await page.goto("/entrar");
  await expect(page).toHaveTitle("Entrar | Gestor de Actividades");
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Não existe registo público.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Correio electrónico")).toBeDisabled();
  await page
    .getByRole("link", { name: "Recuperar acesso", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recuperar acesso", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar instruções" }),
  ).toBeDisabled();
});
test("callback inválido não cria sessão", async ({ page }) => {
  await page.goto(
    "/auth/confirm?token_hash=invalid&type=signup&next=https://example.invalid",
  );
  await expect(page).toHaveURL(/\/entrar\?erro=ligacao-invalida$/);
});
test("actualização de palavra-passe não disponível sem configuração", async ({
  page,
}) => {
  await page.goto("/actualizar-palavra-passe");
  await expect(
    page.getByRole("button", { name: "Guardar palavra-passe" }),
  ).toBeDisabled();
});
