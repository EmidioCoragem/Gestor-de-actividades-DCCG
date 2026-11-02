import { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const migration = await readFile("supabase/migrations/202610300001_fase1.sql", "utf8");
const recovery = await readFile("supabase/recovery/fase1-empty-baseline.sql", "utf8");
const baseline = await readFile("supabase/inspection/fase1-baseline.sql", "utf8");

async function fixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email varchar(255),raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
    create schema storage;
    create table storage.buckets(id text primary key);
    create table storage.objects(id uuid primary key);
    grant usage on schema public,auth to anon,authenticated;
    alter default privileges in schema public grant all on tables to anon,authenticated;
    alter default privileges in schema public grant execute on functions to anon,authenticated;
    create table public.baseline_witness(code text primary key);
    insert into public.baseline_witness values('preservar');
    create view public.baseline_view as select code from public.baseline_witness;
  `);
  return db;
}

async function snapshot(db: PGlite) {
  const result = await db.exec(baseline);
  return result.flatMap((r) => r.rows as { item: string; detalhe: unknown }[])
    .filter((r) => r.item !== "00_contexto");
}

async function authorize(db: PGlite) {
  // Confirmação de teste exclusivamente nesta instância em memória.
  await db.exec("set gestor.phase1_recovery='authorized'");
}

describe("Recuperação local após COMMIT, sem Supabase remoto", () => {
  it("repõe a baseline, preserva objectos anteriores e permite reaplicar a migração", async () => {
    const db = await fixture();
    try {
      expect(createHash("sha256").update(migration).digest("hex")).toBe(
        "56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58",
      );
      const before = await snapshot(db);
      await db.exec(migration); // Inclui o COMMIT original; não é ROLLBACK de uma transacção aberta.
      const applied = await snapshot(db);
      expect(applied).not.toEqual(before);
      await authorize(db);
      await db.exec(recovery); // Segunda transacção, com o seu próprio COMMIT.
      expect(await snapshot(db)).toEqual(before);
      expect((await db.query("select code from public.baseline_witness")).rows).toEqual([
        { code: "preservar" },
      ]);
      await db.exec(migration);
      expect(await snapshot(db)).toEqual(applied);
    } finally {
      await db.close();
    }
  }, 60000);

  it.each([
    { name: "sem confirmação de autorização", setup: "", authorized: false, error: "Recuperacao bloqueada" },
    { name: "com conta Auth", setup: "insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','local@example.invalid')", authorized: true, error: "existem contas Auth" },
    { name: "com conteúdo Storage", setup: "insert into storage.buckets values('local')", authorized: true, error: "conteudo Storage" },
    { name: "com dados de utilização", setup: "insert into public.cost_centers(code,name) values('LOCAL','Apenas teste')", authorized: true, error: "contem dados" },
    { name: "com catálogo inicial alterado", setup: "update public.roles set name='Alterado em teste' where code='manager'; delete from public.audit_logs", authorized: true, error: "catalogo public.roles alterado" },
    { name: "com dependência adicional", setup: "create view public.future_dependency as select code from public.roles", authorized: true, error: "depend" },
  ])("recusa recuperação $name e preserva a transacção inteira", async ({ setup, authorized, error }) => {
    const db = await fixture();
    try {
      await db.exec(migration);
      if (setup) await db.exec(setup);
      const before = await snapshot(db);
      if (authorized) await authorize(db);
      await expect(db.exec(recovery)).rejects.toThrow(error);
      await db.exec("rollback");
      expect(await snapshot(db)).toEqual(before);
      expect((await db.query<{ rel: string }>("select to_regclass('public.profiles') as rel")).rows[0].rel).toBe("profiles");
    } finally {
      await db.close();
    }
  }, 60000);
});
