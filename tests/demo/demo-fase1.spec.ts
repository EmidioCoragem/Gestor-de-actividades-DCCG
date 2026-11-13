import { join } from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const origin = "http://127.0.0.1:3120";
const departmentB = "Departamento B — Laboratório fictício";
const personB = "Bento Exemplo — pessoa fictícia";
const labels = {
  identificacao: "Identificação do cenário", utilizadores: "Utilizadores fictícios",
  estrutura: "Estrutura fictícia", historico: "Histórico fictício", permissoes: "Permissões ilustrativas",
};
const externalRequests = new WeakMap<Page, string[]>();
const url = (persona: string, pagina: keyof typeof labels) => `/demonstracao?persona=${persona}&pagina=${pagina}`;

test.beforeEach(async ({ context, page }) => {
  const attempts: string[] = [];
  externalRequests.set(page, attempts);
  await context.route("**/*", async route => {
    const target = new URL(route.request().url());
    if (target.origin !== origin) {
      attempts.push(`${target.protocol}//${target.hostname}`);
      await route.abort();
    } else await route.continue();
  });
});
test.afterEach(async ({ context, page }) => {
  expect(externalRequests.get(page)).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function capture(page: Page, info: TestInfo, scenario: string) {
  const directory = process.env.GESTOR_DEMO_ARTIFACT_DIR;
  if (directory) await page.screenshot({ path: join(directory, `demo-${scenario}-${info.project.name}.png`), fullPage: true });
}

test("entrada explicita ficção, oferece cinco cenários e não pede credenciais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Escolha um cenário de demonstração");
  await expect(page.getByText("Demonstração isolada — dados 100% fictícios", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Explorar cenário / })).toHaveCount(5);
  await expect(page.getByText("Seleccionar um cenário não inicia sessão.", { exact: true })).toBeVisible();
  await expect(page.locator("input, form, script")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar para o conteúdo" })).toBeFocused();
  await fits(page);
});

