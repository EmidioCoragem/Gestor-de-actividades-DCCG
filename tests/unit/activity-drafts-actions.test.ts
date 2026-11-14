import { beforeEach, describe, expect, it, vi } from "vitest";
const f = vi.hoisted(() => ({ headers: vi.fn(), viewer: vi.fn(), write: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/headers", () => ({ headers: f.headers }));
vi.mock("next/cache", () => ({ revalidatePath: f.revalidate }));
vi.mock("@/modules/auth/session", () => ({ requireViewer: f.viewer }));
vi.mock("@/modules/auth/environment", () => ({ applicationOrigin: () => "https://portal.invalid" }));
vi.mock("@/modules/activities/repository", () => ({ createActivityDraftRecord: f.write }));
import { createActivityDraft } from "../../src/modules/activities/actions";

const input = { title: " Título fictício ", responsible_unit_id: "b1000000-0000-4000-8000-000000000002", request_id: "c1000000-0000-4000-8000-000000000001" };
const result = { id: "d1000000-0000-4000-8000-000000000001", code: "ACT-D1000000000040008000000000000001", status: "draft", version: 1, replayed: false };
function form(extra: Record<string, string> = {}) { const value = new FormData(); for (const [key, item] of Object.entries({ ...input, ...extra })) value.set(key, item); return value; }
const state = { status: "idle" as const, message: "" };
beforeEach(() => {
  vi.resetAllMocks(); f.headers.mockResolvedValue(new Headers({ origin: "https://portal.invalid" }));
  f.viewer.mockResolvedValue({ id: "session-actor", permissions: ["activities.create"] });
  f.write.mockResolvedValue({ state: "ok", data: result });
});

describe("Server Action do rascunho usa a sessão e conserva a intenção", () => {
  it("confirma criação só depois da resposta do repositório e invalida apenas a lista", async () => {
    expect(await createActivityDraft(state, form())).toMatchObject({ status: "success", draftId: result.id, code: result.code });
    expect(f.write).toHaveBeenCalledExactlyOnceWith({ ...input, title: "Título fictício", description: "" });
    expect(f.revalidate).toHaveBeenCalledExactlyOnceWith("/actividades");
  });
  it("mantém redirect de sessão, sem converter autenticação em erro de negócio", async () => {
    f.viewer.mockRejectedValue(new Error("NEXT_REDIRECT_SYNTHETIC"));
    await expect(createActivityDraft(state, form())).rejects.toThrow("NEXT_REDIRECT_SYNTHETIC");
    expect(f.write).not.toHaveBeenCalled();
  });
  it.each([null, "null", "https://forged.invalid"])("origem %s é recusada antes de sessão e escrita", async origin => {
    f.headers.mockResolvedValue(new Headers(origin === null ? {} : { origin }));
    expect(await createActivityDraft(state, form())).toMatchObject({ status: "refused", retryable: false });
    expect(f.viewer).not.toHaveBeenCalled(); expect(f.write).not.toHaveBeenCalled();
  });
  it("payload actor/estado forjado não chega à RPC", async () => {
    expect(await createActivityDraft(state, form({ actor_id: "forged", status: "completed" }))).toMatchObject({ status: "validation" });
    expect(f.write).not.toHaveBeenCalled(); expect(f.revalidate).not.toHaveBeenCalled();
  });
  it.each(["validation", "refused", "conflict", "unavailable"] as const)("resposta %s não é promovida a sucesso", async issue => {
    f.write.mockResolvedValue({ state: issue, data: null, retryable: issue === "unavailable", message: "Mensagem sanitizada" });
    expect(await createActivityDraft(state, form())).toMatchObject({ status: issue, message: "Mensagem sanitizada" });
    expect(f.revalidate).not.toHaveBeenCalled();
  });
  it("reenvio de resultado incerto conserva o mesmo request_id e conteúdo", async () => {
    f.write.mockResolvedValueOnce({ state: "unavailable", data: null, retryable: true, message: "Resultado por confirmar" });
    expect(await createActivityDraft(state, form())).toMatchObject({ status: "unavailable", retryable: true });
    await createActivityDraft(state, form());
    expect(f.write.mock.calls[0][0]).toEqual(f.write.mock.calls[1][0]);
    expect(f.write.mock.calls[1][0].request_id).toBe(input.request_id);
  });
});
