// Simulador exclusivo de testes. Não lê URL/chaves Supabase nem envia correio.
import { createServer as httpServer } from "node:http";
import { createServer as httpsServer } from "node:https";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { prepareAuthLocalApp, authLocalEnvironment } from "./auth-local-workspace.ts";

const dir = mkdtempSync(join(tmpdir(), "gestor-auth-local-"));
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const cert = join(dir, "cert.pem");
const key = join(dir, "key.pem");
let child;
let stopping = false;
const servers = [];
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const server of servers) server.close();
  process.exitCode = code;
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  if (child?.pid && child.exitCode === null && child.signalCode === null) {
    child.once("close", cleanup);
    child.kill("SIGTERM");
  } else cleanup();
}
process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());
try {
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes",
    "-keyout", key, "-out", cert, "-days", "1", "-subj", "/CN=localhost",
    "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"], { stdio: "ignore" });
} catch {
  stop(1);
  throw new Error("Não foi possível preparar o certificado temporário do simulador local.");
}

const user = {
  id: "50000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated",
  email: "at@example.invalid", email_confirmed_at: "2026-11-03T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, identities: [],
  created_at: "2026-11-03T00:00:00Z",
};
let state;
function reset() {
  state = { used: [], verifications: 0, recoveries: 0, exchanges: 0, updates: 0, logouts: 0, logoutFailed: false, flow: null };
}
reset();
function send(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}
const control = httpServer((req, res) => {
  // Prova do comportamento do browser, sem sessão, corpo ou credenciais registados.
  if (req.url === "/origin-probe" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" });
    return res.end('<!doctype html><html><body><form method="post" action="/origin-probe"><button>Enviar prova local</button></form></body></html>');
  }
  if (req.url === "/origin-probe" && req.method === "POST") {
    req.resume();
    const received = req.headers.origin;
    return send(res, 200, {
      origin: received === undefined ? "absent" : received === "null" ? "null" : received === "http://127.0.0.1:4344" ? "legitimate" : "forged",
      mode: req.headers["sec-fetch-mode"] ?? "absent",
    });
  }
  if (req.method === "POST" && req.url === "/reset") { reset(); return send(res, 200, { ok: true }); }
  if (req.method === "POST" && req.url === "/logout-failure") { state.logoutFailed = true; return send(res, 200, { ok: true }); }
  if (req.method === "POST" && req.url === "/expire") {
    if (state.flow) state.flow.expiresAt = 0;
    return send(res, 200, { ok: true });
  }
  // Simula ConfirmationURL padrão: verificação no serviço e retorno com code.
  // Só fluxo fictício, sem email/token real e apenas endereço loopback fixo.
  if (req.method === "GET" && req.url === "/verify") {
    if (!state.flow || state.flow.emailUsed) return send(res, 403, { error: "local_email_used" });
    state.flow.emailUsed = true;
    res.writeHead(303, { Location: state.flow.redirectTo + "?code=" + state.flow.code, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    return res.end();
  }
  if (req.method === "GET" && req.url === "/counts") {
    const { verifications, recoveries, exchanges, updates, logouts } = state;
    return send(res, 200, { verifications, recoveries, exchanges, updates, logouts });
  }
  send(res, 404, { error: "local_control_only" });
});
function session() {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = encode({ alg: "HS256", typ: "JWT" }) + "." + encode({ sub: user.id, session_id: "60000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", exp: now + 3600, iat: now }) + ".local-synthetic-signature";
  return { access_token: token, refresh_token: "local-synthetic-refresh", token_type: "bearer", expires_in: 3600, expires_at: now + 3600, user };
}
const auth = httpsServer({ cert: readFileSync(cert), key: readFileSync(key) }, async (req, res) => {
  // Não registar pedidos/corpos/cookies. O servidor aceita apenas endpoints fictícios.
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16384) return send(res, 413, { error: "local_body_limit" });
  }
  let body;
  try { body = raw ? JSON.parse(raw) : {}; }
  catch { return send(res, 400, { error: "local_json_error" }); }
  const path = new URL(req.url, "https://127.0.0.1:4343").pathname;
  if (path === "/auth/v1/verify" && req.method === "POST") {
    state.verifications++;
    const expected = "local-" + body.type + "-only";
    if (!["invite", "recovery"].includes(body.type) || body.token_hash !== expected || state.used.includes(expected))
      return send(res, 403, { code: "otp_expired", msg: "Local expired link" });
    state.used.push(expected);
    return send(res, 200, session());
  }
  if (path === "/auth/v1/recover" && req.method === "POST") {
    const redirectTo = new URL(req.url, "https://127.0.0.1:4343").searchParams.get("redirect_to");
    if (redirectTo !== "http://127.0.0.1:3100/auth/confirm" || body.code_challenge_method !== "s256" || !/^[A-Za-z0-9_-]{43}$/.test(body.code_challenge))
      return send(res, 400, { error: "local_invalid_pkce" });
    state.recoveries++;
    state.flow = { redirectTo, code: "local-pkce-code-" + state.recoveries, challenge: body.code_challenge, expiresAt: Date.now() + 300_000, emailUsed: false, used: false };
    return send(res, 200, {});
  }
  if (path === "/auth/v1/token" && req.method === "POST") {
    state.exchanges++;
    const flow = state.flow;
    if (!flow || flow.used || flow.expiresAt <= Date.now() || body.auth_code !== flow.code ||
        typeof body.code_verifier !== "string" || createHash("sha256").update(body.code_verifier).digest("base64url") !== flow.challenge)
      return send(res, 400, { code: "flow_state_expired", msg: "Local invalid PKCE code" });
    flow.used = true;
    return send(res, 200, session());
  }
  if (path === "/auth/v1/user" && req.method === "GET") {
    if (!req.headers.authorization) return send(res, 401, { msg: "Local missing session" });
    return send(res, 200, user);
  }
  if (path === "/auth/v1/user" && req.method === "PUT") {
    if (!req.headers.authorization || typeof body.password !== "string" || body.password.length < 12)
      return send(res, 400, { msg: "Local invalid update" });
    state.updates++; return send(res, 200, user);
  }
  if (path === "/auth/v1/logout" && req.method === "POST") {
    state.logouts++;
    if (state.logoutFailed) return send(res, 500, { msg: "Local logout failure" });
    res.writeHead(204); return res.end();
  }
  send(res, 404, { error: "local_fixture_endpoint_only" });
});
servers.push(auth, control);
for (const server of servers) server.on("error", () => { console.error("Porta do simulador local indisponível."); stop(1); });
await Promise.all([
  new Promise((resolve) => auth.listen(4343, "127.0.0.1", resolve)),
  new Promise((resolve) => control.listen(4344, "127.0.0.1", resolve)),
]);
if (!stopping) {
  let appDirectory;
  try { appDirectory = prepareAuthLocalApp(projectRoot, join(dir, "app")); }
  catch {
    console.error("Não foi possível preparar a cópia isolada do simulador.");
    stop(1);
  }
  if (appDirectory) {
    // Webpack permite resolver node_modules por symlink fora da cópia temporária.
    // O Next real conserva o seu bundler, .next, lock e ficheiros TypeScript.
    child = spawn(process.execPath, [join(projectRoot, "node_modules/next/dist/bin/next"), "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3100"], {
      cwd: appDirectory,
      stdio: "inherit",
      env: authLocalEnvironment(process.env, cert),
    });
    child.on("error", () => stop(1));
    child.on("exit", (code) => stop(code ?? 1));
  }
}
