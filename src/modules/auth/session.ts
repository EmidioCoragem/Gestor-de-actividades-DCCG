import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseIsConfigured } from "./environment";
export const requireViewer = cache(async () => {
  if (!supabaseIsConfigured()) redirect("/configuracao");
  const db = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/entrar");
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id,full_name,email,status")
    .eq("id", user.id)
    .single();
  if (profileError) redirect("/acesso-restrito");
  if (profile.status !== "active") redirect("/acesso-restrito");
  const { data: permissions, error: permissionError } =
    await db.rpc("my_permissions");
  if (permissionError || !Array.isArray(permissions))
    redirect("/acesso-restrito");
  const { data: positions } = await db
    .from("user_positions")
    .select("positions(name),organizational_units(name)")
    .eq("user_id", user.id)
    .is("valid_until", null)
    .lte("valid_from", new Date().toISOString())
    .limit(1);
  const { data: assignments } = await db
    .from("user_role_assignments")
    .select("roles(name),valid_from,valid_until")
    .eq("user_id", user.id);
  const now = new Date();
  const functionalRoles = (assignments ?? []).filter(
    (a) =>
      new Date(a.valid_from) <= now &&
      (!a.valid_until || new Date(a.valid_until) > now),
  );
  const relationName = (value: unknown) => {
    const record = Array.isArray(value) ? value[0] : value;
    return record && typeof record === "object" && "name" in record
      ? String(record.name)
      : "Não associado";
  };
  return {
    id: user.id,
    name: String(profile.full_name),
    email: String(profile.email),
    permissions: permissions as string[],
    position: relationName(positions?.[0]?.positions),
    department: relationName(positions?.[0]?.organizational_units),
    roles: functionalRoles.map((a) => relationName(a.roles)),
  };
});
export async function requirePermission(
  permission: string,
  unit: string | null = null,
) {
  const viewer = await requireViewer();
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc("has_permission", {
    required: permission,
    target: unit,
  });
  if (error || data !== true)
    throw new Error("Operação não autorizada para este âmbito.");
  return viewer;
}
export async function requireModule(permission: string) {
  const viewer = await requireViewer();
  if (!viewer.permissions.includes(permission)) redirect("/acesso-restrito");
  return viewer;
}
