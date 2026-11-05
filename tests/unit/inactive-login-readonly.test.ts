import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("inspecção inactive usa RLS real e repõe o contexto sem persistir dados", async () => {
  const db = new PGlite();
  try {
    await db.waitReady;
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to authenticated,anon;
      grant execute on function auth.uid() to authenticated,anon;`);
    await db.exec(await readFile("supabase/migrations/202610300001_fase1.sql", "utf8"));
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      "00000000-0000-4000-8000-000000000088", "inactive-at@example.invalid",
    ]);
    const snapshot = async () => (await db.query(`select current_user as executor,
      (select count(*) from public.audit_logs) as auditoria,
      (select count(*) from public.profiles where status='inactive') as inactivos,
      (select count(*) from public.user_role_assignments) as atribuicoes`)).rows;
    const before = await snapshot();
    const script = (await readFile("supabase/inspection/fase1-inactive-login-readonly.sql", "utf8"))
      .replaceAll("EMAIL_AT_A_SUBSTITUIR_PRIVADAMENTE", "inactive-at@example.invalid");
    const results = await db.exec(script);
    const row = results.flatMap(result => result.rows as Record<string, unknown>[])
      .find(row => row.contexto_authenticated !== undefined);
    expect(row).toMatchObject({ contexto_authenticated: true, executor_sem_bypass: true,
      sujeito_presente: true, perfil_proprio_linhas: 1, perfil_proprio_inactive: true,
      utilizador_activo: false, permissoes_efectivas: 0, papeis_visiveis: 0,
      permissoes_visiveis: 0, estrutura_visivel: 0, tabelas_encontradas: 16, tabelas_com_rls: 16 });
    expect(Number(row?.catalogo_papeis_total)).toBeGreaterThan(0);
    expect(Number(row?.catalogo_permissoes_total)).toBeGreaterThan(0);
    expect(await snapshot()).toEqual(before);
    const context = await db.query(`select
      nullif(current_setting('request.jwt.claim.sub',true),'') is null as reposto`);
    expect(context.rows).toEqual([{ reposto: true }]);
  } finally { await db.close(); }
}, 20000);
