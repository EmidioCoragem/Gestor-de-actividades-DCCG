export type ReadStatus = "ok" | "empty" | "refused" | "unavailable";
export type ReadResult<T> =
  | { status: "ok" | "empty"; data: T[] }
  | { status: "refused" | "unavailable"; data: null };

// A list filtered by RLS can legitimately be empty. Only explicit errors/statuses
// identify a refused request; never infer denial or global access from no rows.
export function classifyReadResult<T>(result: {
  data: T[] | null;
  error: { code?: string } | null;
  status?: number;
}): ReadResult<T> {
  if (
    result.status === 401 || result.status === 403 ||
    ["42501", "PGRST301", "PGRST302", "PGRST303"].includes(result.error?.code ?? "")
  ) return { status: "refused", data: null };
  if (
    result.error ||
    (result.status !== undefined && (!Number.isFinite(result.status) || result.status < 200 || result.status >= 300)) ||
    !Array.isArray(result.data)
  )
    return { status: "unavailable", data: null };
  return { status: result.data.length ? "ok" : "empty", data: result.data };
}

export function readSucceeded(result: { status: ReadStatus }) {
  return result.status === "ok" || result.status === "empty";
}

export function readStateMessage(status: Exclude<ReadStatus, "ok">, subject: string, empty: string) {
  if (status === "empty") return empty;
  if (status === "refused") return `A consulta de ${subject} foi recusada. Não foi possível apresentar esta informação com a sessão actual.`;
  return `A consulta de ${subject} está indisponível. Não foi possível confirmar os registos; tente novamente mais tarde.`;
}

// Profile state and relation validity are distinct: a suspended person does not
// turn a future relation into a current one. Use one reference instant per page.
export function validityLabel(validFrom: string, validUntil: string | null, now = new Date()) {
  const start = Date.parse(validFrom);
  const end = validUntil === null ? null : Date.parse(validUntil);
  if (!Number.isFinite(start) || !Number.isFinite(now.getTime()) || (end !== null && (!Number.isFinite(end) || end < start)))
    return "Vigência indisponível";
  if (end !== null && (end === start || end <= now.getTime())) return "Encerrada";
  if (start > now.getTime()) return "Programada";
  return "Em vigor";
}
