/** Contratos da demonstração isolada; não são autorizações da aplicação real. */
export type DemoPersonaId = "at" | "af" | "gestor" | "leitor" | "inactivo";
export type DemoSectionId =
  | "identificacao"
  | "utilizadores"
  | "estrutura"
  | "historico"
  | "permissoes";

export type DemoChoice<Id extends string> = Readonly<{ id: Id; label: string }>;
export type DemoScenario = Readonly<{
  id: DemoPersonaId;
  label: string;
  description: string;
  active: boolean;
  allowedSections: readonly DemoSectionId[];
  scopeLabel: string;
}>;
export type DemoColumn = Readonly<{ key: string; label: string }>;
export type DemoRow = Readonly<Record<string, string>>;
export type DemoSectionResult = Readonly<
  | {
      allowed: true;
      title: string;
      description: string;
      columns: readonly DemoColumn[];
      rows: readonly DemoRow[];
    }
  | { allowed: false; title: string; description: string; reason: string }
>;
