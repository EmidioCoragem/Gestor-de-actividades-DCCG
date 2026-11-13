import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Report = Record<string, unknown> & { timeline: Record<string, unknown>[] };
type DiagnosticApi = {
  sanitizeMobileDiagnosticReport: (input: unknown) => Report;
  classifyMobileDiagnostic: (report: Report) => string;
  instrumentMobileAuthForm: (source: string) => string;
  diagnosticSpec: (source: string, destination: string) => string;
};
const url = new URL("../run-auth-mobile-diagnostic.mjs", import.meta.url);
const diagnostic = await import(url.href) as DiagnosticApi;
const sanitize = diagnostic.sanitizeMobileDiagnosticReport;
const classify = (input: unknown) => diagnostic.classifyMobileDiagnostic(sanitize(input));

function successfulObservation() {
  return {
    executedCases: 1, testStatus: "passed", phase: "complete", gateBlockedBeforeRelease: 2,
    unexpectedNetworkCount: 0, caseCompleted: true, exitCode: 0,
    temporaryCopyRemoved: true, loopbackPortsReleased: true, timelineTruncated: false,
    timeline: [
      { event: "gate-blocked", atMs: 10, scriptId: "s1" },
      { event: "gate-release", atMs: 500 },
      { event: "form-state", atMs: 900, hydrated: true, disabled: false, pending: false,
        buttonDisabled: false, inputDisabled: false, readyState: "complete" },
    ],
  };
}

describe("Diagnóstico mobile: relatório categórico, sem dados do browser/framework", () => {
  it("preserva apenas métricas e categorias seguras, removendo canários privados", () => {
    const canary = "FICTION_ONLY_PRIVATE_CANARY";
    const input = successfulObservation();
    const report = sanitize({ ...input, headers: { authorization: canary }, cookies: canary,
      url: `https://fixture.invalid/?token=${canary}`, rawError: canary, body: canary,
      timeline: [...input.timeline,
        { event: "script-response", atMs: 700, scriptId: "s2", status: 200, url: canary, headers: canary },
        { event: "page-error", atMs: 800, message: canary, stack: canary },
      ],
    });
    expect(JSON.stringify(report)).not.toContain(canary);
    expect(report.scenario).toBe("auth-mobile-delayed-scripts");
    expect(report.project).toBe("mobile");
    expect(report.assertionTimeoutMs).toBe(15_000);
    expect(report.timeline).toContainEqual({ event: "script-response", atMs: 700, scriptId: "s2", status: 200 });
  });

  it("remove eventos, identificadores e enums arbitrários sem executar conversões de objectos", () => {
    const report = sanitize({ ...successfulObservation(), timeline: [
      { event: "unknown-private-event", atMs: 1, url: "FICTION_ONLY_PRIVATE_CANARY" },
      { event: "script-response", atMs: 2, scriptId: { toString: "not-a-function" }, status: 999, failure: "private-error" },
      { event: "script-failed", atMs: 3, scriptId: "https://fixture.invalid/private", failure: "tls" },
      { event: "form-state", atMs: 4, hydrated: "private", disabled: {}, pending: "false", buttonDisabled: 1, inputDisabled: null, readyState: "private" },
    ] });
    expect(report.timeline).toHaveLength(3);
    expect(report.timeline[0]).toEqual({ event: "script-response", atMs: 2 });
    expect(report.timeline[1]).toEqual({ event: "script-failed", atMs: 3, failure: "tls" });
    expect(report.timeline[2]).toMatchObject({ hydrated: null, disabled: null, pending: null, buttonDisabled: null, inputDisabled: null, readyState: "unavailable" });
    expect(report.telemetryComplete).toBe(false);
    expect(diagnostic.classifyMobileDiagnostic(report)).not.toBe("passed-no-reproduction");
  });

  it.each([undefined, -1, Number.NaN, 0.6, 2])("contagem de casos inválida %s não se arredonda para uma execução aprovada", executedCases => {
    expect(classify({ ...successfulObservation(), executedCases })).toBe("not-completed");
  });

  it.each([undefined, -1, Number.NaN, 0.4, 1])("tráfego externo desconhecido ou positivo %s não é interpretado como zero", unexpectedNetworkCount => {
    expect(classify({ ...successfulObservation(), unexpectedNetworkCount })).toBe("not-completed");
  });

  it("um cenário sem scripts efectivamente retidos é inconclusivo", () => {
    expect(classify({ ...successfulObservation(), gateBlockedBeforeRelease: 0 })).toBe("inconclusive-no-gate");
  });

  it.each([undefined, "false", true])("truncagem desconhecida ou efectiva %s não certifica telemetria completa", timelineTruncated => {
    expect(classify({ ...successfulObservation(), timelineTruncated })).not.toBe("passed-no-reproduction");
  });

  it("telemetria sem estados do formulário não demonstra a observação pretendida", () => {
    expect(classify({ ...successfulObservation(), timeline: [{ event: "gate-release", atMs: 1 }] })).toBe("inconclusive-telemetry");
  });

  it("aprovação exige conclusão do caso, saída zero e limpeza confirmada", () => {
    expect(classify(successfulObservation())).toBe("passed-no-reproduction");
    for (const override of [{ caseCompleted: false }, { exitCode: 1 }, { temporaryCopyRemoved: false }, { loopbackPortsReleased: false }, { phase: "unknown" }])
      expect(classify({ ...successfulObservation(), ...override })).not.toBe("passed-no-reproduction");
  });

  it("falha observada durante a espera exige o botão desactivado e a fase correspondente", () => {
    const input = { ...successfulObservation(), testStatus: "failed", phase: "waiting-enabled", caseCompleted: false, exitCode: 1,
      timeline: [{ event: "form-state", atMs: 15_500, hydrated: false, disabled: true, pending: false, buttonDisabled: true, inputDisabled: true, readyState: "complete" }],
    };
    expect(classify(input)).toBe("failure-reproduced");
    expect(classify({ ...input, phase: "setup" })).toBe("not-completed");
    expect(classify({ ...input, timeline: [{ ...input.timeline[0], buttonDisabled: false }] })).toBe("not-completed");
  });
});

