import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEMO_NOTICE, DEMO_PERSONAS, DEMO_REFERENCE_INSTANT, DEMO_SECTIONS,
  getDemoScenario, getDemoSection, isDemoPersonaId, isDemoSectionId,
} from "../../src/modules/demo/data";
import type { DemoPersonaId, DemoSectionId } from "../../src/modules/demo/policy";
import { DEMO_CSS, renderDemoEntry, renderDemoPage } from "../../src/components/demo/render";

const departmentB = "Departamento B — Laboratório fictício";
const personB = "Bento Exemplo — pessoa fictícia";
const departmentA = "Departamento A — Operações fictícias";
const allowed: Record<DemoPersonaId, readonly DemoSectionId[]> = {
  at: ["identificacao", "utilizadores"],
  af: ["identificacao", "utilizadores", "estrutura", "historico", "permissoes"],
  gestor: ["identificacao", "utilizadores", "estrutura", "historico", "permissoes"],
  leitor: ["identificacao", "estrutura"],
  inactivo: ["identificacao"],
};

describe("Demonstração: dados inventados e matriz ilustrativa independente de Auth/RLS", () => {
  it("disponibiliza exactamente os cinco cenários e mantém referência temporal fixa", () => {
    expect(DEMO_PERSONAS.map(p => p.id)).toEqual(["at", "af", "gestor", "leitor", "inactivo"]);
    expect(DEMO_REFERENCE_INSTANT).toBe("2026-11-13T12:00:00Z");
    expect(DEMO_NOTICE).toMatch(/100% fictícios/);
    expect(DEMO_NOTICE).toMatch(/não comprova autenticação, RLS/);
  });

  it.each(DEMO_PERSONAS.flatMap(persona => DEMO_SECTIONS.map(section => ({ persona: persona.id, section: section.id }))))(
    "$persona / $section tem decisão explícita no selector do servidor", ({ persona, section }) => {
      const result = getDemoSection(persona, section);
      expect(result.allowed).toBe(allowed[persona].includes(section));
      if (!result.allowed) {
        expect(result).not.toHaveProperty("rows");
        expect(result).not.toHaveProperty("columns");
        expect(result.reason).toBeTruthy();
      }
    },
  );

  it.each([null, undefined, "", "__proto__", "constructor", "admin", "at&persona=af", "<script>", 1])(
    "entrada inválida %j não selecciona cenários ou secções", input => {
      expect(isDemoPersonaId(input)).toBe(false);
      expect(isDemoSectionId(input)).toBe(false);
    },
  );

  it("selectores também recusam entradas inválidas em execução, sem confiar só nos tipos TS", () => {
    expect(() => getDemoScenario("__proto__" as DemoPersonaId)).toThrow(RangeError);
    expect(getDemoSection("constructor" as DemoPersonaId, "estrutura").allowed).toBe(false);
    expect(getDemoSection("af", "unknown" as DemoSectionId).allowed).toBe(false);
  });

  it.each(["gestor", "leitor"] as const)("%s nunca recebe nomes ou histórico do Departamento B", persona => {
    for (const { id } of DEMO_SECTIONS) {
      const content = JSON.stringify(getDemoSection(persona, id));
      expect(content).not.toContain(departmentB);
      expect(content).not.toContain(personB);
    }
    expect(JSON.stringify(getDemoSection(persona, "estrutura"))).toContain(departmentA);
  });

  it("AF pode observar a transferência histórica global sem atribuir poderes técnicos", () => {
    const history = getDemoSection("af", "historico");
    expect(history.allowed).toBe(true);
    if (!history.allowed) throw new Error("Expected allowed fictitious history");
    expect(history.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ pessoa: "Ana Exemplo — pessoa fictícia", unidade: departmentB, estado: "Encerrada" }),
      expect.objectContaining({ pessoa: "Ana Exemplo — pessoa fictícia", unidade: departmentA, estado: "Actual" }),
    ]));
    const permissions = getDemoSection("af", "permissoes");
    expect(permissions.allowed).toBe(true);
    if (!permissions.allowed) throw new Error("Expected allowed fictitious permission explanation");
    expect(permissions.rows.map(r => r.capacidade)).toEqual(["access.manage", "users.read", "org.read", "audit.read"]);
    expect(permissions.rows.some(r => r.capacidade === "users.manage")).toBe(false);
  });

  it("AT recebe só cadastro técnico, sem colunas funcionais, estrutura ou atribuições", () => {
    const result = getDemoSection("at", "utilizadores");
    expect(result.allowed).toBe(true);
    if (!result.allowed) throw new Error("Expected allowed fictitious technical register");
    expect(result.columns.map(c => c.key)).toEqual(["nome", "estado"]);
    for (const row of result.rows) expect(Object.keys(row).sort()).toEqual(["estado", "nome"]);
    for (const id of ["estrutura", "historico", "permissoes"] as const)
      expect(getDemoSection("at", id).allowed).toBe(false);
  });

  it("inactivo mostra apenas metadados, sem nomes de pessoas ou registos administrativos", () => {
    const identification = getDemoSection("inactivo", "identificacao");
    expect(identification.allowed).toBe(true);
    const content = JSON.stringify(identification);
    expect(content).not.toContain("Ana Exemplo");
    expect(content).not.toContain("Bento Exemplo");
    expect(getDemoScenario("inactivo").active).toBe(false);
    for (const section of ["utilizadores", "estrutura", "historico", "permissoes"] as const)
      expect(getDemoSection("inactivo", section)).toMatchObject({ allowed: false });
  });

  it("projecções são congeladas profundamente e tentativas de mutação não alteram consultas seguintes", () => {
    expect(Object.isFrozen(DEMO_PERSONAS)).toBe(true);
    expect(Object.isFrozen(DEMO_PERSONAS[0])).toBe(true);
    const scenario = getDemoScenario("af");
    expect(Object.isFrozen(scenario)).toBe(true);
    expect(Object.isFrozen(scenario.allowedSections)).toBe(true);
    const result = getDemoSection("af", "utilizadores");
    if (!result.allowed) throw new Error("Expected allowed fictitious register");
    expect(Object.isFrozen(result.rows)).toBe(true);
    expect(Object.isFrozen(result.rows[0])).toBe(true);
    const before = JSON.stringify(result);
    expect(() => { (result.rows[0] as Record<string, string>).nome = "altered"; }).toThrow(TypeError);
    expect(JSON.stringify(getDemoSection("af", "utilizadores"))).toBe(before);
  });
});

