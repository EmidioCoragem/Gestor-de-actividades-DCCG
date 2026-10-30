import { describe, it, expect } from "vitest";
import { allows, canValidate } from "../../src/modules/access/policy";
import { validateMutation } from "../../src/modules/access/validation";
import { validateCostCenterBatch } from "../../src/modules/cost-centers/contracts";
import {
  plannedAdapters,
  UnconfiguredReferenceAdapter,
} from "../../src/modules/integrations/contracts";
const grants = [
  {
    permission: "activities.validate",
    scope: "A",
    validFrom: "2020-01-01T00:00:00Z",
    validUntil: null,
  },
];
describe("Permissão explícita, vigência e âmbito", () => {
  it("nega ausência de concessão", () =>
    expect(allows([], "activities.read", "A", [])).toBe(false));
  it("permite descendente autorizado e nega outra unidade/global", () => {
    expect(allows(grants, "activities.validate", "child", ["A"])).toBe(true);
    expect(allows(grants, "activities.validate", "B", [])).toBe(false);
    expect(allows(grants, "activities.validate", null, [])).toBe(false);
  });
  it("nega concessão futura ou expirada", () => {
    expect(
      allows(
        [{ ...grants[0], validFrom: "2099-01-01" }],
        "activities.validate",
        "A",
        [],
      ),
    ).toBe(false);
    expect(
      allows(
        [{ ...grants[0], validUntil: "2020-01-02" }],
        "activities.validate",
        "A",
        [],
      ),
    ).toBe(false);
  });
  it("proíbe autovalidação e executores vazios", () => {
    expect(canValidate(grants, "self", ["self"], "A", [])).toBe(false);
    expect(canValidate(grants, "self", [], "A", [])).toBe(false);
    expect(canValidate(grants, "self", ["other"], "A", [])).toBe(true);
  });
  it("rejeita operação arbitrária ou dados administrativos inválidos", () => {
    expect(validateMutation("arbitrary", {})).toBeNull();
    expect(
      validateMutation("grant_role", {
        user_id: "invalid",
        role_code: "director",
      }),
    ).toBeNull();
  });
});
const record = {
  code: "000A-01",
  name: "Centro de teste",
  active: true,
  sourceSystem: "csv",
  validFrom: "2026-01-01",
};
describe("Contratos de centros de custo e integração, sem importação real", () => {
  it("preserva zeros e caracteres", () => {
    const r = validateCostCenterBatch([record]);
    expect(r.success && r.records[0].code).toBe("000A-01");
  });
  it("rejeita código numérico, duplicado e vigência inválida", () => {
    expect(validateCostCenterBatch([{ ...record, code: 1 }]).success).toBe(
      false,
    );
    expect(validateCostCenterBatch([record, record]).success).toBe(false);
    expect(
      validateCostCenterBatch([{ ...record, validUntil: "2025-01-01" }])
        .success,
    ).toBe(false);
  });
  it("rejeita ciclos no lote", () =>
    expect(
      validateCostCenterBatch([
        { ...record, parentCode: "B" },
        { ...record, code: "B", parentCode: record.code },
      ]).success,
    ).toBe(false));
  it("adaptadores planeados não acedem a sistemas externos", async () => {
    expect(plannedAdapters.every((a) => a.status === "not_implemented")).toBe(
      true,
    );
    expect(
      (await new UnconfiguredReferenceAdapter("sap").readCostCenters())
        .issues[0].code,
    ).toBe("unavailable");
  });
});

it("converte vigência local de Luanda para UTC sem alterar a hora apresentada", () => {
  const r = validateMutation("grant_role", {
    user_id: "00000000-0000-4000-8000-000000000001",
    role_code: "manager",
    unit_id: "",
    valid_until: "2026-12-01T12:00",
  });
  expect(r && "valid_until" in r && r.valid_until).toBe(
    "2026-12-01T11:00:00.000Z",
  );
});
