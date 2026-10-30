import { test, expect } from "@playwright/test";
import { modules } from "../../src/modules/catalog";
test("Dashboard explicita ausência de dados operacionais", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Autenticação, dados e processos ainda não implementados.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Sem dados", { exact: true })).toHaveCount(4);
});
for (const portalModule of modules) {
  test(`Navegação e estado inicial: ${portalModule.title}`, async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile")
      await page.getByRole("button", { name: "Abrir menu" }).click();
    const link = page
      .getByRole("navigation")
      .getByRole("link", { name: portalModule.title, exact: true });
    await link.click();
    await expect(page).toHaveURL(`/${portalModule.slug}`);
    await expect(
      page.getByRole("heading", { name: portalModule.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Funcionalidade ainda não implementada", { exact: true }),
    ).toBeVisible();
    if (testInfo.project.name === "mobile")
      await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(link).toHaveAttribute("aria-current", "page");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
test("Endereço desconhecido apresenta recuperação", async ({ page }) => {
  const response = await page.goto("/modulo-inexistente");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Voltar ao Dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
});
test("Identificação preparada sem inventar uma sessão", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("summary")
    .filter({ hasText: "Identificação do utilizador" })
    .click();
  await expect(
    page.getByText("Sem sessão autenticada", { exact: true }),
  ).toBeVisible();
  for (const label of [
    "Nome do utilizador",
    "Cargo",
    "Departamento",
    "Perfil funcional",
  ]) {
    await expect(
      page.locator(".user-panel dt").filter({ hasText: label }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "Terminar sessão" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Nenhum perfil está atribuído nesta versão.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("Cartões operacionais conduzem aos módulos previstos", async ({
  page,
}) => {
  await page.goto("/");
  const metrics = page.getByRole("region", {
    name: "Acompanhamento operacional",
    exact: true,
  });
  for (const [label, href] of [
    ["Actividades pendentes", "/actividades"],
    ["Validações pendentes", "/actividades"],
    ["Prazos a acompanhar", "/planeamento"],
    ["Fecho mensal", "/fecho-mensal"],
  ]) {
    await expect(
      metrics.getByRole("link").filter({
        has: page.getByRole("heading", { name: label, exact: true }),
      }),
    ).toHaveAttribute("href", href);
  }
});

test("Painel de identificação fecha com Escape e toque fora", async ({
  page,
}) => {
  await page.goto("/");
  const details = page.locator("details.user-identification");
  const summary = details.locator("summary");
  await summary.click();
  await expect(details).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(details).not.toHaveAttribute("open");
  await expect(summary).toBeFocused();
  await summary.click();
  await page
    .getByRole("heading", { name: "Áreas de trabalho", exact: true })
    .click();
  await expect(details).not.toHaveAttribute("open");
});
