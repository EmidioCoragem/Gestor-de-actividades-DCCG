import type {
  DemoChoice,
  DemoColumn,
  DemoPersonaId,
  DemoRow,
  DemoScenario,
  DemoSectionId,
  DemoSectionResult,
} from "./policy";

/** Fixture independente: sem Auth, clientes Supabase, .env, rede ou persistência. */
export const DEMO_REFERENCE_INSTANT = "2026-11-13T12:00:00Z";
export const DEMO_NOTICE =
  "Demonstração com dados 100% fictícios, apenas de leitura. Matriz ilustrativa; não comprova autenticação, RLS, instalação AT/AF ou homologação reais.";

function freeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export const DEMO_PERSONAS: readonly DemoChoice<DemoPersonaId>[] = freeze([
  { id: "at", label: "Administrador técnico fictício" },
  { id: "af", label: "Administrador funcional fictício (AF)" },
  { id: "gestor", label: "Gestor fictício do Departamento A" },
  { id: "leitor", label: "Leitor fictício do Departamento A" },
  { id: "inactivo", label: "Cenário de utilizador inactivo fictício" },
]);
export const DEMO_SECTIONS: readonly DemoChoice<DemoSectionId>[] = freeze([
  { id: "identificacao", label: "Identificação do cenário" },
  { id: "utilizadores", label: "Utilizadores fictícios" },
  { id: "estrutura", label: "Estrutura fictícia" },
  { id: "historico", label: "Histórico fictício" },
  { id: "permissoes", label: "Permissões ilustrativas" },
]);

type UnitId = "empresa" | "dep-a" | "dep-b";
type Person = Readonly<{
  id: string;
  name: string;
  unit: UnitId | null;
  position: string;
  status: "Activo" | "Inactivo";
}>;
type Period = Readonly<{ from: string; until: string | null }>;
type Association = Period & Readonly<{
  person: string;
  unit: UnitId;
  position: string;
}>;
const units: readonly Readonly<{
  id: UnitId;
  name: string;
  kind: string;
  parent: UnitId | null;
}>[] = freeze([
  { id: "empresa", name: "Empresa Exemplo — organização fictícia", kind: "Empresa", parent: null },
  { id: "dep-a", name: "Departamento A — Operações fictícias", kind: "Departamento", parent: "empresa" },
  { id: "dep-b", name: "Departamento B — Laboratório fictício", kind: "Departamento", parent: "empresa" },
]);
const people: readonly Person[] = freeze([
  { id: "conta-at", name: "Conta AT — pessoa fictícia", unit: null, position: "Administração técnica fictícia", status: "Activo" },
  { id: "conta-af", name: "Conta AF — pessoa fictícia", unit: null, position: "Responsável de acessos fictício", status: "Activo" },
  { id: "gestor-a", name: "Gestora A — pessoa fictícia", unit: "dep-a", position: "Gestor fictício", status: "Activo" },
  { id: "leitor-a", name: "Leitora A — pessoa fictícia", unit: "dep-a", position: "Técnico fictício", status: "Activo" },
  { id: "ana", name: "Ana Exemplo — pessoa fictícia", unit: "dep-a", position: "Técnico fictício", status: "Activo" },
  { id: "bento", name: "Bento Exemplo — pessoa fictícia", unit: "dep-b", position: "Gestor fictício", status: "Activo" },
  { id: "conta-inactiva", name: "Conta inactiva — pessoa fictícia", unit: "dep-a", position: "Técnico fictício", status: "Inactivo" },
]);
const associations: readonly Association[] = freeze([
  { person: "ana", unit: "dep-b", position: "Técnico fictício", from: "2026-06-01T08:00:00Z", until: "2026-09-01T08:00:00Z" },
  { person: "ana", unit: "dep-a", position: "Técnico fictício", from: "2026-09-01T08:00:00Z", until: null },
  { person: "gestor-a", unit: "dep-a", position: "Gestor fictício", from: "2026-06-01T08:00:00Z", until: null },
  { person: "leitor-a", unit: "dep-a", position: "Técnico fictício", from: "2026-07-01T08:00:00Z", until: null },
  { person: "bento", unit: "dep-b", position: "Gestor fictício", from: "2026-06-01T08:00:00Z", until: null },
]);
const responsibilities: readonly (Period & Readonly<{ person: string; unit: UnitId }>)[] = freeze([
  { person: "gestor-a", unit: "dep-a", from: "2026-06-01T08:00:00Z", until: null },
  { person: "bento", unit: "dep-b", from: "2026-06-01T08:00:00Z", until: null },
]);
const reporting: readonly (Period & Readonly<{ person: string; supervisor: string; unit: UnitId }>)[] = freeze([
  { person: "ana", supervisor: "gestor-a", unit: "dep-a", from: "2026-09-01T08:00:00Z", until: null },
  { person: "leitor-a", supervisor: "gestor-a", unit: "dep-a", from: "2026-07-01T08:00:00Z", until: null },
]);
const scenarios: Readonly<Record<DemoPersonaId, DemoScenario>> = freeze({
  at: { id: "at", label: "Administrador técnico fictício", description: "Consulta exclusivamente o cadastro técnico fictício; não recebe estrutura, cargos, histórico ou atribuições funcionais.", active: true, allowedSections: ["identificacao", "utilizadores"], scopeLabel: "Cadastro técnico fictício; sem domínio funcional" },
  af: { id: "af", label: "Administrador funcional fictício (AF)", description: "Responsável de acessos fictício, com consulta funcional ilustrativa das duas unidades. Não recebe users.manage nem operações técnicas; nenhuma escrita está disponível.", active: true, allowedSections: ["identificacao", "utilizadores", "estrutura", "historico", "permissoes"], scopeLabel: "Consulta funcional global fictícia" },
  gestor: { id: "gestor", label: "Gestor fictício do Departamento A", description: "Consulta apenas registos do Departamento A. A selecção de cenário não altera contas ou concessões reais.", active: true, allowedSections: ["identificacao", "utilizadores", "estrutura", "historico", "permissoes"], scopeLabel: "Departamento A — Operações fictícias" },
  leitor: { id: "leitor", label: "Leitor fictício do Departamento A", description: "Consulta limitada à estrutura do Departamento A; os restantes pedidos demonstram recusa no servidor isolado.", active: true, allowedSections: ["identificacao", "estrutura"], scopeLabel: "Departamento A — Operações fictícias" },
  inactivo: { id: "inactivo", label: "Cenário de utilizador inactivo fictício", description: "A identificação apresenta só metadados desta simulação. Todas as consultas de dados administrativos são recusadas.", active: false, allowedSections: ["identificacao"], scopeLabel: "Sem acesso a dados administrativos" },
});

