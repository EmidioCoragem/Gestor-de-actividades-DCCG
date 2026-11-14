import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const f = vi.hoisted(() => ({ viewer: vi.fn(), list: vi.fn(), units: vi.fn(), detail: vi.fn() }));
vi.mock("@/modules/auth/session", () => ({ requireModule: f.viewer }));
vi.mock("@/modules/activities/repository", () => ({ getActivityDrafts: f.list, getActivityDraftUnits: f.units, getActivityDraft: f.detail }));
vi.mock("@/modules/activities/actions", () => ({ createActivityDraft: vi.fn(async () => ({ status: "idle", message: "" })) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND_FICTITIOUS"); }, unstable_rethrow: () => {} }));
import Page from "../../src/app/(private)/actividades/page";
import Detail from "../../src/app/(private)/actividades/[id]/page";
import Loading from "../../src/app/(private)/actividades/loading";
import { ActivityDraftForm } from "../../src/components/activities/draft-form";
import styles from "../../src/components/activities/activities.module.css";

const id = "d1000000-0000-4000-8000-000000000001";
const request = "c1000000-0000-4000-8000-000000000001";
const draft = { id, code: "ACT-D1000000000040008000000000000001", title: "Rascunho inteiramente fictício", description: "Descrição fictícia",
  responsible_unit_id: "b1000000-0000-4000-8000-000000000002", created_by: "a1000000-0000-4000-8000-000000000001", status: "draft", version: 1,
  created_at: "2026-11-14T12:00:00Z", updated_at: "2026-11-14T12:00:00Z", responsible_unit_name: "Unidade fictícia A", creator_name: "Pessoa fictícia A" };
const listing = { state: "ok", data: [draft], pagination: { page: 2, pageSize: 10, total: 21, totalPages: 3 }, message: "" };
const unitList = { state: "ok", data: [{ id: draft.responsible_unit_id, code: "A", name: "Unidade fictícia A" }], message: "" };
const page = (search: { pagina?: string; novo?: string } = {}) => Page({ searchParams: Promise.resolve(search) });
const detail = () => Detail({ params: Promise.resolve({ id }) });
function formElement(node: ReactNode): ReactElement<{ requestId: string }> | null {
  if (Array.isArray(node)) return node.map(formElement).find(Boolean) ?? null;
  if (!isValidElement(node)) return null;
  if (node.type === ActivityDraftForm) return node as ReactElement<{ requestId: string }>;
  return formElement((node.props as { children?: ReactNode }).children);
}
beforeEach(() => {
  vi.resetAllMocks(); f.viewer.mockResolvedValue({ permissions: ["activities.read", "activities.create"] });
  f.list.mockResolvedValue(listing); f.units.mockResolvedValue(unitList); f.detail.mockResolvedValue({ state: "ok", data: draft, message: "" });
});

describe("Páginas reais de rascunho: SSR fictício nas fronteiras de sessão/dados", () => {
  it("lista e pagina os dados autorizados sem declarar atribuição/conclusão", async () => {
    const html = renderToStaticMarkup(await page({ pagina: "2" }));
    expect(html).toContain(draft.title); expect(html).toContain("Rascunho incompleto");
    expect(html).toContain('href="/actividades?pagina=1"'); expect(html).toContain('href="/actividades?pagina=3"');
    expect(html).toContain(`href="/actividades/${id}"`);
    expect(f.list).toHaveBeenCalledExactlyOnceWith({ page: 2, pageSize: 10 });
  });
  it("revalidação/paginação não muda a key da intenção; só nova criação explícita a muda", async () => {
    const first = formElement(await page()); const next = formElement(await page({ pagina: "2" }));
    expect(first).not.toBeNull(); expect(next?.key).toBe(first?.key);
    expect(formElement(await page({ novo: request }))?.key).not.toBe(first?.key);
  });
  it.each(["empty", "refused", "unavailable"])("unidades %s não apresentam acção de criação", async state => {
    f.units.mockResolvedValue({ state, data: [], message: "" });
    const html = renderToStaticMarkup(await page());
    expect(html).not.toContain("Guardar rascunho");
    expect(html).not.toContain('name="request_id"');
    expect(html).toContain(draft.title);
  });
  it("actor só de leitura não recebe formulário nem consulta de unidades de criação", async () => {
    f.viewer.mockResolvedValue({ permissions: ["activities.read"] });
    expect(renderToStaticMarkup(await page())).not.toContain("Guardar rascunho");
    expect(f.units).not.toHaveBeenCalled();
  });
  it.each(["refused", "unavailable"])("listagem %s não vira lista vazia ou contagem zero", async state => {
    f.list.mockResolvedValue({ ...listing, state, data: [], pagination: { ...listing.pagination, total: null, totalPages: null } });
    const html = renderToStaticMarkup(await page());
    expect(html).not.toContain("Não existem rascunhos visíveis"); expect(html).not.toContain("Página 1 de 0");
    expect(html).toMatch(/recusada|Não foi possível carregar/);
  });
  it("detalhe com joins ocultos não inventa nomes nem usa UUID como designação", async () => {
    f.detail.mockResolvedValue({ state: "ok", data: { ...draft, responsible_unit_name: null, creator_name: null }, message: "" });
    const html = renderToStaticMarkup(await detail());
    expect(html).toContain("Designação da unidade indisponível"); expect(html).toContain("Nome do criador indisponível");
    expect(html).not.toContain(draft.created_by); expect(html).not.toContain(draft.responsible_unit_id);
  });
  it.each(["invalid", "not-found"])("detalhe %s usa notFound sem divulgar a causa RLS", async state => {
    f.detail.mockResolvedValue({ state, data: null, message: "" });
    await expect(detail()).rejects.toThrow("NEXT_NOT_FOUND_FICTITIOUS");
  });
  it("guarda antecede toda a leitura das duas páginas", async () => {
    f.viewer.mockRejectedValue(new Error("SESSION_DENIED_FICTITIOUS"));
    await expect(page()).rejects.toThrow("SESSION_DENIED_FICTITIOUS");
    await expect(detail()).rejects.toThrow("SESSION_DENIED_FICTITIOUS");
    expect(f.list).not.toHaveBeenCalled(); expect(f.units).not.toHaveBeenCalled(); expect(f.detail).not.toHaveBeenCalled();
  });
  it("HTML SSR de estados reais pode ser verificado no browser sem simular Auth", async () => {
    const artifacts: Record<string, string> = { list: renderToStaticMarkup(await page({ pagina: "2" })) };
    f.detail.mockResolvedValue({ state: "ok", data: { ...draft, title: "X".repeat(200) }, message: "" });
    artifacts.detail = renderToStaticMarkup(await detail());
    for (const state of ["empty", "refused", "unavailable"]) {
      f.list.mockResolvedValue({ ...listing, state, data: [], pagination: { ...listing.pagination, total: state === "empty" ? 0 : null, totalPages: state === "empty" ? 0 : null } });
      f.units.mockResolvedValue({ state: "empty", data: [], message: "" });
      artifacts[state] = renderToStaticMarkup(await page());
    }
    artifacts.loading = renderToStaticMarkup(Loading());
    const destination = process.env.GESTOR_F01_SSR_DIR;
    if (destination) {
      const directory = realpathSync(destination);
      if (!directory.startsWith("/tmp/gestor-f01-browser-")) throw new Error("Only owned fictitious browser fixture directory is allowed");
      const globalCss = readFileSync("src/app/globals.css", "utf8").replace(/^@import\s+"tailwindcss";\s*/, "");
      const moduleCss = readFileSync("src/components/activities/activities.module.css", "utf8")
        .replace(/\.([A-Za-z_][A-Za-z_0-9-]*)/g, (match, name: string) => styles[name] ? `.${styles[name]}` : match);
      for (const [name, html] of Object.entries(artifacts)) writeFileSync(join(directory, `${name}.html`),
        `<!doctype html><html lang="pt-AO"><head><meta charset="utf-8"><style>${globalCss}\n${moduleCss}</style></head><body><main>${html}</main></body></html>`, { mode: 0o600, flag: "wx" });
    }
    expect(artifacts.detail).toContain("X".repeat(200));
    expect(artifacts.empty).toContain("Não existem rascunhos visíveis");
    expect(artifacts.loading).not.toContain(draft.title);
  });
});
