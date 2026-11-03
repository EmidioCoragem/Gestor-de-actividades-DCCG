import { expect, test } from "@playwright/test";

// Só marcadores sintéticos, configuração Supabase vazia e sem seguir a origem HTTPS.
for (const type of ["invite", "recovery"]) {
  test(`confirmação ${type}: HTTPS canónico, sem token ou sessão no destino`, async ({ request }) => {
    const response = await request.get(`/auth/confirm?token_hash=local-test-only&type=${type}&next=https://attacker.invalid`, {
      maxRedirects: 0,
      headers: { "x-forwarded-host": "attacker.invalid", "x-forwarded-proto": "http" },
    });
    expect(response.status()).toBe(303);
    expect(response.headers().location).toBe("https://preview.example.invalid/entrar?erro=ligacao-invalida");
    expect(response.headers()["set-cookie"]).toBeUndefined();
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    expect(await response.text()).not.toContain("local-test-only");
  });
}
test("recuperação não envia pedidos Auth sem configuração", async ({ page }) => {
  const remote: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
      remote.push(url.hostname); await route.abort();
    } else await route.continue();
  });
  const response = await page.goto("/recuperar-acesso");
  await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeDisabled();
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  expect(remote).toEqual([]);
});
test("palavra-passe tem campos protegidos e permanece bloqueada sem sessão configurada", async ({ page }) => {
  const response = await page.goto("/actualizar-palavra-passe");
  for (const name of ["password", "confirmation"]) {
    const input = page.locator(`input[name="${name}"]`);
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveAttribute("autocomplete", "new-password");
    await expect(input).toHaveAttribute("minlength", "12");
  }
  await expect(page.getByRole("button", { name: "Guardar palavra-passe" })).toBeDisabled();
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  expect(await page.context().cookies()).toEqual([]);
});
