import { beforeEach, describe, expect, it, vi } from "vitest";
type Response = { data: unknown; error: unknown; status?: number; count?: number | null };
const f = vi.hoisted(() => ({ create: vi.fn(), rpc: vi.fn(), response: {} as Response, calls: [] as { method: string; args: unknown[] }[] }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: f.create }));
import { createActivityDraftRecord, getActivityDraft, getActivityDrafts, getActivityDraftUnits } from "../../src/modules/activities/repository";

const id = "d1000000-0000-4000-8000-000000000001";
const unit = "b1000000-0000-4000-8000-000000000002";
const requestId = "c1000000-0000-4000-8000-000000000001";
const row = { id, code: "ACT-D1000000000040008000000000000001", title: "Título fictício", description: "Descrição fictícia", responsible_unit_id: unit,
  created_by: "a1000000-0000-4000-8000-000000000001", status: "draft", version: 1,
  created_at: "2026-11-14T12:00:00Z", updated_at: "2026-11-14T12:00:00Z",
  responsible_unit: { code: "A", name: "Unidade A fictícia" }, creator: { full_name: "Criador fictício" } };
const input = { title: "Título fictício", description: "", responsible_unit_id: unit, request_id: requestId };
beforeEach(() => {
  vi.resetAllMocks(); f.calls = []; f.response = { data: [row], error: null, status: 200, count: 41 };
  f.rpc.mockImplementation(async () => f.response);
  f.create.mockResolvedValue({ rpc: f.rpc, from: (table: string) => {
    f.calls.push({ method: "from", args: [table] });
    const chain = {
      select: (...args: unknown[]) => { f.calls.push({ method: "select", args }); return chain; },
      eq: (...args: unknown[]) => { f.calls.push({ method: "eq", args }); return chain; },
      order: (...args: unknown[]) => { f.calls.push({ method: "order", args }); return chain; },
      range: (...args: unknown[]) => { f.calls.push({ method: "range", args }); return chain; },
      maybeSingle: async () => f.response,
      then: (resolve: (value: Response) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(f.response).then(resolve, reject),
    }; return chain;
  } });
});

describe("Leitura de rascunhos com cliente da sessão, sem alargar relações ocultas", () => {
  it("pagina com ordenação estável e contagem exacta devolvida pelo mesmo pedido RLS", async () => {
    const result = await getActivityDrafts({ page: 2, pageSize: 20 });
    expect(result).toMatchObject({ state: "ok", pagination: { page: 2, pageSize: 20, total: 41, totalPages: 3 } });
    expect(result.data[0]).toMatchObject({ id, responsible_unit_name: "Unidade A fictícia", creator_name: "Criador fictício" });
    expect(f.calls.filter(call => call.method === "order").map(call => call.args)).toEqual([["created_at", { ascending: false }], ["id", { ascending: false }]]);
    expect(f.calls.find(call => call.method === "range")?.args).toEqual([20, 39]);
    expect(f.calls.find(call => call.method === "select")?.args[1]).toEqual({ count: "exact" });
  });
  it.each([null, undefined, -1, Number.NaN])("contagem desconhecida/inválida %s não vira zero ou lista vazia", async count => {
    f.response = { data: [], error: null, status: 200, count };
    expect(await getActivityDrafts()).toMatchObject({ state: "unavailable", data: [], pagination: { total: null, totalPages: null } });
  });
  it("lista vazia só é confirmada com dados e contagem válidos", async () => {
    f.response = { data: [], error: null, status: 200, count: 0 };
    expect(await getActivityDrafts()).toMatchObject({ state: "empty", data: [], pagination: { total: 0, totalPages: 0 } });
  });
  it.each([null, {}, "malformed"])("resposta de lista %j é indisponível", async data => {
    f.response = { data, error: null, status: 200, count: 0 };
    expect(await getActivityDrafts()).toMatchObject({ state: "unavailable", data: [] });
  });
  it.each([0, 401, 403, 503])("HTTP %i não é apresentado como ausência de rascunhos", async status => {
    f.response = { data: [], error: null, status, count: 0 };
    expect((await getActivityDrafts()).state).toBe(status === 401 || status === 403 ? "refused" : "unavailable");
  });
  it("relações ocultas permanecem nulas sem converter IDs em nomes", async () => {
    f.response = { data: [{ ...row, responsible_unit: null, creator: null }], error: null, status: 200, count: 1 };
    expect((await getActivityDrafts()).data[0]).toMatchObject({ responsible_unit_name: null, creator_name: null });
  });
  it("relações em array de uma linha são aceites sem !inner ou consultas privilegiadas", async () => {
    f.response = { data: [{ ...row, responsible_unit: [row.responsible_unit], creator: [row.creator] }], error: null, status: 200, count: 1 };
    expect((await getActivityDrafts()).data[0]).toMatchObject({ responsible_unit_name: "Unidade A fictícia" });
    expect(String(f.calls.find(call => call.method === "select")?.args[0])).not.toContain("!inner");
    expect(f.create).toHaveBeenCalledTimes(1);
  });
  it("parâmetros inválidos e detalhe malformado falham antes de criar cliente", async () => {
    expect((await getActivityDrafts({ pageSize: 51 })).state).toBe("unavailable");
    expect((await getActivityDraft("../forged")).state).toBe("invalid");
    expect(f.create).not.toHaveBeenCalled();
  });
  it("detalhe não visível ou inexistente tem o mesmo resultado sem dados", async () => {
    f.response = { data: null, error: null, status: 200 };
    expect(await getActivityDraft(id)).toMatchObject({ state: "not-found", data: null });
  });
  it("detalhe válido é explicitamente projectado; estado diferente não é tratado como draft", async () => {
    f.response = { data: row, error: null, status: 200 };
    expect(await getActivityDraft(id)).toMatchObject({ state: "ok", data: { id, creator_name: "Criador fictício" } });
    f.response = { data: { ...row, status: "completed" }, error: null, status: 200 };
    expect(await getActivityDraft(id)).toMatchObject({ state: "unavailable", data: null });
  });
  it("erro técnico não expõe o diagnóstico interno no detalhe ou na lista", async () => {
    f.response = { data: null, error: { code: "08006", message: "PRIVATE_BACKEND_CANARY" }, status: 503 };
    expect(JSON.stringify(await getActivityDraft(id))).not.toContain("PRIVATE_BACKEND_CANARY");
    expect(JSON.stringify(await getActivityDrafts())).not.toContain("PRIVATE_BACKEND_CANARY");
  });
});

describe("RPC do rascunho: intenção estável e resposta confirmada", () => {
  it("chama a RPC da sessão só com os quatro campos permitidos", async () => {
    f.response = { data: { id, code: row.code, status: "draft", version: 1, replayed: false }, error: null, status: 200 };
    expect(await createActivityDraftRecord(input)).toMatchObject({ state: "ok", data: { id, replayed: false } });
    expect(f.rpc).toHaveBeenCalledExactlyOnceWith("create_activity_draft", { unit_id: unit, title: input.title, description: "", request_id: requestId });
  });
  it.each([null, {}, { id }, { id, code: row.code, status: "completed", version: 1, replayed: false }, { id, code: row.code, status: "draft", version: 2, replayed: false }])("dados de criação inválidos %j não declaram sucesso", async data => {
    f.response = { data, error: null, status: 200 };
    expect(await createActivityDraftRecord(input)).toMatchObject({ state: "unavailable", data: null, retryable: true });
  });
  it.each([["42501", "refused", false], ["22023", "validation", false], ["23505", "conflict", false], ["42883", "unavailable", false], ["08006", "unavailable", true]] as const)("erro %s torna-se %s sem perder intenção", async (code, state, retryable) => {
    f.response = { data: null, error: { code, message: "PRIVATE_BACKEND_CANARY" }, status: 400 };
    const result = await createActivityDraftRecord(input);
    expect(result).toMatchObject({ state, data: null, retryable });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_BACKEND_CANARY");
  });
  it("falha de transporte pode ter confirmado a escrita: devolve incerteza e não repete", async () => {
    f.rpc.mockRejectedValue(new Error("PRIVATE_TRANSPORT_CANARY"));
    expect(await createActivityDraftRecord(input)).toMatchObject({ state: "unavailable", data: null, retryable: true });
    expect(f.rpc).toHaveBeenCalledTimes(1);
  });
  it("directório de unidades só usa a RPC autorizada e não converte null em vazio", async () => {
    f.response = { data: null, error: null, status: 200 };
    expect(await getActivityDraftUnits()).toMatchObject({ state: "unavailable", data: [] });
    expect(f.rpc).toHaveBeenCalledExactlyOnceWith("list_activity_draft_units");
    f.response = { data: [{ id: unit, code: "A", name: "Unidade A fictícia" }], error: null, status: 200 };
    expect(await getActivityDraftUnits()).toMatchObject({ state: "ok", data: [{ id: unit }] });
  });
});
