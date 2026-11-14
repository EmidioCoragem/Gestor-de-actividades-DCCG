import { describe, expect, it } from "vitest";
import { ACTIVITY_STATUSES } from "../../src/modules/activities/contracts";
import { activityDraftInputSchema, activityDraftPaginationSchema, validateActivityDraftForm } from "../../src/modules/activities/validation";
import { classifyActivityDatabaseError, isActivityOriginAllowed } from "../../src/modules/activities/policy";

const input = { title: " Rascunho fictício ", responsible_unit_id: "b1000000-0000-4000-8000-000000000002", request_id: "c1000000-0000-4000-8000-000000000001" };
function form(values: Record<string, string> = input) { const result = new FormData(); for (const [key, value] of Object.entries(values)) result.set(key, value); return result; }

describe("Contrato do primeiro rascunho, sem criar atribuições ou concluir actividades", () => {
  it("preserva os sete estados do modelo mas recebe só conteúdo, unidade e intenção", () => {
    expect(ACTIVITY_STATUSES).toEqual(["draft", "assigned", "in_progress", "awaiting_validation", "completed", "suspended", "cancelled"]);
    expect(activityDraftInputSchema.parse(input)).toEqual({ ...input, title: "Rascunho fictício", description: "" });
  });
  it.each(["created_by", "actor_id", "code", "status", "version", "creator_id"])("rejeita campo controlado pelo servidor: %s", field => {
    expect(activityDraftInputSchema.safeParse({ ...input, [field]: "forged" }).success).toBe(false);
    expect(validateActivityDraftForm(form({ ...input, [field]: "forged" })).success).toBe(false);
  });
  it.each(["", "   ", "x".repeat(201)])("rejeita título vazio ou demasiado longo (%s)", title => {
    expect(activityDraftInputSchema.safeParse({ ...input, title }).success).toBe(false);
  });
  it("os limites contam codepoints, incluindo caracteres fora do BMP", () => {
    expect(activityDraftInputSchema.safeParse({ ...input, title: "😀".repeat(200), description: "😀".repeat(10000) }).success).toBe(true);
    expect(activityDraftInputSchema.safeParse({ ...input, title: "😀".repeat(201) }).success).toBe(false);
    expect(activityDraftInputSchema.safeParse({ ...input, description: "😀".repeat(10001) }).success).toBe(false);
  });
  it("não altera a descrição usada para identificar uma intenção idempotente", () => {
    expect(activityDraftInputSchema.parse({ ...input, description: "  descrição\n" }).description).toBe("  descrição\n");
  });
  it("campos repetidos e ficheiro no título não são silenciosamente escolhidos", () => {
    const duplicate = form(); duplicate.append("title", "Outro título");
    expect(validateActivityDraftForm(duplicate).success).toBe(false);
    const file = form(); file.set("title", new File(["fictício"], "synthetic.txt"));
    expect(validateActivityDraftForm(file).success).toBe(false);
  });
  it("metadados de transporte React não se transformam em campos de domínio", () => {
    const value = form(); value.set("$ACTION_REF_0", "transport-only");
    expect(validateActivityDraftForm(value)).toMatchObject({ success: true, data: { title: "Rascunho fictício", request_id: input.request_id } });
  });
  it.each(["not-a-uuid", "", "../outside"])("identificadores inválidos %s são recusados", value => {
    expect(activityDraftInputSchema.safeParse({ ...input, responsible_unit_id: value }).success).toBe(false);
    expect(activityDraftInputSchema.safeParse({ ...input, request_id: value }).success).toBe(false);
  });
  it("paginação tem limites, valores inteiros e defaults explícitos", () => {
    expect(activityDraftPaginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(activityDraftPaginationSchema.parse({ page: "2", pageSize: "50" })).toEqual({ page: 2, pageSize: 50 });
    for (const invalid of [{ page: 0 }, { page: -1 }, { page: 1.5 }, { pageSize: 51 }, { page: "01" }, { page: [] }, { actor: "forged" }])
      expect(activityDraftPaginationSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("Classificação de origem e erros sem privilégios adicionais", () => {
  it.each([null, "null", "https://forged.invalid", "https://portal.invalid/", "http://portal.invalid"])("origem %s não substitui a origem canónica", origin => {
    expect(isActivityOriginAllowed(origin, "https://portal.invalid")).toBe(false);
  });
  it("só aceita a origem configurada exacta", () => expect(isActivityOriginAllowed("https://portal.invalid", "https://portal.invalid")).toBe(true));
  it.each([
    ["42501", "refused"], ["22023", "validation"], ["23505", "conflict"],
    ["42P01", "schema-unavailable"], ["42883", "schema-unavailable"],
    ["PGRST202", "schema-unavailable"], ["PGRST205", "schema-unavailable"], ["unknown", "unavailable"],
  ])("SQLSTATE %s tem categoria %s", (code, expected) => expect(classifyActivityDatabaseError({ code })).toBe(expected));
});
