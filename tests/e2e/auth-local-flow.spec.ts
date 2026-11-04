import { test, expect } from "@playwright/test";

// Toda a identidade/sessão é fictícia. O servidor Auth é loopback, não Supabase.
test.beforeEach(async ({ request, page }) => {
  await request.post("http://127.0.0.1:4344/reset");
  await page.route("**/*", async (route) => {
    if (!["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname))
      await route.abort();
    else await route.continue();
  });
});
for (const type of ["invite", "recovery"]) {
  test(`${type}: verifica no servidor, define palavra-passe e termina sessão local`, async ({ page, request }) => {
    await page.goto(`/auth/confirm?token_hash=local-${type}-only&type=${type}`);
    await expect(page).toHaveURL("http://127.0.0.1:3100/actualizar-palavra-passe");
    await expect(page.getByRole("button", { name: "Guardar palavra-passe" })).toBeEnabled();
    await page.getByLabel("Palavra-passe", { exact: true }).fill("Local-Test-Password-123");
    await page.getByLabel("Confirmar palavra-passe").fill("Local-Test-Password-123");
    await page.getByRole("button", { name: "Guardar palavra-passe" }).click();
    await expect(page).toHaveURL(/\/entrar\?mensagem=palavra-passe-actualizada$/);
    expect((await page.context().cookies()).filter((c) => c.name.startsWith("sb-"))).toEqual([]);
    expect(await (await request.get("http://127.0.0.1:4344/counts")).json()).toEqual({ verifications: 1, recoveries: 0, exchanges: 0, updates: 1, logouts: 1 });
    expect((await page.context().cookies()).some((cookie) => cookie.name === "gestor-password-setup")).toBe(false);
  });
}
test("recuperação mostra resposta genérica e não envia email", async ({ page, request }) => {
  await page.goto("/recuperar-acesso");
  await page.getByLabel("Correio electrónico").fill("at@example.invalid");
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se existir uma conta autorizada");
  const counts = await (await request.get("http://127.0.0.1:4344/counts")).json();
  expect(counts.recoveries).toBe(1); expect(counts.updates).toBe(0);
});
test("sem sessão válida não permite definir palavra-passe", async ({ page, request }) => {
  await page.goto("/actualizar-palavra-passe");
  await page.getByLabel("Palavra-passe", { exact: true }).fill("Local-Test-Password-123");
  await page.getByLabel("Confirmar palavra-passe").fill("Local-Test-Password-123");
  await page.getByRole("button", { name: "Guardar palavra-passe" }).click();
  await expect(page.getByRole("status")).toContainText("A ligação expirou");
  expect((await (await request.get("http://127.0.0.1:4344/counts")).json()).updates).toBe(0);
});
test("ligação inválida não transporta erro/token para o destino", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=local-expired-only&type=recovery");
  await expect(page).toHaveURL("http://127.0.0.1:3100/entrar?erro=ligacao-invalida");
});
test("ligação consumida não é aceite uma segunda vez", async ({ page }) => {
  const link = "/auth/confirm?token_hash=local-invite-only&type=invite";
  await page.goto(link);
  await expect(page).toHaveURL(/\/actualizar-palavra-passe$/);
  await page.goto(link);
  await expect(page).toHaveURL(/\/entrar\?erro=ligacao-invalida$/);
});

test("PKCE padrão: Server Action grava verificador, código estabelece sessão e password termina sessão", async ({ page, request }) => {
  await page.goto("/recuperar-acesso");
  await page.getByLabel("Correio electrónico").fill("at@example.invalid");
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se existir uma conta autorizada");
  expect((await page.context().cookies()).some((cookie) => cookie.name.endsWith("auth-token-code-verifier"))).toBe(true);
  await page.goto("http://127.0.0.1:4344/verify");
  await expect(page).toHaveURL("http://127.0.0.1:3100/actualizar-palavra-passe");
  const grant = (await page.context().cookies()).find((cookie) => cookie.name === "gestor-password-setup");
  expect(grant?.httpOnly).toBe(true);
  expect(grant?.path).toBe("/actualizar-palavra-passe");
  await page.getByLabel("Palavra-passe", { exact: true }).fill("Local-Test-Password-123");
  await page.getByLabel("Confirmar palavra-passe").fill("Local-Test-Password-123");
  await page.getByRole("button", { name: "Guardar palavra-passe" }).click();
  await expect(page).toHaveURL(/\/entrar\?mensagem=palavra-passe-actualizada$/);
  const counts = await (await request.get("http://127.0.0.1:4344/counts")).json();
  expect(counts).toEqual({ verifications: 0, recoveries: 1, exchanges: 1, updates: 1, logouts: 1 });
});

test("PKCE sem verificador ou com código expirado não dá acesso à password", async ({ page, request, browser }) => {
  await page.goto("/recuperar-acesso");
  await page.getByLabel("Correio electrónico").fill("at@example.invalid");
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se existir uma conta autorizada");
  const other = await browser.newContext();
  try {
    const foreign = await other.newPage();
    await foreign.goto("http://127.0.0.1:3100/auth/confirm?code=local-pkce-code-1");
    await expect(foreign).toHaveURL(/\/entrar\?erro=ligacao-invalida$/);
  } finally { await other.close(); }
  expect((await (await request.get("http://127.0.0.1:4344/counts")).json()).exchanges).toBe(0);
  await request.post("http://127.0.0.1:4344/expire");
  await page.goto("http://127.0.0.1:4344/verify");
  await expect(page).toHaveURL(/\/entrar\?erro=ligacao-invalida$/);
  expect((await (await request.get("http://127.0.0.1:4344/counts")).json()).updates).toBe(0);
});

test("PKCE código consumido não é trocado outra vez", async ({ page, request }) => {
  await page.goto("/recuperar-acesso");
  await page.getByLabel("Correio electrónico").fill("at@example.invalid");
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se existir uma conta autorizada");
  await page.goto("http://127.0.0.1:4344/verify");
  await expect(page).toHaveURL(/\/actualizar-palavra-passe$/);
  await page.goto("/auth/confirm?code=local-pkce-code-1");
  await expect(page).toHaveURL(/\/entrar\?erro=ligacao-invalida$/);
  expect((await (await request.get("http://127.0.0.1:4344/counts")).json()).updates).toBe(0);
});

test("sessão autenticada sem grant não permite alterar password", async ({ page, request }) => {
  await page.goto("/auth/confirm?token_hash=local-recovery-only&type=recovery");
  await expect(page).toHaveURL(/\/actualizar-palavra-passe$/);
  await page.context().clearCookies({ name: "gestor-password-setup" });
  await page.getByLabel("Palavra-passe", { exact: true }).fill("Local-Test-Password-123");
  await page.getByLabel("Confirmar palavra-passe").fill("Local-Test-Password-123");
  await page.getByRole("button", { name: "Guardar palavra-passe" }).click();
  await expect(page.getByRole("status")).toContainText("A ligação expirou");
  expect((await (await request.get("http://127.0.0.1:4344/counts")).json()).updates).toBe(0);
});

test("confirmação diferente não consome a autorização PKCE", async ({ page, request }) => {
  await page.goto("/recuperar-acesso");
  await page.getByLabel("Correio electrónico").fill("at@example.invalid");
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se existir uma conta autorizada");
  await page.goto("http://127.0.0.1:4344/verify");
  await expect(page).toHaveURL(/\/actualizar-palavra-passe$/);
  await page.getByLabel("Palavra-passe", { exact: true }).fill("Local-Test-Password-123");
  await page.getByLabel("Confirmar palavra-passe").fill("Local-Test-Password-456");
  await page.getByRole("button", { name: "Guardar palavra-passe" }).click();
  await expect(page.getByRole("status")).toContainText("confirme a mesma palavra-passe");
  expect((await (await request.get("http://127.0.0.1:4344/counts")).json()).updates).toBe(0);
  // A resposta da Server Action limpa os campos não controlados do formulário.
  // Uma nova tentativa tem de preencher ambos; required impediria a submissão
  // se apenas a confirmação fosse preenchida de novo.
  await expect(page.getByLabel("Palavra-passe", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Confirmar palavra-passe")).toHaveValue("");
  await page.getByLabel("Palavra-passe", { exact: true }).fill("Local-Test-Password-123");
  await page.getByLabel("Confirmar palavra-passe").fill("Local-Test-Password-123");
  await page.getByRole("button", { name: "Guardar palavra-passe" }).click();
  await expect(page).toHaveURL(/\/entrar\?mensagem=palavra-passe-actualizada$/);
});
