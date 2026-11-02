import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const migration = () =>
  readFile("supabase/migrations/202610300001_fase1.sql", "utf8");

async function prepare(db: PGlite, emailType = "varchar(255)") {
  // Isolated PostgreSQL fixture only; no Supabase client or remote connection.
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users (
      id uuid primary key, email ${emailType},
      raw_user_meta_data jsonb default '{}'
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    grant usage on schema public,auth to anon,authenticated;
  `);
}

describe("Pré-migração: compatibilidade Auth e privilégios herdados", () => {
  it.each(["text", "varchar(255)"])(
    "migração integral e trigger aceitam auth.users.email %s",
    async (emailType) => {
      const db = new PGlite();
      try {
        await prepare(db, emailType);
        const inspection = await db.exec(
          await readFile("supabase/inspection/fase1-auth-compatibility.sql", "utf8"),
        );
        const checks = inspection.flatMap((result) => result.rows);
        expect(checks).toHaveLength(3);
        expect(checks.every((row) => row.estado === "OK")).toBe(true);
        const existing = "00000000-0000-4000-8000-000000000001";
        const created = "00000000-0000-4000-8000-000000000002";
        const noEmail = "00000000-0000-4000-8000-000000000003";
        const longEmail = `${"a".repeat(239)}@example.invalid`;
        expect(longEmail).toHaveLength(255);
        await db.query("insert into auth.users(id,email) values($1,$2)", [
          existing, longEmail,
        ]);
        await db.exec(await migration());
        await db.query("insert into auth.users(id,email) values($1,$2)", [
          created, longEmail,
        ]);
        await db.query("insert into auth.users(id,email) values($1,null)", [
          noEmail,
        ]);
        const profiles = await db.query<{
          id: string; email: string; full_name: string; status: string;
        }>("select id,email,full_name,status from public.profiles order by id");
        expect(profiles.rows).toEqual([
          { id: existing, email: longEmail, full_name: longEmail.slice(0, 160), status: "inactive" },
          { id: created, email: longEmail, full_name: longEmail.slice(0, 160), status: "inactive" },
          { id: noEmail, email: "", full_name: "Utilizador", status: "inactive" },
        ]);
        expect((await db.query("select * from public.user_role_assignments")).rows).toHaveLength(0);
        const column = await db.query<{ data_type: string }>(`
          select data_type from information_schema.columns
          where table_schema='auth' and table_name='users' and column_name='email'
        `);
        expect(column.rows[0].data_type).toBe(
          emailType === "text" ? "text" : "character varying",
        );
      } finally {
        await db.close();
      }
    },
    60000,
  );

  it("revoga concessões predefinidas directas a anon/authenticated", async () => {
    const db = new PGlite();
    try {
      await prepare(db);
      await db.exec(`
        create role service_role;
        alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
        alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
        alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
      `);
      await db.exec(await migration());
      const rights = await db.query<Record<string, boolean>>(`
        select
          has_table_privilege('anon','public.profiles','SELECT') anon_read,
          has_table_privilege('authenticated','public.profiles','SELECT') user_read,
          has_table_privilege('authenticated','public.profiles','INSERT') user_insert,
          has_table_privilege('authenticated','public.profiles','TRUNCATE') user_truncate,
          has_function_privilege('anon','public.admin_mutation(text,jsonb)','EXECUTE') anon_rpc,
          has_function_privilege('authenticated','public.admin_mutation(text,jsonb)','EXECUTE') user_rpc,
          has_function_privilege('authenticated','public.handle_auth_user()','EXECUTE') user_trigger,
          has_table_privilege('service_role','public.profiles','TRUNCATE') service_truncate
      `);
      expect(rights.rows[0]).toEqual({
        anon_read: false, user_read: true, user_insert: false,
        user_truncate: false, anon_rpc: false, user_rpc: true, user_trigger: false,
        service_truncate: true,
      });
    } finally {
      await db.close();
    }
  }, 60000);

  it("evidencia risco se existirem concessões predefinidas de tabelas a PUBLIC", async () => {
    const db = new PGlite();
    try {
      await prepare(db);
      await db.exec("alter default privileges in schema public grant all on tables to public");
      await db.exec(await migration());
      const rights = await db.query<{ truncate: boolean; rls: boolean }>(`
        select has_table_privilege('anon','public.profiles','TRUNCATE') as truncate,
          relrowsecurity as rls
        from pg_class where oid='public.profiles'::regclass
      `);
      // This is a demonstrated preflight risk, not a claim about the remote project.
      // RLS does not protect TRUNCATE; the current migration does not revoke PUBLIC
      // table grants. Do not approve uninspected default ACLs based on counts alone.
      expect(rights.rows[0]).toEqual({ truncate: true, rls: true });
    } finally {
      await db.close();
    }
  }, 60000);
});
