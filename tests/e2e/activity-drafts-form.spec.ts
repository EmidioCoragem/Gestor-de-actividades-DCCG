import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

test.skip(process.env.GESTOR_F01_FORM_TEST !== "1", "Harness fictício opt-in, separado do portal e de Auth");
test.beforeEach(async ({ page, request }) => {
  await request.post("/qa-f01/control", { data: { mode: "success" } });
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:3122") throw new Error("Pedido externo bloqueado no ensaio fictício");
    await route.continue();
  });
});
async function fill(page: import("@playwright/test").Page) {
  await page.goto("/qa-f01");
  await expect(page.getByRole("button", { name: "Guardar rascunho" })).toBeEnabled();
  await page.getByLabel("Título", { exact: true }).fill("X".repeat(200));
  await page.getByLabel("Descrição (opcional)").fill("Descrição inteiramente fictícia");
  await page.getByRole("combobox", { name: "Unidade responsável", exact: true }).selectOption("b1000000-0000-4000-8000-000000000002");
}
test("formulário real hidratado: teclado, pending e submissão duplicada", async ({ page, request }) => {
  await fill(page);
  await page.getByRole("button", { name: "Guardar rascunho" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "A guardar…" })).toBeDisabled();
  await page.locator("form").evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByRole("link", { name: "Consultar rascunho guardado" })).toBeVisible();
  const state = await (await request.get("/qa-f01/control")).json();
  expect(state.calls).toHaveLength(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("resultado incerto conserva conteúdo e chave numa repetição explícita", async ({ page, request }) => {
  await request.post("/qa-f01/control", { data: { mode: "uncertain" } });
  await fill(page);
  const key = await page.locator('[name="request_id"]').inputValue();
  await page.getByRole("button", { name: "Guardar rascunho" }).click();
  await expect(page.getByRole("button", { name: "Repetir o mesmo pedido" })).toBeEnabled();
  await expect(page.getByLabel("Título", { exact: true })).toHaveAttribute("readonly", "");
  await expect(page.getByRole("combobox", { name: "Unidade responsável", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Repetir o mesmo pedido" }).click();
  await expect(page.getByRole("link", { name: "Consultar rascunho guardado" })).toBeVisible();
  const state = await (await request.get("/qa-f01/control")).json();
  expect(state.calls).toHaveLength(2); expect(state.calls[1]).toEqual(state.calls[0]);
  expect(state.calls[0].request_id).toBe(key);
});
test("conflito impede repetição e ausência de unidades bloqueia o componente", async ({ page, request }) => {
  await request.post("/qa-f01/control", { data: { mode: "conflict" } });
  await fill(page); await page.getByRole("button", { name: "Guardar rascunho" }).click();
  await expect(page.getByRole("button", { name: "Guardar rascunho" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Conflito fictício");
  await page.goto("/qa-f01?empty=1");
  await expect(page.getByRole("button", { name: "Guardar rascunho" })).toBeDisabled();
});
test("SSR real: listagem, detalhe longo e estados sem overflow nem falsas acções", async ({ page }) => {
  for (const state of ["list", "detail", "empty", "refused", "unavailable", "loading"]) {
    await page.setContent(readFileSync(join(process.env.GESTOR_F01_SSR_DIR!, `${state}.html`), "utf8"));
    await expect(page.locator("main")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (state === "detail") await expect(page.getByRole("heading", { level: 1 })).toHaveText("X".repeat(200));
    if (["empty", "refused", "unavailable", "loading"].includes(state)) await expect(page.getByRole("button", { name: "Guardar rascunho" })).toHaveCount(0);
  }
});
