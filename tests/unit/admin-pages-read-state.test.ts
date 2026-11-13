import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Response = { data: unknown[] | null; error: { code?: string; message?: string } | null; status: number };
const f = vi.hoisted(() => ({
  viewer: vi.fn(), create: vi.fn(),
  responses: {} as Record<string, Response>,
  projections: [] as { table: string; columns: string }[],
}));
vi.mock("@/modules/auth/session", () => ({ requireModule: f.viewer }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: f.create }));
vi.mock("@/modules/access/actions", () => ({
  adminMutation: vi.fn(async () => ({ message: "" })), inviteUser: vi.fn(async () => ({ message: "" })),
}));

// Executa as páginas e componentes reais em SSR. Só as fronteiras de sessão e
// SDK são fictícias; isto não simula um servidor PostgREST nem certifica RLS.
import Administration from "../../src/app/(private)/administracao/page";
import Organization from "../../src/app/(private)/estrutura-organizacional/page";
import Permissions from "../../src/app/(private)/hierarquia-permissoes/page";

const person = "91000000-0000-4000-8000-000000000001";
const supervisor = "91000000-0000-4000-8000-000000000002";
const unit = "92000000-0000-4000-8000-000000000001";
const missing = "99000000-0000-4000-8000-000000000099";
const periods = [
  { suffix: "current", valid_from: "2026-11-01T00:00:00Z", valid_until: null },
  { suffix: "future", valid_from: "2026-11-10T00:00:00Z", valid_until: null },
  { suffix: "ended", valid_from: "2026-10-01T00:00:00Z", valid_until: "2026-11-02T00:00:00Z" },
];
const success = (data: unknown[]): Response => ({ data, error: null, status: 200 });
const denied = (): Response => ({ data: null, error: { code: "42501", message: "PRIVATE_BACKEND_DIAGNOSTIC" }, status: 403 });
const unavailable = (): Response => ({ data: null, error: { code: "08006", message: "PRIVATE_BACKEND_DIAGNOSTIC" }, status: 503 });
const render = async (Page: typeof Administration) => renderToStaticMarkup(await Page());
function section(html: string, title: string) {
  const heading = html.indexOf(`${title}</h2>`);
  expect(heading).toBeGreaterThanOrEqual(0);
  return html.slice(html.lastIndexOf("<section", heading), html.indexOf("</section>", heading));
}
function table(html: string, caption: string) {
  const start = html.indexOf(`<caption>${caption}</caption>`);
  expect(start).toBeGreaterThanOrEqual(0);
  return html.slice(start, html.indexOf("</table>", start));
}
function blocked(html: string, title: string) {
  const form = section(html, title);
  expect(form).toContain('<fieldset disabled="">');
  expect(form).toMatch(/<button[^>]*disabled=""/);
}
function enabled(html: string, title: string) {
  const form = section(html, title);
  expect(form).toContain("<fieldset>");
  expect(form).not.toMatch(/<button[^>]*disabled=""/);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
  f.projections = [];
  f.viewer.mockResolvedValue({ id: "viewer-fictitious", permissions: ["users.manage", "org.manage", "access.manage"] });
  f.responses = {
    profiles: success([
      { id: person, full_name: "Pessoa fictícia autorizada", email: "pessoa@example.invalid", status: "suspended" },
      { id: supervisor, full_name: "Chefia fictícia autorizada", email: "chefia@example.invalid", status: "active" },
    ]),
    organizational_units: success([{ id: unit, code: "D-TEST", name: "Departamento fictício autorizado", kind: "department", parent_id: null, active: true }]),
    positions: success([{ id: "position-fictitious", code: "P-TEST", name: "Cargo fictício autorizado" }]),
    user_positions: success(periods.map(p => ({ id: `membership-${p.suffix}`, user_id: person, unit_id: unit,
      ...p, positions: { name: "Cargo fictício autorizado" }, organizational_units: { name: "Departamento fictício autorizado" } }))),
    reporting_lines: success(periods.map(p => ({ id: `line-${p.suffix}`, user_id: person, supervisor_id: supervisor, unit_id: unit, ...p }))),
    unit_responsibilities: success(periods.map(p => ({ id: `responsible-${p.suffix}`, user_id: supervisor, unit_id: unit, ...p }))),
    roles: success([{ code: "c_reader", name: "Perfil fictício autorizado", technical: false }]),
    permissions: success([{ code: "org.read", description: "Consulta autorizada" }]),
    role_permissions: success([{ role_code: "c_reader", permission_code: "org.read" }]),
    user_role_assignments: success(periods.map(p => ({ id: `grant-${p.suffix}`, user_id: person, role_code: "c_reader", scope_unit_id: unit, ...p }))),
  };
  f.create.mockResolvedValue({
    from: (name: string) => {
      const query = {
        select: (columns: string) => { f.projections.push({ table: name, columns }); return query; },
        eq: () => query, order: () => query, is: () => query,
        then: (resolve: (value: Response) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(f.responses[name] ?? success([])).then(resolve, reject),
      };
      return query;
    },
  });
});
afterEach(() => vi.useRealTimers());

