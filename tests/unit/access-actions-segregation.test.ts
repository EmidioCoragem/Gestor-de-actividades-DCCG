import { beforeEach, describe, expect, it, vi } from "vitest";
const f = vi.hoisted(() => ({ viewer: vi.fn(), create: vi.fn(), rpc: vi.fn(), read: vi.fn(), revalidate: vi.fn(), from: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: f.revalidate }));
vi.mock("@/modules/auth/session", () => ({ requireViewer: f.viewer, requirePermission: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: f.create }));
// A API administrativa não pode ser usada como alternativa à RPC da sessão.
vi.mock("@supabase/supabase-js", () => ({ createClient: () => { throw new Error("AUTH_ADMIN_FORBIDDEN_IN_TEST"); } }));
import { adminMutation } from "../../src/modules/access/actions";
const actor = "80000000-0000-4000-8000-000000000002";
const target = "80000000-0000-4000-8000-000000000004";
const assignment = "82000000-0000-4000-8000-000000000001";
function submit(operation: string, values: Record<string, string>) {
  const form = new FormData(); form.set("operation", operation);
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return adminMutation({ message: "" }, form);
}
beforeEach(() => {
  vi.resetAllMocks();
  f.viewer.mockResolvedValue({ id: actor, permissions: ["access.manage"] });
  f.read.mockReturnValue({ data: [], error: null });
  f.rpc.mockResolvedValue({ error: null });
  f.from.mockImplementation(() => {
    const chain = {
      select: vi.fn(() => chain), eq: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => f.read()),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve().then(() => f.read()).then(resolve, reject),
    };
    return chain;
  });
  f.create.mockResolvedValue({ from: f.from, rpc: f.rpc });
});

describe("Server Action: segregação complementar, sem serviços reais", () => {
  it.each([
    ["grant_role", { user_id: target, role_code: "technical_admin" }],
    ["grant_role", { user_id: target, role_code: " technical_admin " }],
    ["grant_role", { user_id: actor, role_code: "c_subject" }],
    ["role_create", { code: "technical_admin", name: "Reserved" }],
    ["role_create", { code: "access_admin", name: "Reserved" }],
    ["role_permission", { role_code: "technical_admin", permission_code: "org.manage", enabled: "true" }],
    ["role_permission", { role_code: "technical_admin", permission_code: "users.manage", enabled: "false" }],
    ["role_permission", { role_code: "access_admin", permission_code: "org.manage", enabled: "true" }],
    ["role_permission", { role_code: "c_subject", permission_code: "users.manage", enabled: "true" }],
  ] satisfies [string, Record<string, string>][])("recusa %s reservado antes da RPC (%#)", async (operation, payload) => {
    expect((await submit(operation, payload)).success).not.toBe(true);
    expect(f.rpc).not.toHaveBeenCalled(); expect(f.revalidate).not.toHaveBeenCalled();
  });
  it.each(["grant_role", "user_status"])("%s não altera titular técnico futuro", async operation => {
    f.read.mockReturnValue({ data: [{ role_code: "technical_admin", valid_until: null }], error: null });
    expect((await submit(operation, { user_id: target, role_code: "c_subject", status: "active" })).success).not.toBe(true);
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it("revoke_role consulta a concessão armazenada e ignora campos falsificados", async () => {
    f.read.mockReturnValue({ data: { role_code: "technical_admin", user_id: target }, error: null });
    await submit("revoke_role", { id: assignment, role_code: "technician", user_id: actor });
    expect(f.from).toHaveBeenCalledWith("user_role_assignments"); expect(f.rpc).not.toHaveBeenCalled();
  });
  it("recusa revogação própria mesmo com alvo falsificado", async () => {
    f.read.mockReturnValue({ data: { role_code: "c_subject", user_id: actor }, error: null });
    await submit("revoke_role", { id: assignment, user_id: target });
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it("recusa alteração de capacidades de papel próprio futuro", async () => {
    f.read.mockReturnValue({ data: [{ valid_until: "2999-01-01T00:00:00Z" }], error: null });
    await submit("role_permission", { role_code: "c_future", permission_code: "org.manage", enabled: "true" });
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: null },
    { data: null, error: { message: "LOCAL_PRIVATE_DETAIL" } },
  ])("revogação desconhecida/ilegível falha fechada (%#)", async result => {
    f.read.mockReturnValue(result);
    const response = await submit("revoke_role", { id: assignment });
    expect(f.rpc).not.toHaveBeenCalled(); expect(response.message).not.toContain("LOCAL_PRIVATE_DETAIL");
  });
  it("erro de transporte da leitura falha fechado sem expor detalhes", async () => {
    f.read.mockImplementation(() => { throw new Error("LOCAL_PRIVATE_DETAIL"); });
    const response = await submit("grant_role", { user_id: target, role_code: "c_subject" });
    expect(f.rpc).not.toHaveBeenCalled(); expect(response.message).not.toContain("LOCAL_PRIVATE_DETAIL");
  });
  it("sessão inválida pára antes de qualquer cliente de dados", async () => {
    f.viewer.mockRejectedValue(new Error("LOCAL_SESSION_DENIED"));
    await expect(submit("grant_role", { user_id: target, role_code: "c_subject" })).rejects.toThrow("LOCAL_SESSION_DENIED");
    expect(f.create).not.toHaveBeenCalled();
  });
  it.each([
    ["grant_role", { user_id: target, role_code: "c_subject" }],
    ["role_permission", { role_code: "c_subject", permission_code: "org.read", enabled: "true" }],
    ["role_create", { code: "c_subject", name: "Subject" }],
  ] satisfies [string, Record<string, string>][])("encaminha %s permitido à RPC da sessão (%#)", async (operation, payload) => {
    expect((await submit(operation, payload)).success).toBe(true);
    expect(f.rpc).toHaveBeenCalledExactlyOnceWith("admin_mutation", { operation, payload });
    expect(f.revalidate).toHaveBeenCalledExactlyOnceWith("/", "layout");
  });
  it("revogação funcional permitida continua a usar o ID validado", async () => {
    f.read.mockReturnValue({ data: { role_code: "c_subject", user_id: target }, error: null });
    expect((await submit("revoke_role", { id: assignment })).success).toBe(true);
    expect(f.rpc).toHaveBeenCalledExactlyOnceWith("admin_mutation", { operation: "revoke_role", payload: { id: assignment } });
  });
  it("recusa final da base não é convertida em sucesso nem divulgada", async () => {
    f.rpc.mockResolvedValue({ error: { message: "LOCAL_PRIVATE_DB_DETAIL" } });
    const response = await submit("grant_role", { user_id: target, role_code: "c_subject" });
    expect(response.success).not.toBe(true); expect(response.message).not.toContain("LOCAL_PRIVATE_DB_DETAIL");
    expect(f.revalidate).not.toHaveBeenCalled();
  });
});