describe("Instrumentação pura: só cópia, sem execução Auth ou alteração das asserções", () => {
  it("os três atributos de observação são a única diferença no formulário real", () => {
    const original = readFileSync("src/components/auth-form.tsx", "utf8");
    const instrumented = diagnostic.instrumentMobileAuthForm(original);
    const attributes = " data-diag-hydrated={hydrated} data-diag-disabled={disabled} data-diag-pending={pending}";
    expect(instrumented.split(attributes)).toHaveLength(2);
    expect(instrumented.replace(attributes, "")).toBe(original);
    expect(readFileSync("src/components/auth-form.tsx", "utf8")).toBe(original);
  });

  it("formulário divergente ou já instrumentado é recusado, sem alteração genérica de código", () => {
    expect(() => diagnostic.instrumentMobileAuthForm("<form>different</form>")).toThrow();
    const original = readFileSync("src/components/auth-form.tsx", "utf8");
    expect(() => diagnostic.instrumentMobileAuthForm(diagnostic.instrumentMobileAuthForm(original))).toThrow();
  });

  it("selecciona exactamente o caso original e conserva todas as linhas de asserção", () => {
    const original = readFileSync("tests/e2e/auth-origin-regression.spec.ts", "utf8");
    const start = original.indexOf('test("hidratação: scripts atrasados');
    const end = original.indexOf("\nfor (const origin", start);
    const target = original.slice(start, end);
    const instrumented = diagnostic.diagnosticSpec(original, "/tmp/synthetic-diagnostic-case.json");
    const enabled = 'await expect(page.getByRole("button", { name: "Enviar instruções" })).toBeEnabled();';
    expect(instrumented.match(/^\s*test\(/gm)).toHaveLength(1);
    expect(instrumented.split(enabled)).toHaveLength(2);
    for (const line of target.split("\n").map(line => line.trim()).filter(line => line.includes("expect(")))
      expect(instrumented).toContain(line);
    const beforeAssertion = instrumented.slice(instrumented.indexOf('phase="waiting-enabled"'), instrumented.indexOf(enabled));
    expect(beforeAssertion).not.toMatch(/\bawait\b|waitFor|setTimeout|\bdelay\b/);
    expect(readFileSync("playwright.auth-local.config.ts", "utf8")).toMatch(/expect:\s*\{\s*timeout:\s*15_000\s*\}/);
    expect(readFileSync("tests/e2e/auth-origin-regression.spec.ts", "utf8")).toBe(original);
  });

  it("não cria um caso novo se o cenário original já não existir", () => {
    expect(() => diagnostic.diagnosticSpec("unrelated source", "/tmp/synthetic-diagnostic-case.json")).toThrow();
  });
});