test("gestor percorre identificação, contas, estrutura, histórico e permissões apenas do Departamento A", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explorar cenário Gestor fictício do Departamento A", exact: true }).click();
  for (const section of Object.keys(labels) as (keyof typeof labels)[]) {
    await page.getByRole("navigation", { name: "Percurso da demonstração" }).getByRole("link", { name: new RegExp(`^${labels[section]}`) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(labels[section]);
    await expect(page.getByText(departmentB, { exact: false })).toHaveCount(0);
    await expect(page.getByText(personB, { exact: false })).toHaveCount(0);
    await expect(page.locator('nav a[aria-current="page"]')).toHaveCount(1);
    await fits(page);
    if (section === "estrutura") {
      await expect(page.getByRole("table")).toContainText("Responsável");
      await expect(page.getByRole("table")).toContainText("Chefia");
      if (info.project.name === "mobile") await capture(page, info, "gestor-estrutura");
    }
  }
  await page.getByRole("link", { name: "Encerrar demonstração", exact: true }).click();
  await expect(page).toHaveURL(`${origin}/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Escolha um cenário de demonstração");
});

test("leitor vê a estrutura A e o servidor recusa consultas administrativas directas", async ({ page }) => {
  const allowed = await page.goto(url("leitor", "estrutura"));
  expect(allowed?.status()).toBe(200);
  await expect(page.getByRole("table")).toContainText("Departamento A — Operações fictícias");
  await expect(page.getByText(departmentB, { exact: false })).toHaveCount(0);
  for (const section of ["utilizadores", "historico", "permissoes"] as const) {
    expect((await page.goto(url("leitor", section)))?.status()).toBe(403);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acesso recusado nesta demonstração");
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByText(personB, { exact: false })).toHaveCount(0);
  }
});

test("AT e AF mantêm percursos ilustrativos distintos, sem operações activas", async ({ page }, info) => {
  expect((await page.goto(url("at", "utilizadores")))?.status()).toBe(200);
  const technical = page.getByRole("table");
  await expect(technical.getByRole("columnheader")).toHaveCount(2);
  await expect(technical).not.toContainText("Departamento A");
  for (const section of ["estrutura", "historico", "permissoes"] as const)
    expect((await page.goto(url("at", section)))?.status()).toBe(403);
  expect((await page.goto(url("af", "permissoes")))?.status()).toBe(200);
  await expect(page.getByRole("table")).toContainText("access.manage");
  await expect(page.getByRole("table")).not.toContainText("users.manage");
  for (const button of await page.getByRole("button").all()) await expect(button).toBeDisabled();
  expect((await page.goto(url("af", "historico")))?.status()).toBe(200);
  await expect(page.getByRole("table")).toContainText("Ana Exemplo — pessoa fictícia");
  await expect(page.getByRole("table")).toContainText("Encerrada");
  await expect(page.getByRole("table")).toContainText("Actual");
  await expect(page.getByRole("table")).toContainText(departmentB);
  if (info.project.name === "desktop") await capture(page, info, "af-historico");
  await fits(page);
});

test("inactivo tem só metadados; todos os pedidos de dados administrativos são recusados", async ({ page }) => {
  expect((await page.goto(url("inactivo", "identificacao")))?.status()).toBe(200);
  await expect(page.getByRole("table")).toContainText("Inactivo");
  await expect(page.getByRole("table")).not.toContainText("Ana Exemplo");
  for (const section of ["utilizadores", "estrutura", "historico", "permissoes"] as const) {
    expect((await page.goto(url("inactivo", section)))?.status()).toBe(403);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acesso recusado nesta demonstração");
    await expect(page.getByRole("table")).toHaveCount(0);
  }
  await fits(page);
});

test("HTTP rejeita escrita inclusive em caminhos Auth/RPC, sem alterar o conteúdo fictício", async ({ request }) => {
  const before = await (await request.get(url("gestor", "historico"))).text();
  for (const method of ["POST", "PUT", "PATCH", "DELETE"])
    for (const path of ["/", url("af", "utilizadores"), "/auth/v1/token", "/rest/v1/rpc/admin_mutation"]) {
      const response = await request.fetch(path, { method, data: { name: "Conteúdo inteiramente fictício" } });
      expect(response.status()).toBe(405);
      expect(response.headers().allow).toBe("GET, HEAD");
      expect(response.headers()["set-cookie"]).toBeUndefined();
    }
  expect(await (await request.get(url("gestor", "historico"))).text()).toBe(before);
});

test("HTTP rejeita selectores inválidos, duplicados e tentativas de reflexão HTML", async ({ request }) => {
  for (const path of [
    "/demonstracao", "/demonstracao?persona=af", "/demonstracao?persona=af&pagina=unknown",
    "/demonstracao?persona=af&persona=at&pagina=estrutura", "/demonstracao?persona=gestor&pagina=estrutura&scope=global",
    "/demonstracao?persona=%3Cscript%3EDEMO_ATTACK%3C%2Fscript%3E&pagina=estrutura", "/?persona=af",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(400);
    expect(await response.text()).not.toContain("DEMO_ATTACK");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
  expect((await request.get("/auth/v1/token")).status()).toBe(404);
});

test("HTTP serve HTML/CSS local com CSP restritiva, sem cookies; HEAD não entrega corpo", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["cache-control"]).toBe("no-store");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["set-cookie"]).toBeUndefined();
  for (const directive of ["default-src 'none'", "script-src 'none'", "connect-src 'none'", "form-action 'none'", "frame-ancestors 'none'", "base-uri 'none'"])
    expect(headers["content-security-policy"]).toContain(directive);
  const head = await request.head("/");
  expect(head.status()).toBe(200);
  expect(await head.body()).toHaveLength(0);
  const css = await request.get("/demo.css");
  expect(css.status()).toBe(200);
  expect(css.headers()["content-type"]).toContain("text/css");
  expect(await css.text()).not.toMatch(/@import|https?:\/\//i);
});
