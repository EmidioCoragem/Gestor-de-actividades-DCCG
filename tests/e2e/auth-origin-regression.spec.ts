import { expect, test } from "@playwright/test";
const control = "http://127.0.0.1:4344";

test("origem: no-referrer produz null no POST nativo, mas não no fetch legítimo", async ({ browser }) => {
  const native = await browser.newContext({ javaScriptEnabled: false });
  const page = await native.newPage();
  const document = await page.goto(control + "/origin-probe");
  expect(document?.headers()["referrer-policy"]).toBe("no-referrer");
  const response = page.waitForResponse(r => r.request().method() === "POST");
  await page.getByRole("button", { name: "Enviar prova local" }).click();
  expect(await (await response).json()).toEqual({ origin: "null", mode: "navigate" });
  await native.close();
  const scripted = await browser.newContext();
  const js = await scripted.newPage(); await js.goto(control + "/origin-probe");
  expect(await js.evaluate(async () => (await fetch(location.href, { method: "POST", body: "local-proof" })).json()))
    .toEqual({ origin: "legitimate", mode: "cors" });
  await scripted.close();
});

test("hidratação: formulário SSR sem JavaScript permanece bloqueado", async ({ browser, request }) => {
  await request.post(control + "/reset");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto("http://127.0.0.1:3100/recuperar-acesso");
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeDisabled();
  expect((await (await request.get(control + "/counts")).json()).recoveries).toBe(0);
  await context.close();
});

test("hidratação: scripts atrasados não permitem POST nativo e depois usam origem legítima", async ({ page, request }) => {
  await request.post(control + "/reset");
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/_next/**", async route => {
    if (route.request().resourceType() === "script") await gate;
    await route.continue();
  });
  const posts: { origin: string; transport: string; action: boolean }[] = [];
  page.on("request", req => {
    if (req.method() === "POST" && new URL(req.url()).pathname === "/recuperar-acesso") {
      const headers = req.headers();
      posts.push({ origin: headers.origin === "http://127.0.0.1:3100" ? "legitimate" : "unexpected", transport: req.resourceType(), action: Boolean(headers["next-action"]) });
    }
  });
  try {
    await page.goto("/recuperar-acesso", { waitUntil: "commit" });
    await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeDisabled();
    await expect(page.getByLabel("Correio electrónico")).toBeDisabled();
    expect(posts).toEqual([]);
  } finally { release(); }
  await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeEnabled();
  await page.getByLabel("Correio electrónico").fill("at@example.invalid");
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se existir uma conta autorizada");
  expect(posts).toEqual([{ origin: "legitimate", transport: "fetch", action: true }]);
  expect((await (await request.get(control + "/counts")).json()).recoveries).toBe(1);
});

for (const origin of [undefined, "null", "https://forged.invalid"]) {
  test(`origem: POST Auth ${origin ?? "ausente"} é recusado antes do SDK`, async ({ request }) => {
    await request.post(control + "/reset");
    const response = await request.post("/recuperar-acesso", {
      headers: { ...(origin === undefined ? {} : { origin }), "sec-fetch-site": "same-origin" },
      form: { email: "at@example.invalid" },
    });
    expect(response.status()).toBe(403);
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    expect(await (await request.get(control + "/counts")).json())
      .toEqual({ verifications: 0, recoveries: 0, exchanges: 0, updates: 0, logouts: 0 });
  });
}
