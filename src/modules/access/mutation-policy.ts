import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Defesa complementar. Todas as leituras usam a sessão do actor e o seu RLS.
// A decisão atómica, incluindo âmbito, vigência e concorrência, pertence à RPC.
export async function permitsFunctionalMutation(
  db: SupabaseClient,
  actor: string,
  operation: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const role = payload.role_code;
  if (
    (["grant_role", "role_permission"].includes(operation) && role === "technical_admin") ||
    (operation === "role_create" && ["technical_admin", "access_admin"].includes(String(payload.code))) ||
    (operation === "role_permission" &&
      (role === "access_admin" || payload.permission_code === "users.manage"))
  ) return false;

  if (operation === "revoke_role") {
    // Não confiar em role_code/user_id enviados num formulário de revogação.
    const { data, error } = await db.from("user_role_assignments")
      .select("role_code,user_id").eq("id", payload.id).maybeSingle();
    return !error && !!data && typeof data.role_code === "string" &&
      typeof data.user_id === "string" && data.role_code !== "technical_admin" && data.user_id !== actor;
  }
  if (operation === "grant_role" || operation === "user_status") {
    if (payload.user_id === actor) return false;
    const { data, error } = await db.from("user_role_assignments")
      .select("role_code,valid_until").eq("user_id", payload.user_id).eq("role_code", "technical_admin");
    if (error || !Array.isArray(data)) return false;
    // Conservador: não alterar um titular técnico actual/futuro pela aplicação.
    return data.every(row => typeof row.valid_until === "string" &&
      Number.isFinite(Date.parse(row.valid_until)) && Date.parse(row.valid_until) <= Date.now());
  }
  if (operation === "role_permission") {
    const { data, error } = await db.from("user_role_assignments")
      .select("valid_until").eq("user_id", actor).eq("role_code", role);
    if (error || !Array.isArray(data)) return false;
    // Não filtrar valid_from: uma concessão própria futura também está protegida.
    return data.every(row => typeof row.valid_until === "string" &&
      Number.isFinite(Date.parse(row.valid_until)) && Date.parse(row.valid_until) <= Date.now());
  }
  return true;
}
