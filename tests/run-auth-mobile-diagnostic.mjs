// Opt-in: uma única execução fictícia instrumentada numa cópia descartável.
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { prepareAuthLocalApp } from "./fixtures/auth-local-workspace.ts";

const events = new Set([
  "script-request", "script-response", "script-finished", "script-failed",
  "gate-blocked", "gate-continued", "gate-release", "form-state",
  "waiting-enabled", "form-enabled", "page-error", "unexpected-network",
]);
const phases = new Set(["setup", "ssr", "waiting-enabled", "submit", "complete"]);
const statuses = new Set(["passed", "failed", "timedOut", "skipped", "interrupted"]);
const failures = new Set(["aborted", "connection", "timeout", "tls", "other"]);
const readyStates = new Set(["loading", "interactive", "complete", "unavailable"]);
const safeNumber = (value, max = 660_000) => Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value) : null;
const safeCount = (value, max = 10_000) => Number.isInteger(value) && value >= 0 && value <= max ? value : null;
const booleanOrNull = (value) => typeof value === "boolean" ? value : null;

// Reconstruir a partir de uma allowlist, nunca serializar objectos do fornecedor.
export function sanitizeMobileDiagnosticReport(input) {
  const source = input && typeof input === "object" ? input : {};
  const timeline = Array.isArray(source.timeline) ? source.timeline.slice(0, 500).flatMap((item) => {
    if (!item || typeof item !== "object" || !events.has(item.event)) return [];
    const atMs = safeNumber(item.atMs);
    if (atMs === null) return [];
    const clean = { event: item.event, atMs };
    if (typeof item.scriptId === "string" && item.scriptId.trim() === item.scriptId && /^s[1-9]\d{0,3}$/.test(item.scriptId)) clean.scriptId = item.scriptId;
    if (Number.isInteger(item.status) && item.status >= 100 && item.status <= 599) clean.status = item.status;
    if (failures.has(item.failure)) clean.failure = item.failure;
    if (safeNumber(item.bodyBytes, 100_000_000) !== null) clean.bodyBytes = safeNumber(item.bodyBytes, 100_000_000);
    if (item.event === "form-state") {
      for (const name of ["hydrated", "disabled", "pending", "buttonDisabled", "inputDisabled"])
        clean[name] = booleanOrNull(item[name]);
      clean.readyState = readyStates.has(item.readyState) ? item.readyState : "unavailable";
    }
    return [clean];
  }) : [];
  const timelineTruncated = Array.isArray(source.timeline) && source.timeline.length >= 500 ? true :
    typeof source.timelineTruncated === "boolean" ? source.timelineTruncated : null;
  const observedState = timeline.some((event) => event.event === "form-state" &&
    [event.hydrated, event.disabled, event.pending, event.buttonDisabled, event.inputDisabled].every((value) => typeof value === "boolean"));
  return {
    version: 1,
    scenario: "auth-mobile-delayed-scripts",
    project: "mobile",
    assertionTimeoutMs: 15_000,
    instrumentedCopy: true,
    executedCases: safeCount(source.executedCases, 1),
    testStatus: statuses.has(source.testStatus) ? source.testStatus : "not-run",
    phase: phases.has(source.phase) ? source.phase : "setup",
    gateBlockedBeforeRelease: safeCount(source.gateBlockedBeforeRelease),
    unexpectedNetworkCount: safeCount(source.unexpectedNetworkCount),
    caseCompleted: source.caseCompleted === true,
    exitCode: Number.isInteger(source.exitCode) && source.exitCode >= 0 && source.exitCode <= 255 ? source.exitCode : null,
    temporaryCopyRemoved: source.temporaryCopyRemoved === true,
    loopbackPortsReleased: source.loopbackPortsReleased === true,
    timelineTruncated,
    telemetryComplete: Array.isArray(source.timeline) && timeline.length === source.timeline.length && timelineTruncated === false && observedState,
    timeline,
  };
}

export function classifyMobileDiagnostic(report) {
  if (report.executedCases !== 1 || !report.temporaryCopyRemoved || !report.loopbackPortsReleased || report.unexpectedNetworkCount !== 0 || report.gateBlockedBeforeRelease === null)
    return "not-completed";
  if (!report.gateBlockedBeforeRelease) return "inconclusive-no-gate";
  if (!report.telemetryComplete) return "inconclusive-telemetry";
  if (report.testStatus === "passed" && report.caseCompleted && report.phase === "complete" && report.exitCode === 0)
    return "passed-no-reproduction";
  const lastState = report.timeline.filter((event) => event.event === "form-state").at(-1);
  if (["failed", "timedOut"].includes(report.testStatus) && report.phase === "waiting-enabled" && lastState?.buttonDisabled === true)
    return "failure-reproduced";
  return "not-completed";
}

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error("Diagnostic input changed");
  return source.replace(before, after);
}