export function isDemoPersonaId(value: unknown): value is DemoPersonaId {
  return typeof value === "string" && DEMO_PERSONAS.some((item) => item.id === value);
}
export function isDemoSectionId(value: unknown): value is DemoSectionId {
  return typeof value === "string" && DEMO_SECTIONS.some((item) => item.id === value);
}
export function getDemoScenario(persona: DemoPersonaId): DemoScenario {
  if (!isDemoPersonaId(persona)) throw new RangeError("Cenário de demonstração inválido.");
  return scenarios[persona];
}

function unitName(id: UnitId): string {
  return units.find((unit) => unit.id === id)?.name ?? "Unidade fictícia indisponível";
}
function personName(id: string): string {
  return people.find((person) => person.id === id)?.name ?? "Pessoa fictícia indisponível";
}
function inScope(persona: DemoPersonaId, unit: UnitId): boolean {
  return persona === "af" || ((persona === "gestor" || persona === "leitor") && unit === "dep-a");
}
function date(value: string | null): string {
  if (value === null) return "Sem termo";
  return new Intl.DateTimeFormat("pt-AO", {
    timeZone: "Africa/Luanda", dateStyle: "short", timeStyle: "short",
  }).format(new Date(value));
}
function periodState(period: Period): string {
  if (period.from > DEMO_REFERENCE_INSTANT) return "Futura";
  return period.until !== null && period.until <= DEMO_REFERENCE_INSTANT ? "Encerrada" : "Actual";
}
function table(section: DemoSectionId, columns: readonly DemoColumn[], rows: readonly DemoRow[]): DemoSectionResult {
  return freeze({ allowed: true, title: DEMO_SECTIONS.find((item) => item.id === section)!.label,
    description: `${DEMO_NOTICE} Referência temporal fixa: 13/11/2026, 13:00, Africa/Luanda.`, columns, rows });
}

