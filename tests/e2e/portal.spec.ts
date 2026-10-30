import { test, expect } from "@playwright/test";
import { modules } from "../../src/modules/catalog";
test("Dashboard explicita ausência de dados operacionais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("Autenticação, dados e processos ainda não implementados.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Sem dados", { exact: true })).toHaveCount(4);
});
for (const portalModule of modules) {
  test(`Navegação e estado inicial: ${portalModule.title}`, async ({ page }, testInfo) => {
    await page.goto("/");
    if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Abrir menu" }).click();
    const link = page.getByRole("navigation").getByRole("link", { name: portalModule.title, exact: true });
    await link.click();
    await expect(page).toHaveURL(`/${portalModule.slug}`);
    await expect(page.getByRole("heading", { name: portalModule.title, exact: true })).toBeVisible();
    await expect(page.getByText("Funcionalidade ainda não implementada", { exact: true })).toBeVisible();
    if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(link).toHaveAttribute("aria-current", "page");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
test("Endereço desconhecido apresenta recuperação", async ({ page }) => {
  const response = await page.goto("/modulo-inexistente");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Voltar ao Dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
});
