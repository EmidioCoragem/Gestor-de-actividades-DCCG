export type ActivityDatabaseIssue = "refused" | "validation" | "conflict" | "schema-unavailable" | "unavailable";

// A origem é a configuração canónica validada no servidor, nunca Host/forwarded.
export function isActivityOriginAllowed(origin: string | null, canonicalOrigin: string) {
  return Boolean(origin && origin !== "null" && origin === canonicalOrigin);
}

export function classifyActivityDatabaseError(error: unknown, status?: number): ActivityDatabaseIssue {
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
  if (status === 401 || status === 403 || ["42501", "PGRST301", "PGRST302", "PGRST303"].includes(code)) return "refused";
  if (["42P01", "42883", "PGRST202", "PGRST205"].includes(code)) return "schema-unavailable";
  if (code === "22023") return "validation";
  if (code === "23505") return "conflict";
  return "unavailable";
}

export function activityReadFailure(error: unknown, status?: number) {
  const issue = classifyActivityDatabaseError(error, status);
  if (issue === "refused") return { state: "refused" as const, message: "A consulta de actividades foi recusada para a sessão actual." };
  return {
    state: "unavailable" as const,
    message: issue === "schema-unavailable"
      ? "O módulo de actividades ainda não está disponível neste ambiente. A instalação autorizada precisa de ser concluída."
      : "Não foi possível confirmar os dados das actividades. Tente novamente mais tarde.",
  };
}