describe("Histórico administrativo real em SSR com leituras fictícias delimitadas", () => {
  it("mostra pessoa, cargo, unidade e vigências sem confundir suspensão com associação encerrada", async () => {
    const html = await render(Administration);
    const history = table(html, "Cargos e unidades ao longo do tempo, no âmbito autorizado");
    for (const text of ["Pessoa fictícia autorizada", "Cargo fictício autorizado", "Departamento fictício autorizado", "Suspenso", "Em vigor", "Programada", "Encerrada", "01:00"])
      expect(history).toContain(text);
    expect(html).toContain("Africa/Luanda");
    expect(f.viewer).toHaveBeenCalledWith("users.read");
  });

  it("aceita relações devolvidas como arrays sem perder designações", async () => {
    f.responses.user_positions = success([{ id: "membership-array", user_id: person, unit_id: unit, ...periods[0],
      positions: [{ name: "Cargo em relação array" }], organizational_units: [{ name: "Unidade em relação array" }] }]);
    const html = await render(Administration);
    expect(html).toContain("Cargo em relação array");
    expect(html).toContain("Unidade em relação array");
  });

  it("relações ausentes não expõem UUID nem inventam a causa da ausência", async () => {
    f.responses.user_positions = success([{ id: "membership-missing", user_id: missing, unit_id: missing, ...periods[0], positions: null, organizational_units: null }]);
    const history = table(await render(Administration), "Cargos e unidades ao longo do tempo, no âmbito autorizado");
    expect(history).toContain("indisponível");
    expect(history).not.toContain(missing);
    expect(history).not.toMatch(/Fora do âmbito|não visível neste âmbito/);
  });

  it.each([["refused", denied], ["unavailable", unavailable]] as const)("histórico %s não é apresentado como vazio e preserva as contas válidas", async (_status, failure) => {
    f.responses.user_positions = failure();
    const html = await render(Administration);
    const history = section(html, "Histórico de associações autorizado");
    expect(history).toMatch(/recusada|indisponível/);
    expect(history).not.toContain("Sem associações visíveis");
    expect(html).toContain("pessoa@example.invalid");
    expect(html).not.toContain("PRIVATE_BACKEND_DIAGNOSTIC");
  });

  it.each(["organizational_units", "positions"])("erro em %s bloqueia apenas a associação dependente", async resource => {
    f.responses[resource] = unavailable();
    const html = await render(Administration);
    blocked(html, "Associar cargo e unidade");
    enabled(html, "Alterar estado da conta");
    enabled(html, "Convidar utilizador");
    expect(html).toContain("indisponível");
    expect(html).not.toContain("PRIVATE_BACKEND_DIAGNOSTIC");
  });

  it("falha de perfis bloqueia selecção de pessoa sem apagar o histórico legível", async () => {
    f.responses.profiles = denied();
    const html = await render(Administration);
    blocked(html, "Alterar estado da conta");
    blocked(html, "Associar cargo e unidade");
    expect(html).toContain("Cargo fictício autorizado");
    expect(html).toContain("Nome do utilizador indisponível");
    expect(html).not.toContain("Não existem contas visíveis neste âmbito.");
  });
});

