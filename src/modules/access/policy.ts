export type ScopedGrant = {
  permission: string;
  scope: string | null;
  validFrom: string;
  validUntil: string | null;
};
export function allows(
  grants: readonly ScopedGrant[],
  permission: string,
  unit: string | null,
  ancestors: readonly string[],
  now = new Date(),
) {
  return grants.some(
    (grant) =>
      grant.permission === permission &&
      new Date(grant.validFrom) <= now &&
      (!grant.validUntil || new Date(grant.validUntil) > now) &&
      (grant.scope === null ||
        (unit !== null &&
          (grant.scope === unit || ancestors.includes(grant.scope)))),
  );
}
export function canValidate(
  grants: readonly ScopedGrant[],
  userId: string,
  executors: readonly string[],
  unit: string,
  ancestors: readonly string[],
) {
  return (
    executors.length > 0 &&
    !executors.includes(userId) &&
    allows(grants, "activities.validate", unit, ancestors)
  );
}
// Estes mapas adaptam apresentação. O acesso aos dados é decidido pelo PostgreSQL/RLS.
export const modulePermissions: Record<string, string> = {
  actividades: "activities.read",
  "fecho-mensal": "closing.read",
  kpis: "kpis.read",
  "centros-de-custo": "cost_centers.read",
  "estrutura-organizacional": "org.read",
  "hierarquia-permissoes": "access.manage",
  planeamento: "planning.read",
  relatorios: "reports.read",
  notificacoes: "notifications.read",
  administracao: "users.read",
};