export function instrumentMobileAuthForm(source) {
  return replaceOnce(source,
    '<form action={formAction} className="data-form">',
    '<form action={formAction} className="data-form" data-diag-hydrated={hydrated} data-diag-disabled={disabled} data-diag-pending={pending}>');
}

export function diagnosticSpec(original, destination) {
  const start = original.indexOf('test("hidratação: scripts atrasados');
  const end = original.indexOf('\nfor (const origin', start);
  if (start < 0 || end < 0) throw new Error("Diagnostic case missing");
  let test = original.slice(start, end).trim();
  const setup = `
  const started = Date.now();
  const timeline: Record<string, unknown>[] = [];
  let phase = "setup", blocked = 0, blockedBeforeRelease = 0, unexpectedNetworkCount = 0, caseCompleted = false, timelineTruncated = false;
  const ids = new WeakMap<object, string>(); let serial = 0;
  const id = (req: object) => { let value = ids.get(req); if (!value) { value = "s" + (++serial); ids.set(req, value); } return value; };
  const record = (event: string, extra: Record<string, unknown> = {}) => { if (timeline.length < 400) timeline.push({ event, atMs: Date.now()-started, ...extra }); if (timeline.length >= 400) timelineTruncated = true; };
  const permitted = (value: string) => { try { const u = new URL(value); return ["http:","https:"].includes(u.protocol) && ["127.0.0.1","localhost"].includes(u.hostname) && ["3100","4343","4344"].includes(u.port); } catch { return false; } };
  await page.route("**/*", async route => { if (!permitted(route.request().url())) { unexpectedNetworkCount++; record("unexpected-network"); await route.abort(); } else await route.continue(); });
  page.on("request", req => { if (req.resourceType()==="script") record("script-request", {scriptId:id(req)}); });
  page.on("response", res => { if (res.request().resourceType()==="script") record("script-response", {scriptId:id(res.request()),status:res.status()}); });
  page.on("requestfinished", async req => { if (req.resourceType()==="script") { const entry:Record<string,unknown>={event:"script-finished",atMs:Date.now()-started,scriptId:id(req)}; if(timeline.length<400)timeline.push(entry);if(timeline.length>=400)timelineTruncated=true;try{entry.bodyBytes=(await req.sizes()).responseBodySize;}catch{} } });
  page.on("requestfailed", req => { if(req.resourceType()==="script") { const text=req.failure()?.errorText??""; const failure=/ABORTED/i.test(text)?"aborted":/TIMED_OUT|TIMEOUT/i.test(text)?"timeout":/CERT|SSL|TLS/i.test(text)?"tls":/CONNECTION|NAME_NOT_RESOLVED/i.test(text)?"connection":"other"; record("script-failed",{scriptId:id(req),failure}); } });
  page.on("pageerror", () => record("page-error"));
  await page.addInitScript(({started}) => {
    const samples: Record<string, unknown>[]=[]; let previous="";
    Object.defineProperty(window,"__gestorMobileDiagnostic",{value:samples});
    const truncation={value:false};Object.defineProperty(window,"__gestorMobileDiagnosticTruncated",{value:truncation});
    const sample=()=>{const f=document.querySelector("form[data-diag-hydrated]"); const b=f?.querySelector("button"); const i=f?.querySelector("input[name=email]"); const bool=(v:string|null|undefined)=>v==="true"?true:v==="false"?false:null;
      const state={hydrated:bool(f?.getAttribute("data-diag-hydrated")),disabled:bool(f?.getAttribute("data-diag-disabled")),pending:bool(f?.getAttribute("data-diag-pending")),buttonDisabled:b instanceof HTMLButtonElement?b.disabled:null,inputDisabled:i instanceof HTMLInputElement?i.disabled:null,readyState:document.readyState};
      const key=JSON.stringify(state); if(key!==previous&&samples.length<100){previous=key;samples.push({event:"form-state",atMs:Date.now()-started,...state});}if(samples.length>=100)truncation.value=true;};
    new MutationObserver(sample).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:["disabled","data-diag-hydrated","data-diag-disabled","data-diag-pending"]});
    document.addEventListener("readystatechange",sample);sample();
  }, {started});
  try {`;
  test = replaceOnce(test, 'async ({ page, request }) => {', 'async ({ page, request }) => {' + setup);
  test = replaceOnce(test, '  await page.route("**/_next/**", async route => {', '  await page.route("**/_next/**", async route => {\n    if (!permitted(route.request().url())) { unexpectedNetworkCount++; record("unexpected-network"); await route.abort(); return; }');
  test = replaceOnce(test, '    if (route.request().resourceType() === "script") await gate;', '    if (route.request().resourceType() === "script") { blocked++; record("gate-blocked",{scriptId:id(route.request())}); await gate; record("gate-continued",{scriptId:id(route.request())}); }');
  test = replaceOnce(test, '    await page.goto("/recuperar-acesso", { waitUntil: "commit" });', '    phase="ssr";\n    await page.goto("/recuperar-acesso", { waitUntil: "commit" });');
  test = replaceOnce(test, '  } finally { release(); }', '  } finally { blockedBeforeRelease=blocked; record("gate-release"); release(); }');
  test = replaceOnce(test, '  await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeEnabled();', '  phase="waiting-enabled";record("waiting-enabled");\n  await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeEnabled();\n  record("form-enabled");phase="submit";');
  if (!test.endsWith('});')) throw new Error("Diagnostic case changed");
  test = test.slice(0, -3) + `
  caseCompleted=true;phase="complete";
  } finally {
    let observation:{samples:Record<string,unknown>[];truncated:boolean}={samples:[],truncated:false};
    try { observation=await page.evaluate(()=>{const w=window as unknown as {__gestorMobileDiagnostic?:Record<string,unknown>[];__gestorMobileDiagnosticTruncated?:{value:boolean}};return{samples:w.__gestorMobileDiagnostic??[],truncated:w.__gestorMobileDiagnosticTruncated?.value??false};}); } catch {}
    writeFileSync(${JSON.stringify(destination)},JSON.stringify({timeline:[...timeline,...observation.samples].sort((a,b)=>Number(a.atMs)-Number(b.atMs)),timelineTruncated:timelineTruncated||observation.truncated,phase,gateBlockedBeforeRelease:blockedBeforeRelease,unexpectedNetworkCount,caseCompleted}),{mode:0o600});
  }
});`;
  return 'import { expect, test } from "@playwright/test";\nimport { writeFileSync } from "node:fs";\nconst control="http://127.0.0.1:4344";\n' + test + '\n';
}

