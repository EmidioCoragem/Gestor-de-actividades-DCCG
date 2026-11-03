import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const sql = await readFile("supabase/inspection/fase1-post-migration.sql", "utf8");
type Check = { categoria: string; estado: string; objecto: string; detalhe: Record<string, unknown>; total_linhas: number | string };
async function inspect() {
  return (await db.exec(sql)).flatMap((r) => r.rows as Check[]);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email varchar(255),raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;`);
  await db.exec(await readFile("supabase/migrations/202610300001_fase1.sql", "utf8"));
}, 60000);
afterAll(async () => { await db?.close(); });

describe("Inspecção pós-migração exclusivamente de leitura", () => {
  it("confere referência, relações, RLS, privilégios e RPCs sem falsos alertas locais", async () => {
    const rows = await inspect();
    expect(rows.every((r) => Number(r.total_linhas) === rows.length)).toBe(true);
    expect(rows.filter((r) => ["REVER", "BLOQUEIO"].includes(r.estado))).toEqual([]);
    const summary = rows.find((r) => r.categoria === "00_resumo")!;
    expect(summary.detalhe).toMatchObject({ tabelas: 16, tabelas_rls: 16, politicas: 13,
      funcoes_public: 12, triggers_referencia: 17, read_only: "on" });
    expect(rows.filter((r) => r.categoria === "01_catalogo_table")).toHaveLength(16);
    expect(rows.filter((r) => r.categoria === "01_catalogo_policy")).toHaveLength(13);
    expect(rows.filter((r) => r.categoria === "01_catalogo_trigger")).toHaveLength(17);
  }, 60000);

  it("detecta RLS desactivada", async () => {
    await db.exec("alter table public.profiles disable row level security");
    try {
      expect((await inspect()).find((r) => r.categoria === "02_rls" && r.objecto === "public.profiles")?.estado).toBe("BLOQUEIO");
    } finally { await db.exec("alter table public.profiles enable row level security"); }
  });

  it("detecta concessões de tabela a PUBLIC e DML por coluna", async () => {
    await db.exec("grant select on public.profiles to public; grant update(email) on public.profiles to authenticated");
    try {
      const rows = await inspect();
      expect(rows.find((r) => r.categoria === "05_PUBLIC_tabelas" && r.objecto === "public.profiles")?.estado).toBe("BLOQUEIO");
      expect(rows.find((r) => r.categoria === "04_privilegios_coluna" && r.objecto === "public.profiles.email / authenticated")?.estado).toBe("BLOQUEIO");
    } finally {
      await db.exec("revoke select on public.profiles from public; revoke update(email) on public.profiles from authenticated");
    }
  });

  it("detecta RPC administrativa anónima e auxiliar indevidamente exposta", async () => {
    await db.exec("grant execute on function public.admin_mutation(text,jsonb) to anon; grant execute on function public.in_unit_scope(uuid,uuid) to authenticated");
    try {
      const rows = await inspect();
      expect(rows.find((r) => r.categoria === "06_RPC" && r.objecto === "public.admin_mutation(text, jsonb)")?.estado).toBe("BLOQUEIO");
      expect(rows.find((r) => r.categoria === "06_RPC" && r.objecto === "public.in_unit_scope(uuid, uuid)")?.estado).toBe("BLOQUEIO");
    } finally {
      await db.exec("revoke execute on function public.admin_mutation(text,jsonb) from anon; revoke execute on function public.in_unit_scope(uuid,uuid) from authenticated");
    }
  });

  it("detecta alteração de política ou corpo de função, mesmo com as contagens correctas", async () => {
    const original = (await db.query<{ definition: string }>("select pg_get_functiondef('public.is_active_user()'::regprocedure) as definition")).rows[0].definition;
    await db.exec("alter policy profile_read on public.profiles using(true); create or replace function public.is_active_user() returns boolean language sql stable security definer set search_path='' as $$select true$$");
    try {
      const rows = await inspect();
      expect(rows.find((r) => r.categoria === "01_catalogo_policy" && r.objecto === "public.profiles.profile_read")?.estado).toBe("REVER");
      expect(rows.find((r) => r.categoria === "01_catalogo_function" && r.objecto === "public.is_active_user()")?.estado).toBe("REVER");
    } finally {
      await db.exec("alter policy profile_read on public.profiles using(id=auth.uid() or public.visible_person(id,'users.read'))");
      await db.exec(original);
    }
  });

  it("detecta relações removidas e chaves externas em falta", async () => {
    await db.exec("alter table public.profiles drop constraint profiles_id_fkey");
    try {
      expect((await inspect()).find((r) => r.categoria === "01_catalogo_constraint" && r.objecto === "public.profiles.profiles_id_fkey")?.estado).toBe("BLOQUEIO");
    } finally {
      await db.exec("alter table public.profiles add constraint profiles_id_fkey foreign key(id) references auth.users(id)");
    }
  });

  it("detecta capacidade funcional acrescentada ao catálogo inicial de administrador técnico", async () => {
    await db.exec("insert into public.role_permissions values('technical_admin','activities.read')");
    try {
      expect((await inspect()).find((r) => r.categoria === "10_catalogos_iniciais" && r.objecto === "role_permissions")?.estado).toBe("REVER");
    } finally {
      await db.exec("delete from public.role_permissions where role_code='technical_admin' and permission_code='activities.read'");
    }
  });
});