/** Projecção executada no servidor de demonstração; nunca enviar a fixture completa. */
export function getDemoSection(persona: DemoPersonaId, section: DemoSectionId): DemoSectionResult {
  if (!isDemoPersonaId(persona) || !isDemoSectionId(section)) {
    return freeze({ allowed: false, title: "Selecção inválida", description: DEMO_NOTICE,
      reason: "O cenário ou a secção não pertence à demonstração autorizada." });
  }
  const scenario = getDemoScenario(persona);
  if (!scenario.allowedSections.includes(section)) {
    return freeze({ allowed: false, title: "Consulta recusada nesta demonstração", description: DEMO_NOTICE,
      reason: scenario.active ? "Esta secção está fora do âmbito ilustrativo do cenário seleccionado." : "O cenário inactivo não tem acesso a dados administrativos." });
  }
  if (section === "identificacao") return table(section,
    [{ key: "campo", label: "Campo" }, { key: "valor", label: "Metadado do cenário fictício" }],
    [{ campo: "Cenário", valor: scenario.label }, { campo: "Estado ilustrativo", valor: scenario.active ? "Activo" : "Inactivo" },
      { campo: "Âmbito ilustrativo", valor: scenario.scopeLabel }, { campo: "Operações de escrita", valor: "Nenhuma; demonstração apenas de leitura" }]);
  if (section === "utilizadores") {
    const selected = persona === "at" ? people : people.filter((person) => persona === "af" || (person.unit !== null && inScope(persona, person.unit)));
    if (persona === "at") return table(section,
      [{ key: "nome", label: "Conta fictícia" }, { key: "estado", label: "Estado técnico ilustrativo" }],
      selected.map((person) => ({ nome: person.name, estado: person.status })));
    return table(section, [{ key: "nome", label: "Pessoa fictícia" }, { key: "unidade", label: "Unidade fictícia" }],
      selected.filter((person) => person.unit !== null).map((person) => ({ nome: person.name, unidade: unitName(person.unit!) })));
  }
  if (section === "historico") return table(section,
    [{ key: "pessoa", label: "Pessoa fictícia" }, { key: "unidade", label: "Unidade" }, { key: "cargo", label: "Cargo" },
      { key: "inicio", label: "Início (Luanda)" }, { key: "fim", label: "Fim (Luanda)" }, { key: "estado", label: "Vigência" }],
    associations.filter((item) => inScope(persona, item.unit)).map((item) => ({ pessoa: personName(item.person),
      unidade: unitName(item.unit), cargo: item.position, inicio: date(item.from), fim: date(item.until), estado: periodState(item) })));
  if (section === "estrutura") {
    const rows: DemoRow[] = units.filter((unit) => inScope(persona, unit.id)).map((unit) => ({
      tipo: unit.kind, unidade: unit.name, designacao: unit.parent === null ? "Raiz da empresa fictícia" : inScope(persona, unit.parent) ? unitName(unit.parent) : "Unidade superior fora do cenário",
      inicio: "Não aplicável", fim: "Não aplicável" }));
    for (const unit of units.filter((item) => inScope(persona, item.id))) {
      const positions = new Set(people.filter((person) => person.unit === unit.id).map((person) => person.position));
      for (const position of positions) rows.push({ tipo: "Cargo", unidade: unit.name, designacao: position, inicio: "Não aplicável", fim: "Não aplicável" });
    }
    for (const item of responsibilities.filter((value) => inScope(persona, value.unit))) rows.push({
      tipo: "Responsável", unidade: unitName(item.unit), designacao: personName(item.person), inicio: date(item.from), fim: date(item.until) });
    for (const item of reporting.filter((value) => inScope(persona, value.unit))) rows.push({
      tipo: "Chefia", unidade: unitName(item.unit), designacao: `${personName(item.person)} → ${personName(item.supervisor)}`,
      inicio: date(item.from), fim: date(item.until) });
    return table(section, [{ key: "tipo", label: "Relação fictícia" }, { key: "unidade", label: "Unidade" },
      { key: "designacao", label: "Designação ou relação" }, { key: "inicio", label: "Início (Luanda)" }, { key: "fim", label: "Fim (Luanda)" }], rows);
  }
  const permissions = persona === "af" ? ["access.manage", "users.read", "org.read", "audit.read"] : ["org.read", "users.read"];
  return table(section, [{ key: "perfil", label: "Perfil ilustrativo" }, { key: "capacidade", label: "Capacidade ilustrativa" },
    { key: "ambito", label: "Âmbito" }, { key: "execucao", label: "Execução nesta demonstração" }],
    permissions.map((permission) => ({ perfil: scenario.label, capacidade: permission, ambito: scenario.scopeLabel,
      execucao: "Consulta explicativa; não concede poderes nem executa alterações" })));
}