describe("Estrutura: relações detalhadas e falhas independentes", () => {
  it("apresenta trabalhadores, chefias e responsáveis em vez de simples contagens", async () => {
    const html = await render(Organization);
    for (const caption of ["Trabalhadores, chefias e vigência no âmbito autorizado", "Responsáveis, unidades e vigência no âmbito autorizado"]) {
      const relationships = table(html, caption);
      expect(relationships).toContain("Chefia fictícia autorizada");
      expect(relationships).toContain("Departamento fictício autorizado");
      for (const state of ["Em vigor", "Programada", "Encerrada"]) expect(relationships).toContain(state);
    }
    expect(html).not.toContain("relações de chefia visíveis;");
    expect(f.viewer).toHaveBeenCalledWith("org.read");
  });

  it("falha nas chefias não se transforma em zero nem apaga responsáveis válidos", async () => {
    f.responses.reporting_lines = unavailable();
    const html = await render(Organization);
    const lines = section(html, "Relações de chefia autorizadas");
    expect(lines).toContain("indisponível");
    expect(lines).not.toContain("Sem relações de chefia visíveis");
    expect(lines).not.toContain("0 relações");
    expect(table(html, "Responsáveis, unidades e vigência no âmbito autorizado")).toContain("Chefia fictícia autorizada");
  });

  it("responsabilidades recusadas não apagam as chefias válidas", async () => {
    f.responses.unit_responsibilities = denied();
    const html = await render(Organization);
    expect(section(html, "Responsáveis de unidade autorizados")).toContain("recusada");
    expect(table(html, "Trabalhadores, chefias e vigência no âmbito autorizado")).toContain("Pessoa fictícia autorizada");
    expect(html).not.toContain("PRIVATE_BACKEND_DIAGNOSTIC");
  });

  it.each(["profiles", "organizational_units"])("fonte %s indisponível bloqueia relações sem deduzir nomes de IDs", async resource => {
    f.responses[resource] = unavailable();
    const html = await render(Organization);
    blocked(html, "Definir responsável de unidade");
    blocked(html, "Definir relação de chefia");
    const relationships = table(html, "Trabalhadores, chefias e vigência no âmbito autorizado");
    expect(relationships).toContain("indisponível");
    expect(relationships).not.toContain(person);
    expect(relationships).not.toContain(supervisor);
    expect(relationships).not.toContain(unit);
  });

  it("unidades indisponíveis bloqueiam também a escolha opcional de raiz", async () => {
    f.responses.organizational_units = unavailable();
    const html = await render(Organization);
    blocked(html, "Criar unidade");
    blocked(html, "Actualizar unidade");
    enabled(html, "Criar cargo");
  });
});

describe("Permissões: capacidades e âmbitos não são inferidos de falhas", () => {
  it("mantém estado da conta, âmbito e vigência separados e preserva encerramento programado", async () => {
    const html = await render(Permissions);
    const grants = table(html, "Atribuições autorizadas");
    for (const text of ["Suspenso", "Em vigor", "Programada", "Encerrada", "Perfil fictício autorizado", "Departamento fictício autorizado"])
      expect(grants).toContain(text);
    const revoke = section(html, "Encerrar atribuição");
    expect(revoke).toContain('value="grant-current"');
    expect(revoke).toContain('value="grant-future"');
    expect(revoke).not.toContain('value="grant-ended"');
    expect(f.viewer).toHaveBeenCalledWith("access.manage");
  });

  it("erro de capacidades não significa Sem permissões e bloqueia edição dependente", async () => {
    f.responses.role_permissions = unavailable();
    const html = await render(Permissions);
    const capabilities = section(html, "Catálogo de capacidades");
    expect(capabilities).toContain("indisponível");
    expect(capabilities).not.toContain("Sem permissões");
    blocked(html, "Configurar permissão do perfil");
    enabled(html, "Criar perfil funcional");
    expect(table(html, "Atribuições autorizadas")).toContain("Perfil fictício autorizado");
  });

  it("unidades indisponíveis não activam a alternativa global", async () => {
    f.responses.organizational_units = { data: [], error: null, status: 503 };
    const html = await render(Permissions);
    blocked(html, "Atribuir perfil a terceiro");
    blocked(html, "Encerrar atribuição");
    expect(table(html, "Atribuições autorizadas")).toContain("Designação da unidade indisponível");
    expect(html).not.toContain("Sem unidades visíveis;");
  });

  it("atribuições recusadas não produzem ausência falsa nem diagnóstico privado", async () => {
    f.responses.user_role_assignments = denied();
    const html = await render(Permissions);
    expect(html).toContain("consulta de atribuições autorizadas foi recusada");
    expect(html).not.toContain("Sem atribuições visíveis neste âmbito.");
    expect(html).not.toContain("PRIVATE_BACKEND_DIAGNOSTIC");
    blocked(html, "Encerrar atribuição");
  });

  it("dados relacionados ausentes usam fallback neutro, sem UUID nem perfil inventado", async () => {
    f.responses.user_role_assignments = success([{ id: "grant-missing", user_id: missing, role_code: "private-unknown-role", scope_unit_id: missing, ...periods[0] }]);
    const grants = table(await render(Permissions), "Atribuições autorizadas");
    expect(grants).toContain("indisponível");
    expect(grants).not.toContain(missing);
    expect(grants).not.toContain("private-unknown-role");
  });
});

it.each([
  { Page: Administration, permission: "users.read" },
  { Page: Organization, permission: "org.read" },
  { Page: Permissions, permission: "access.manage" },
])("guarda $permission recusa sessão antes de criar cliente de dados", async ({ Page, permission }) => {
  f.viewer.mockRejectedValue(new Error("SYNTHETIC_SESSION_DENIED"));
  await expect(render(Page)).rejects.toThrow("SYNTHETIC_SESSION_DENIED");
  expect(f.viewer).toHaveBeenCalledWith(permission);
  expect(f.create).not.toHaveBeenCalled();
});