async function portBusy(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    const done = (busy) => { socket.destroy(); resolve(busy); };
    socket.once("connect", () => done(true));
    socket.once("error", (error) => done(error.code !== "ECONNREFUSED"));
    socket.setTimeout(1000, () => done(true));
  });
}

async function stopOwnedFixture(ownerFile, app) {
  try {
    if (!existsSync(ownerFile)) return;
    const { pid } = JSON.parse(readFileSync(ownerFile, "utf8"));
    if (!Number.isInteger(pid) || pid < 2) return;
    if (realpathSync(`/proc/${pid}/cwd`) !== app) return;
    const args = readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0");
    if (!args.includes("tests/mobile-diagnostic-fixture.mjs")) return;
    process.kill(pid, "SIGTERM");
    for (let i = 0; i < 30; i++) {
      await delay(100);
      if (!existsSync(`/proc/${pid}`)) return;
    }
  } catch { /* O processo próprio pode já ter terminado. */ }
}

export async function runMobileDiagnostic() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const checkout = realpathSync(root), temporaryRoot = realpathSync(tmpdir());
  const insideCheckout = (path) => path === checkout || path.startsWith(checkout + sep);
  if (insideCheckout(temporaryRoot)) throw new Error("Private output outside checkout required");
  const output = mkdtempSync(join(tmpdir(), "gestor-mobile-report-"));
  const area = mkdtempSync(join(tmpdir(), "gestor-mobile-work-"));
  const reportPath = join(output, "report.json");
  let input = {}, child, app, ownerFile;
  const signals = new Map();
  try {
    if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("Node version");
    if ((await Promise.all([3100, 4343, 4344].map(portBusy))).some(Boolean)) throw new Error("Busy ports");
    if (insideCheckout(realpathSync(output)) || insideCheckout(realpathSync(area))) throw new Error("Private output outside checkout required");
    if ((lstatSync(output).mode & 0o777) !== 0o700 || (lstatSync(area).mode & 0o777) !== 0o700) throw new Error("Private directories required");
    app = prepareAuthLocalApp(root, join(area, "app"));
    for (const name of ["tests", "scripts", "playwright.config.ts", "playwright.auth-local.config.ts"])
      cpSync(join(root, name), join(app, name), { recursive: true });
    const authForm = join(app, "src/components/auth-form.tsx");
    writeFileSync(authForm, instrumentMobileAuthForm(readFileSync(authForm, "utf8")));
    const original = readFileSync(join(root, "tests/e2e/auth-origin-regression.spec.ts"), "utf8");
    const caseReport = join(area, "case.json"), testReport = join(area, "test.json");
    writeFileSync(join(app, "tests/e2e/auth-origin-regression.spec.ts"), diagnosticSpec(original, caseReport));
    const config = readFileSync(join(app, "playwright.auth-local.config.ts"), "utf8");
    if (!/expect:\s*\{\s*timeout:\s*15_000\s*\}/.test(config)) throw new Error("Assertion budget changed");
    ownerFile = join(area, "fixture-owner.json");
    writeFileSync(join(app, "tests/mobile-diagnostic-fixture.mjs"), `import{writeFileSync}from"node:fs";writeFileSync(${JSON.stringify(ownerFile)},JSON.stringify({pid:process.pid}),{mode:0o600});await import("./fixtures/auth-local-server.mjs");\n`);
    writeFileSync(join(app, "tests/mobile-diagnostic-reporter.mjs"), `import{writeFileSync}from"node:fs";export default class Reporter{executed=[];onBegin(_,suite){if(suite.allTests().length!==1)throw Error("Expected exactly one case");}onTestEnd(_,result){this.executed.push(result.status);}onEnd(){writeFileSync(${JSON.stringify(testReport)},JSON.stringify({executedCases:this.executed.length,testStatus:this.executed[0]}),{mode:0o600});}}\n`);
    writeFileSync(join(app, "playwright.auth-mobile-diagnostic.config.ts"), `import{defineConfig}from"@playwright/test";import base from"./playwright.auth-local.config";export default defineConfig({...base,testMatch:"auth-origin-regression.spec.ts",projects:base.projects?.filter(p=>p.name==="mobile"),retries:0,preserveOutput:"never",reporter:[["./tests/mobile-diagnostic-reporter.mjs"]],webServer:{...base.webServer,command:"node tests/mobile-diagnostic-fixture.mjs",stdout:"ignore",stderr:"ignore"}});\n`);
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (/supabase/i.test(key)) delete env[key];
    mkdirSync(join(area, "internal-tmp"), { mode: 0o700 });
    Object.assign(env, { TMPDIR: join(area, "internal-tmp"), NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", APP_ORIGIN: "https://preview.example.invalid", CODESPACES: "", CODESPACE_NAME: "", GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: "", GESTOR_CSRF_DIAGNOSTIC: "0", NEXT_TELEMETRY_DISABLED: "1" });
    if (!env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && existsSync("/usr/bin/chromium")) env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "/usr/bin/chromium";
    child = spawn(process.execPath, [join(root, "node_modules/playwright/cli.js"), "test", "--config=playwright.auth-mobile-diagnostic.config.ts", "--project=mobile", "--grep=scripts atrasados", "--global-timeout=600000"], { cwd: app, env, stdio: "ignore", detached: true });
    for (const signal of ["SIGINT", "SIGTERM"]) {
      const handler = () => { try { process.kill(-child.pid, "SIGTERM"); } catch {} };
      signals.set(signal, handler); process.on(signal, handler);
    }
    const exitCode = await new Promise((resolve) => {
      const timer = setTimeout(() => { try { process.kill(-child.pid, "SIGTERM"); } catch {} }, 660_000);
      child.once("error", () => { clearTimeout(timer); resolve(null); });
      child.once("exit", (code) => { clearTimeout(timer); resolve(code); });
    });
    input = { ...(existsSync(caseReport) ? JSON.parse(readFileSync(caseReport, "utf8")) : {}), ...(existsSync(testReport) ? JSON.parse(readFileSync(testReport, "utf8")) : {}), exitCode };
  } catch {
    // Apenas estado categórico: não guardar mensagens de erros do SDK/framework.
  } finally {
    if (ownerFile && app) await stopOwnedFixture(ownerFile, app);
    for (const [signal, handler] of signals) process.removeListener(signal, handler);
    rmSync(area, { recursive: true, force: true });
    input.temporaryCopyRemoved = !existsSync(area);
    input.loopbackPortsReleased = !(await Promise.all([3100, 4343, 4344].map(portBusy))).some(Boolean);
  }
  const report = sanitizeMobileDiagnosticReport(input);
  const result = classifyMobileDiagnostic(report);
  writeFileSync(reportPath, JSON.stringify({ result, ...report }, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ result, reportPath }));
  return { result, reportPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { result } = await runMobileDiagnostic();
    process.exitCode = result === "passed-no-reproduction" ? 0 : 1;
  } catch {
    console.error(JSON.stringify({ result: "not-completed", reason: "private-output-unavailable" }));
    process.exitCode = 1;
  }
}
