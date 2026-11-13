import { describe, expect, it } from "vitest";
import { classifyReadResult, readStateMessage, readSucceeded, validityLabel } from "../../src/modules/access/read-state";

describe("Leituras administrativas: resultado explícito, sem inferir poderes de RLS", () => {
  it("preserva apenas linhas devolvidas numa consulta bem sucedida", () => {
    const rows = [{ id: "synthetic-visible", name: "Pessoa de teste" }];
    expect(classifyReadResult({ data: rows, error: null, status: 200 })).toEqual({ status: "ok", data: rows });
  });

  it("uma lista vazia válida não é recusa nem concede âmbito global", () => {
    expect(classifyReadResult({ data: [], error: null, status: 200 })).toEqual({ status: "empty", data: [] });
  });

  it.each(["42501", "PGRST301", "PGRST302", "PGRST303"])("reconhece recusa explícita %s e descarta dados parciais", code => {
    expect(classifyReadResult({ data: [{ id: "must-not-render" }], error: { code } })).toEqual({ status: "refused", data: null });
  });

  it.each([401, 403])("HTTP %i distingue recusa mesmo sem código de erro utilizável", status => {
    expect(classifyReadResult({ data: [], error: null, status })).toEqual({ status: "refused", data: null });
    expect(classifyReadResult({ data: [], error: {}, status })).toEqual({ status: "refused", data: null });
  });

  it.each([404, 429, 500, 503])("HTTP %i não é confundido com lista vazia", status => {
    expect(classifyReadResult({ data: [], error: null, status })).toEqual({ status: "unavailable", data: null });
  });

  it.each([0, 101, 302, Number.NaN])("estado de transporte %s sem sucesso HTTP não confirma uma lista vazia", status => {
    expect(classifyReadResult({ data: [], error: null, status })).toEqual({ status: "unavailable", data: null });
  });

  it("erro técnico descarta linhas que não podem ser consideradas completas", () => {
    expect(classifyReadResult({ data: [{ id: "partial" }], error: { code: "08006" } })).toEqual({ status: "unavailable", data: null });
  });

  it.each([null, undefined, {}, "malformed"])("dados incompletos não são classificados como vazios (%j)", data => {
    const response = { data, error: null } as unknown as Parameters<typeof classifyReadResult>[0];
    expect(classifyReadResult(response)).toEqual({ status: "unavailable", data: null });
  });

  it("uma falha de leitura não reutiliza o texto de ausência de registos", () => {
    const empty = "Sem registos visíveis no âmbito autorizado.";
    expect(readStateMessage("empty", "chefias", empty)).toBe(empty);
    expect(readStateMessage("refused", "chefias", empty)).toMatch(/recusada/);
    expect(readStateMessage("unavailable", "chefias", empty)).toMatch(/indisponível/);
    expect(readStateMessage("refused", "chefias", empty)).not.toContain(empty);
    expect(readStateMessage("unavailable", "chefias", empty)).not.toContain(empty);
  });

  it.each(["ok", "empty", "refused", "unavailable"] as const)("disponibilidade de opções depende do estado %s", status => {
    expect(readSucceeded({ status })).toBe(status === "ok" || status === "empty");
  });
});

describe("Vigência: datas e intervalos, independentemente do estado da conta", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  it.each([
    ["2026-11-01T00:00:00Z", null, "Em vigor"],
    ["2026-11-09T12:00:00Z", null, "Em vigor"],
    ["2026-11-10T00:00:00Z", null, "Programada"],
    ["2026-11-01T00:00:00Z", "2026-11-09T12:00:00Z", "Encerrada"],
    ["2026-11-01T00:00:00Z", "2026-11-08T00:00:00Z", "Encerrada"],
    ["2026-11-10T00:00:00Z", "2026-11-10T00:00:00Z", "Encerrada"],
    ["2026-11-10T00:00:00Z", "2026-11-09T00:00:00Z", "Vigência indisponível"],
    ["invalid", null, "Vigência indisponível"],
    ["2026-11-01T00:00:00Z", "invalid", "Vigência indisponível"],
  ])("classifica início %s e fim %s como %s", (from, until, expected) => {
    expect(validityLabel(from!, until, now)).toBe(expected);
  });

  it("não apresenta vigência válida se o instante de referência for inválido", () => {
    expect(validityLabel("2026-11-01T00:00:00Z", null, new Date("invalid"))).toBe("Vigência indisponível");
  });
});
