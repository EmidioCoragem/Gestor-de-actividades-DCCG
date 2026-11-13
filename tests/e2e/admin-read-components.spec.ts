import { readFileSync } from "node:fs";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, type Page } from "@playwright/test";
import { AdminLoading, AdminReadState } from "../../src/components/admin/read-state";
import { SelectField } from "../../src/components/admin/fields";
import { readStateMessage } from "../../src/modules/access/read-state";

// Presentação dos componentes reais, sem login, App Router ou PostgREST fictício.
// O CSS próprio é reutilizado; o import de build Tailwind não é um recurso HTTP.
const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8")
  .replace(/^@import\s+"tailwindcss";\s*/, "");

async function present(page: Page, children: ReactNode) {
  await page.route("**/*", route => route.abort());
  const html = renderToStaticMarkup(createElement("main", null, children));
  await page.setContent(`<!doctype html><html lang="pt-AO"><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
}

test("componentes: vazio, recusa e indisponibilidade permanecem distinguíveis", async ({ page }) => {
  const empty = "Sem relações visíveis no âmbito autorizado.";
  await present(page, createElement(Fragment, null,
    ...(["empty", "refused", "unavailable"] as const).map(status => {
      const props = { key: status, status, children: readStateMessage(status, "chefias", empty) };
      return createElement(AdminReadState, props);
    }),
  ));
  const states = page.getByRole("status");
  await expect(states).toHaveCount(3);
  await expect(states.nth(0)).toHaveText(empty);
  await expect(states.nth(1)).toContainText("recusada");
  await expect(states.nth(2)).toContainText("indisponível");
  for (const state of await states.all()) {
    await expect(state).toBeVisible();
    await expect(state).toHaveAttribute("aria-live", "polite");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("componentes: carregamento anuncia espera sem antecipar dados pessoais ou resultados", async ({ page }) => {
  await present(page, createElement(AdminLoading));
  await expect(page.getByRole("status")).toHaveText("A carregar informação…");
  await expect(page.getByRole("status")).toHaveAttribute("aria-atomic", "true");
  await expect(page.locator("table, input, select")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("componentes: selector de unidade superior tem etiqueta e acesso por teclado sem sugerir poder global", async ({ page }) => {
  await present(page, createElement(SelectField, {
    name: "parent_id", label: "Unidade superior", optional: true,
    optionalLabel: "Sem unidade superior (raiz autorizada)",
    options: [{ value: "synthetic-department", label: "Departamento fictício autorizado" }],
  }));
  const select = page.getByRole("combobox", { name: "Unidade superior" });
  await expect(select).toBeVisible();
  await expect(select.locator("option").first()).toHaveText("Sem unidade superior (raiz autorizada)");
  await expect(page.getByText("âmbito global", { exact: false })).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(select).toBeFocused();
  await select.selectOption("synthetic-department");
  await expect(select).toHaveValue("synthetic-department");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
