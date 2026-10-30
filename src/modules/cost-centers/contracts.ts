import { z } from "zod";
export const referenceSourceSchema = z.enum([
  "manual",
  "csv",
  "xlsx",
  "sap",
  "primavera",
  "other",
]);
export const costCenterRecordSchema = z
  .object({
    code: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(160),
    description: z.string().max(2000).optional(),
    parentCode: z.string().trim().min(1).max(80).nullable().optional(),
    active: z.boolean(),
    responsibleId: z.uuid().nullable().optional(),
    unitId: z.uuid().nullable().optional(),
    sourceSystem: referenceSourceSchema,
    externalId: z.string().min(1).max(200).optional(),
    validFrom: z.iso.date(),
    validUntil: z.iso.date().nullable().optional(),
  })
  .refine(
    (r) => !r.validUntil || r.validUntil >= r.validFrom,
    "Vigência inválida",
  )
  .refine(
    (r) => r.parentCode !== r.code,
    "Centro de custo não pode ser seu próprio superior",
  );
export type CostCenterRecord = z.infer<typeof costCenterRecordSchema>;
export type ImportPreview = {
  created: readonly CostCenterRecord[];
  updated: readonly { before: CostCenterRecord; after: CostCenterRecord }[];
  potentiallyInactive: readonly string[];
  errors: readonly { row: number; field: string; message: string }[];
  requiresExplicitConfirmation: true;
  deleteMissing: false;
};
export function validateCostCenterBatch(input: unknown) {
  const parsed = z.array(costCenterRecordSchema).max(100000).safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      issues: parsed.error.issues.map((i) => i.message),
    };
  const codes = new Set<string>();
  for (const row of parsed.data) {
    if (codes.has(row.code))
      return {
        success: false as const,
        issues: [`Código duplicado: ${row.code}`],
      };
    codes.add(row.code);
  }
  const parents = new Map(parsed.data.map((row) => [row.code, row.parentCode]));
  for (const code of codes) {
    const visited = new Set<string>();
    let current: string | null | undefined = code;
    while (current && parents.has(current)) {
      if (visited.has(current))
        return {
          success: false as const,
          issues: ["Hierarquia circular no lote"],
        };
      visited.add(current);
      current = parents.get(current);
    }
  }
  return { success: true as const, records: parsed.data };
}