describe("HTML da demonstração: conteúdo não executável e destinos locais", () => {
  const attack = '<img src=x onerror="alert(1)"> & \'quoted\'';
  it("escapa rótulos e IDs da entrada, mantendo os links no percurso local", () => {
    const html = renderDemoEntry([{ id: attack, label: attack }]);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&quot;");
    expect(html).toContain("&#39;");
    for (const [, href] of html.matchAll(/href="([^"]+)"/g))
      expect(href.startsWith("/") || href.startsWith("#")).toBe(true);
  });

  it("escapa título, metadados, cabeçalhos e valores das tabelas sem HTML injectável", () => {
    const scenario = { ...getDemoScenario("af"), label: attack, description: attack, scopeLabel: attack };
    const html = renderDemoPage({ scenario, currentSection: "permissoes", sections: DEMO_SECTIONS,
      section: { allowed: true, title: attack, description: attack, columns: [{ key: "value", label: attack }], rows: [{ value: attack }] } });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;img");
    expect(html).toContain('scope="col"');
    expect(html).toContain('tabindex="0" role="region"');
  });

  it("também escapa a mensagem de recusa sem apresentar uma tabela de dados", () => {
    const html = renderDemoPage({ scenario: getDemoScenario("at"), currentSection: "estrutura", sections: DEMO_SECTIONS,
      section: { allowed: false, title: attack, description: attack, reason: attack } });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<table");
    expect(html).toContain("&lt;img");
    expect(html).toContain("Acesso recusado nesta demonstração");
  });

  it("o renderer não cria formulários, scripts, URLs externas ou controlos mutadores activos", () => {
    const html = renderDemoPage({ scenario: getDemoScenario("af"), section: getDemoSection("af", "permissoes"), sections: DEMO_SECTIONS, currentSection: "permissoes" });
    expect(html).not.toMatch(/<script\b|<form\b|<iframe\b|<input\b/i);
    const buttons = [...html.matchAll(/<button\b([^>]*)>/g)];
    expect(buttons.length).toBeGreaterThan(0);
    for (const [, attrs] of buttons) expect(attrs).toMatch(/\bdisabled\b/);
    expect(DEMO_CSS).not.toMatch(/@import|https?:\/\//i);
  });
});

it("a fronteira de fontes da demo não importa produção/SDK nem lê ficheiros ou chama rede", () => {
  const paths = ["scripts/demo-fase1.mjs", "scripts/demo-fase1-server.mjs", "src/modules/demo/data.ts", "src/modules/demo/policy.ts", "src/components/demo/render.ts"];
  const allowedImports = new Set(["node:child_process", "node:http", "node:url", "../src/modules/demo/data.ts", "../src/components/demo/render.ts", "./policy"]);
  for (const path of paths) {
    const source = readFileSync(path, "utf8");
    for (const [, dependency] of source.matchAll(/\bfrom\s*["']([^"']+)["']/g)) expect(allowedImports.has(dependency)).toBe(true);
    expect(source).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket|readFile|readFileSync|writeFile|writeFileSync|appendFile)\s*\(/);
    expect(source).not.toMatch(/\bimport\s*\(|\brequire\s*\(/);
  }
  expect(readFileSync("scripts/demo-fase1.mjs", "utf8")).not.toContain("...process.env");
});
