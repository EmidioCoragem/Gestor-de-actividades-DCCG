import type { CostCenterRecord } from "@/modules/cost-centers/contracts";
export type ReferenceEntity = "cost_center" | "organizational_unit" | "worker";
export type ExternalIdentity = {
  source: string;
  entity: ReferenceEntity;
  externalId: string;
  internalId: string;
  lastSyncedAt: string | null;
  authoritative: boolean;
};
export type IntegrationIssue = {
  externalId?: string;
  code: "duplicate" | "conflict" | "invalid" | "unavailable";
  message: string;
};
export interface ReferenceAdapter {
  readonly source: string;
  readonly capabilities: readonly ReferenceEntity[];
  readCostCenters(cursor?: string): Promise<{
    records: readonly CostCenterRecord[];
    nextCursor?: string;
    issues: readonly IntegrationIssue[];
  }>;
}
export type SyncPlan = {
  source: string;
  mode: "manual" | "scheduled";
  previewRequired: true;
  deleteMissing: false;
  conflictPolicy: "require_resolution";
  auditActorId: string;
};
// Não são conectores. Descritores sem rede: APIs/versões/licenças precisam de estudo posterior.
export const plannedAdapters = [
  { source: "sap", status: "not_implemented" },
  { source: "primavera", status: "not_implemented" },
] as const;
export class UnconfiguredReferenceAdapter implements ReferenceAdapter {
  readonly capabilities = [] as const;
  constructor(readonly source: string) {}
  async readCostCenters() {
    return {
      records: [],
      issues: [
        {
          code: "unavailable" as const,
          message:
            "Adaptador não configurado. Os dados locais mantêm-se disponíveis.",
        },
      ],
    };
  }
}
