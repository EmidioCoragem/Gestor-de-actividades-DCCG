import { describe, expect, it } from "vitest";
import { getNavigationItems } from "../../src/modules/navigation";
describe("Configuração visual de navegação, sem autorização", () => {
  it("apresenta todos os módulos informativos por defeito", () => {
    expect(getNavigationItems()).toHaveLength(11);
  });
  it("limita apenas os links apresentados e mantém o Dashboard", () => {
    expect(
      getNavigationItems(["actividades", "fecho-mensal"]).map(
        (item) => item.slug,
      ),
    ).toEqual(["", "actividades", "fecho-mensal"]);
  });
  it("configuração vazia mantém apenas o início, sem conceder perfil funcional", () => {
    expect(getNavigationItems([]).map((item) => item.slug)).toEqual([""]);
  });
});
