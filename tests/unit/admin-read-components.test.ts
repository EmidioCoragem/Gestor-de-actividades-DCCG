import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/access/actions", () => ({
  adminMutation: vi.fn(async () => ({ message: "" })),
  inviteUser: vi.fn(async () => ({ message: "" })),
}));

import { AdminLoading, AdminReadState } from "../../src/components/admin/read-state";
import { MutationForm } from "../../src/components/admin/mutation-form";
import { SelectField } from "../../src/components/admin/fields";
import AdministrationLoading from "../../src/app/(private)/administracao/loading";
import OrganizationLoading from "../../src/app/(private)/estrutura-organizacional/loading";
import PermissionsLoading from "../../src/app/(private)/hierarquia-permissoes/loading";

describe("Estados administrativos acessíveis, sem dados inventados", () => {
  it.each(["empty", "refused", "unavailable"] as const)("anuncia o estado %s sem o substituir por dados", status => {
    const props = { status, children: "Mensagem autorizada de teste" };
    const html = renderToStaticMarkup(createElement(AdminReadState, props));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
    expect(html).toContain("Mensagem autorizada de teste");
  });

  it.each([AdminLoading, AdministrationLoading, OrganizationLoading, PermissionsLoading])("carregamento real não inclui pessoa, UUID ou resultado antecipado", Component => {
    const html = renderToStaticMarkup(createElement(Component));
    expect(html).toContain("A carregar informação");
    expect(html).toContain('role="status"');
    expect(html).not.toMatch(/@|[a-f0-9]{8}-[a-f0-9]{4}-|Sem atribuições|Sem unidades|0 relações/i);
  });
});

describe("Formulários administrativos: falha de opções não equivale a autorização global", () => {
  function render(disabled: boolean, disabledReason?: string) {
    const props = {
      title: "Formulário de teste", operation: "grant_role", disabled, disabledReason,
      children: createElement(SelectField, { name: "unit_id", label: "Unidade", options: [], optional: true }),
    };
    return renderToStaticMarkup(createElement(MutationForm, props));
  }

  it("bloqueia o fieldset e a submissão quando opções estão indisponíveis", () => {
    const html = render(true, "Não foi possível confirmar as unidades autorizadas.");
    expect(html).toContain('<fieldset disabled="">');
    expect(html).toMatch(/<button[^>]*disabled=""/);
    expect(html).toContain("Não foi possível confirmar as unidades autorizadas.");
    const reasonId = html.match(/<form[^>]*aria-describedby="([^"]+)"/)?.[1];
    expect(reasonId).toBeTruthy();
    expect(html).toContain(`id="${reasonId}" role="status"`);
  });

  it("uma opção global vazia não desbloqueia o formulário indisponível", () => {
    const html = render(true, "Consulta indisponível.");
    expect(html).toContain('value=""');
    expect(html).toContain('<fieldset disabled="">');
    expect(html).toContain('aria-describedby="');
  });

  it("uma fonte válida não é bloqueada artificialmente", () => {
    const html = render(false);
    expect(html).toContain("<fieldset>");
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('aria-describedby="');
  });

  it("rótulo de unidade opcional distingue hierarquia de âmbito global", () => {
    const html = renderToStaticMarkup(createElement(SelectField, {
      name: "parent_id", label: "Unidade superior", options: [], optional: true,
      optionalLabel: "Sem unidade superior (raiz autorizada)",
    }));
    expect(html).toContain("Sem unidade superior (raiz autorizada)");
    expect(html).not.toContain("âmbito global");
  });
});
