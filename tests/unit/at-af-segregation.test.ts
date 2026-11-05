import { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ids = Object.fromEntries(["AT", "AF", "COL", "DEST", "SCOPED", "INACTIVE", "FUTUREAT"].map((name, i) =>
  [name, `80000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`]));
const unit = "81000000-0000-4000-8000-000000000002";
const originalPath = "supabase/migrations/202610300001_fase1.sql";
const proposalPath = "supabase/migrations/202611050001_at_af_segregation.sql";
const originalHash = "56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58";

async function fixture(patched: boolean) {
  const db = new PGlite();
  try {
    await db.waitReady;
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create role authenticator noinherit; create role local_operator noinherit;
      grant anon,authenticated,service_role to authenticator;
      create schema auth;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    const original = await readFile(originalPath, "utf8");
    expect(createHash("sha256").update(original).digest("hex")).toBe(originalHash);
    await db.exec(original);
    for (const [name, id] of Object.entries(ids)) {
      await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${name.toLowerCase()}@example.invalid`]);
      if (name !== "INACTIVE" && name !== "FUTUREAT")
        await db.query("update public.profiles set status='active' where id=$1", [id]);
    }
    await db.exec(`insert into public.organizational_units(id,code,name,kind)
      values('81000000-0000-4000-8000-000000000001','fixture-root','Fixture','company');
      insert into public.organizational_units(id,code,name,kind,parent_id)
      values('${unit}','fixture-unit','Fixture A','department','81000000-0000-4000-8000-000000000001');
      insert into public.roles(code,name) values('c_subject','Subject'),('c_future','Future'),('c_scoped','Scoped');
      insert into public.role_permissions values('c_scoped','access.manage');`);
    for (const [name, role, scope] of [
      ["AT", "technical_admin", null], ["AF", "access_admin", null],
      ["COL", "technician", null], ["SCOPED", "c_scoped", unit],
    ]) await db.query("insert into public.user_role_assignments(user_id,role_code,scope_unit_id) values($1,$2,$3)", [ids[name!], role, scope]);
    await db.query(`insert into public.user_role_assignments(user_id,role_code,valid_from)
      values($1,'c_future',now()+interval '1 day'),($2,'technical_admin',now()+interval '1 day')`, [ids.AF, ids.FUTUREAT]);
    if (patched) {
      await db.exec(await readFile(proposalPath, "utf8"));
      // Apenas a fixture atribui o papel SQL ao operador fictício.
      await db.exec("grant gestor_security_operator to local_operator");
    }
    // Simular ACLs amplas do serviço para testar a barreira mesmo com BYPASSRLS.
    await db.exec(`grant select,insert,update,delete,truncate on all tables in schema public to service_role`);
    return db;
  } catch (error) { await db.close(); throw error; }
}

type Context = { actor?: string; role?: "authenticated" | "anon" | "service_role" | "gestor_security_operator" };
async function asActor(db: PGlite, context: Context, action: () => Promise<unknown>, inspect?: () => Promise<void>) {
  const role = context.role ?? "authenticated";
  const session = role === "gestor_security_operator" ? "local_operator" : "authenticator";
  await db.exec(`set session authorization ${session}; begin; set local role ${role}`);
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true),set_config('request.jwt.claim.role',$3,true)",
      [context.actor ?? "", role === "gestor_security_operator" ? "{}" : JSON.stringify({ role, sub: context.actor }), role === "gestor_security_operator" ? "" : role]);
    expect((await db.query("select current_user::text as actor,session_user::text as session")).rows)
      .toEqual([{ actor: role, session }]);
    await action();
    // Só a leitura de efeitos usa o proprietário da fixture; a operação acima não.
    await db.exec("set session authorization postgres; reset role");
    await inspect?.();
  } finally { await db.exec("rollback; set session authorization postgres; reset role"); }
}
async function rpc(db: PGlite, operation: string, payload: Record<string, unknown>) {
  return db.query("select public.admin_mutation($1,$2::jsonb)", [operation, JSON.stringify(payload)]);
}
async function assignment(db: PGlite, person: string, role: string) {
  return (await db.query<{ id: string }>("select id from public.user_role_assignments where user_id=$1 and role_code=$2 order by valid_from limit 1", [ids[person], role])).rows[0].id;
}
async function snapshot(db: PGlite) {
  const result: unknown[] = [];
  for (const name of ["profiles", "roles", "permissions", "role_permissions", "user_role_assignments", "delegations", "audit_logs"])
    result.push((await db.query(`select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb)::text) as hash from public.${name} t`)).rows);
  return JSON.stringify(result);
}
async function maintenance(db: PGlite, target: string, operation: string) {
  return db.query("select gestor_security.maintain_technical_admin($1,$2,'LOCAL-CHANGE-001','LOCAL-APPROVAL-001')", [ids[target], operation]);
}

describe("Auditoria da baseline: caminhos reproduzidos apenas em memória", () => {
  let db: PGlite;
  beforeAll(async () => { db = await fixture(false); }, 90000);
  afterAll(async () => { await db?.close(); });
  it.each([
    ["AF concede technical_admin global", "grant_role", { user_id: ids.DEST, role_code: "technical_admin" }],
    ["AF altera capacidades de AT", "role_permission", { role_code: "technical_admin", permission_code: "org.manage", enabled: "true" }],
    ["AF copia users.manage", "role_permission", { role_code: "c_subject", permission_code: "users.manage", enabled: "true" }],
    ["AF modifica papel próprio futuro", "role_permission", { role_code: "c_future", permission_code: "org.manage", enabled: "true" }],
  ])("%s é aceite pela baseline", async (_name, operation, payload) => {
    await asActor(db, { actor: ids.AF }, () => rpc(db, operation as string, payload as Record<string, unknown>), async () => {
      const data = payload as Record<string, unknown>;
      if (operation === "grant_role") {
        expect((await db.query("select count(*)::int as n from public.user_role_assignments where user_id=$1 and role_code=$2", [data.user_id, data.role_code])).rows).toEqual([{ n: 1 }]);
      } else {
        expect((await db.query("select count(*)::int as n from public.role_permissions where role_code=$1 and permission_code=$2", [data.role_code, data.permission_code])).rows).toEqual([{ n: 1 }]);
      }
    });
  });
  it("AF revoga a concessão técnica armazenada", async () => {
    const id = await assignment(db, "AT", "technical_admin");
    await asActor(db, { actor: ids.AF }, () => rpc(db, "revoke_role", { id }), async () => {
      expect((await db.query("select valid_until is not null as revoked from public.user_role_assignments where id=$1", [id])).rows).toEqual([{ revoked: true }]);
    });
  });
  it("access.manage limitado também concede papel técnico no próprio âmbito", async () => {
    await asActor(db, { actor: ids.SCOPED }, () => rpc(db, "grant_role", { user_id: ids.DEST, role_code: "technical_admin", unit_id: unit }), async () => {
      expect((await db.query("select scope_unit_id from public.user_role_assignments where user_id=$1 and role_code='technical_admin'", [ids.DEST])).rows).toEqual([{ scope_unit_id: unit }]);
    });
  });
});

describe("Migração incremental: segregação no banco, independente da UI", () => {
  let db: PGlite;
  beforeAll(async () => { db = await fixture(true); }, 90000);
  afterAll(async () => { await db?.close(); });

  const cases: [string, Context, string, Record<string, unknown>][] = [
    ["AF concede technical_admin global", { actor: ids.AF }, "grant_role", { user_id: ids.DEST, role_code: "technical_admin" }],
    ["AF concede technical_admin limitado", { actor: ids.AF }, "grant_role", { user_id: ids.DEST, role_code: "technical_admin", unit_id: unit }],
    ["gestor de acesso limitado concede technical_admin", { actor: ids.SCOPED }, "grant_role", { user_id: ids.DEST, role_code: "technical_admin", unit_id: unit }],
    ["AF acrescenta org.manage ao papel técnico", { actor: ids.AF }, "role_permission", { role_code: "technical_admin", permission_code: "org.manage", enabled: "true" }],
    ["AF retira users.manage do papel técnico", { actor: ids.AF }, "role_permission", { role_code: "technical_admin", permission_code: "users.manage", enabled: "false" }],
    ["AF copia users.manage para papel configurável", { actor: ids.AF }, "role_permission", { role_code: "c_subject", permission_code: "users.manage", enabled: "true" }],
    ["AF altera o seu papel futuro", { actor: ids.AF }, "role_permission", { role_code: "c_future", permission_code: "org.manage", enabled: "true" }],
    ["AF altera o papel de sistema access_admin", { actor: ids.AF }, "role_permission", { role_code: "access_admin", permission_code: "org.manage", enabled: "true" }],
    ["AF concede papel a si próprio", { actor: ids.AF }, "grant_role", { user_id: ids.AF, role_code: "c_subject" }],
    ["AF acumula papel funcional em AT", { actor: ids.AF }, "grant_role", { user_id: ids.AT, role_code: "c_subject" }],
    ["actor inactivo concede technical_admin", { actor: ids.INACTIVE }, "grant_role", { user_id: ids.DEST, role_code: "technical_admin" }],
    ["colaborador concede technical_admin", { actor: ids.COL }, "grant_role", { user_id: ids.DEST, role_code: "technical_admin" }],
    ["anónimo chama RPC", { role: "anon" }, "grant_role", { user_id: ids.DEST, role_code: "technical_admin" }],
  ];
  it.each(cases)("recusa %s sem efeitos", async (_name, actor, operation, payload) => {
    const before = await snapshot(db);
    // A recusa de auto-concessão é a guarda legada, que usa P0001.
    const code = operation === "grant_role" && payload.user_id === actor.actor ? "P0001" : "42501";
    await expect(asActor(db, actor, () => rpc(db, operation, payload))).rejects.toMatchObject({ code });
    expect(await snapshot(db)).toBe(before);
  });

  it("revoke_role usa o alvo armazenado mesmo com payload falsificado", async () => {
    const id = await assignment(db, "AT", "technical_admin");
    await expect(asActor(db, { actor: ids.AF }, () => rpc(db, "revoke_role", {
      id, role_code: "technician", user_id: ids.COL, maintenance: true,
    }))).rejects.toMatchObject({ code: "42501" });
  });

  const direct: [string, string][] = [
    ["INSERT técnico", `insert into public.user_role_assignments(user_id,role_code) values('${ids.DEST}','technical_admin')`],
    ["DELETE técnico", `delete from public.user_role_assignments where user_id='${ids.AT}'`],
    ["UPDATE de técnico para funcional", `update public.user_role_assignments set role_code='technician' where user_id='${ids.AT}'`],
    ["UPDATE do âmbito técnico", `update public.user_role_assignments set scope_unit_id='${unit}' where user_id='${ids.AT}'`],
    ["definição do papel técnico", `update public.roles set technical=false where code='technical_admin'`],
    ["renomeação do papel técnico", `update public.roles set code='c_renamed' where code='technical_admin'`],
    ["cópia directa de users.manage", `insert into public.role_permissions values('c_subject','users.manage')`],
    ["alteração directa de capacidades técnicas", `delete from public.role_permissions where role_code='technical_admin'`],
    ["mistura funcional futura em AT", `insert into public.user_role_assignments(user_id,role_code,valid_from) values('${ids.AT}','c_subject',now()+interval '1 day')`],
    ["delegação técnica", `insert into public.delegations(from_user_id,to_user_id,permission_code,scope_unit_id,valid_from,valid_until) values('${ids.AT}','${ids.DEST}','users.manage','${unit}',now(),now()+interval '1 day')`],
    ["delegação de access.manage", `insert into public.delegations(from_user_id,to_user_id,permission_code,scope_unit_id,valid_from,valid_until) values('${ids.AF}','${ids.DEST}','access.manage','${unit}',now(),now()+interval '1 day')`],
    ["catálogo administrativo renomeado", `update public.permissions set code='c_alias' where code='users.manage'`],
    ["UPDATE funcional para técnico", `update public.user_role_assignments set role_code='technical_admin' where user_id='${ids.COL}'`],
    ["alteração do titular técnico", `update public.user_role_assignments set user_id='${ids.DEST}' where user_id='${ids.AT}'`],
    ["suspensão técnica por API de serviço", `update public.profiles set status='suspended' where id='${ids.AT}'`],
  ];
  it.each(direct)("BYPASSRLS não contorna: %s", async (_name, sql) => {
    const before = await snapshot(db);
    await expect(asActor(db, { role: "service_role" }, () => db.exec(sql))).rejects.toMatchObject({ code: "42501" });
    expect(await snapshot(db)).toBe(before);
  });
  it.each(["roles", "permissions", "role_permissions", "user_role_assignments", "delegations", "profiles", "audit_logs"])("recusa TRUNCATE de %s mesmo com ACL acidental", async name => {
    const before = await snapshot(db);
    await expect(asActor(db, { role: "service_role" }, () => db.exec(`truncate public.${name} cascade`))).rejects.toMatchObject({ code: "42501" });
    expect(await snapshot(db)).toBe(before);
  });
  it.each([
    "delete from public.audit_logs",
    "update public.audit_logs set action='FORGED'",
    "insert into public.audit_logs(entity_type,action) values('forged','FAKE')",
  ])("recusa adulteração de auditoria por serviço (%#)", async sql => {
    const before = await snapshot(db);
    await expect(asActor(db, { role: "service_role" }, () => db.exec(sql))).rejects.toMatchObject({ code: "42501" });
    expect(await snapshot(db)).toBe(before);
  });
  it("API não recebe TRIGGER nem pertença à manutenção", async () => {
    expect((await db.query("select has_table_privilege('service_role','public.user_role_assignments','TRIGGER') as attach_trigger, pg_has_role('authenticator','gestor_security_operator','MEMBER') as operator")).rows).toEqual([{ attach_trigger: false, operator: false }]);
  });
  it("operador SQL com contexto JWT não é aceite como manutenção", async () => {
    await expect(asActor(db, { role: "gestor_security_operator", actor: ids.AF }, () => maintenance(db, "DEST", "grant"))).rejects.toMatchObject({ code: "42501" });
  });
  it.each([
    "select gestor_security.admin_mutation_legacy('role_create','{}'::jsonb)",
    `select gestor_security.maintain_technical_admin('${ids.DEST}','grant','LOCAL-CHANGE-001','LOCAL-APPROVAL-001')`,
    "set local role gestor_security_operator",
    `insert into public.user_role_assignments(user_id,role_code) values('${ids.DEST}','technical_admin')`,
  ])("authenticated não alcança manutenção nem escrita directa (%#)", async sql => {
    await expect(asActor(db, { actor: ids.AF }, () => db.exec(sql))).rejects.toMatchObject({ code: "42501" });
  });
  it("BYPASSRLS e referências forjadas não substituem identidade SQL autorizada", async () => {
    const before = await snapshot(db);
    await expect(asActor(db, { role: "service_role" }, async () => {
      await db.exec("select set_config('gestor_security.change_ref','LOCAL-CHANGE-001',true),set_config('gestor_security.approval_ref','LOCAL-APPROVAL-001',true)");
      await db.query("insert into public.user_role_assignments(user_id,role_code) values($1,'technical_admin')", [ids.DEST]);
    })).rejects.toMatchObject({ code: "42501" });
    expect(await snapshot(db)).toBe(before);
  });
  it("AT não suspende outro titular de concessão técnica futura", async () => {
    const before = await snapshot(db);
    await expect(asActor(db, { actor: ids.AT }, () => rpc(db, "user_status", { user_id: ids.FUTUREAT, status: "suspended" }))).rejects.toMatchObject({ code: "42501" });
    expect(await snapshot(db)).toBe(before);
  });
  it("referências de aprovação em GUC não autorizam actor da API", async () => {
    await expect(asActor(db, { actor: ids.AF }, async () => {
      await db.exec("select set_config('gestor_security.change_ref','LOCAL-CHANGE-001',true),set_config('gestor_security.approval_ref','LOCAL-APPROVAL-001',true)");
      await rpc(db, "grant_role", { user_id: ids.DEST, role_code: "technical_admin" });
    })).rejects.toMatchObject({ code: "42501" });
  });

  it("AF continua a conceder papel funcional permitido a terceiro", async () => {
    await asActor(db, { actor: ids.AF }, () => rpc(db, "grant_role", { user_id: ids.COL, role_code: "c_subject" }), async () => {
      expect((await db.query("select count(*)::int as n from public.user_role_assignments where user_id=$1 and role_code='c_subject'", [ids.COL])).rows).toEqual([{ n: 1 }]);
    });
  });
  it("AF continua a revogar papel funcional de terceiro", async () => {
    const id = await assignment(db, "COL", "technician");
    await asActor(db, { actor: ids.AF }, () => rpc(db, "revoke_role", { id }), async () => {
      expect((await db.query("select valid_until is not null as closed from public.user_role_assignments where id=$1", [id])).rows).toEqual([{ closed: true }]);
    });
  });
  it("AF continua a editar capacidades não técnicas de papel alheio", async () => {
    await asActor(db, { actor: ids.AF }, () => rpc(db, "role_permission", { role_code: "c_subject", permission_code: "org.read", enabled: "true" }), async () => {
      expect((await db.query("select count(*)::int as n from public.role_permissions where role_code='c_subject' and permission_code='org.read'")).rows).toEqual([{ n: 1 }]);
    });
  });
  it("AT conserva gestão de estado de conta funcional, sem poderes de acesso", async () => {
    await asActor(db, { actor: ids.AT }, () => rpc(db, "user_status", { user_id: ids.COL, status: "suspended" }), async () => {
      expect((await db.query("select status from public.profiles where id=$1", [ids.COL])).rows).toEqual([{ status: "suspended" }]);
    });
    await expect(asActor(db, { actor: ids.AT }, () => rpc(db, "grant_role", { user_id: ids.DEST, role_code: "c_subject" }))).rejects.toMatchObject({ code: "P0001" });
  });
  it("manutenção SQL concede só o papel técnico global e regista referência sem actor fictício", async () => {
    await asActor(db, { role: "gestor_security_operator" }, () => maintenance(db, "DEST", "grant"), async () => {
      expect((await db.query("select role_code,scope_unit_id,granted_by from public.user_role_assignments where user_id=$1", [ids.DEST])).rows)
        .toEqual([{ role_code: "technical_admin", scope_unit_id: null, granted_by: null }]);
      const audit = (await db.query<{ actor_id: null; operation: string; reference: string }>(`select actor_id,action as operation,after_data->>'approval_ref' as reference
        from public.audit_logs where entity_type='technical_admin_maintenance'`)).rows;
      expect(audit).toEqual([{ actor_id: null, operation: "GRANT", reference: "LOCAL-APPROVAL-001" }]);
    });
  });
  it("atribuição técnica privilegiada não activa implicitamente a conta", async () => {
    await asActor(db, { role: "gestor_security_operator" }, () => maintenance(db, "INACTIVE", "grant"), async () => {
      expect((await db.query("select status from public.profiles where id=$1", [ids.INACTIVE])).rows).toEqual([{ status: "inactive" }]);
    });
  });
  it("manutenção recusa referência de aprovação vazia", async () => {
    await expect(asActor(db, { role: "gestor_security_operator" }, () => db.query(
      "select gestor_security.maintain_technical_admin($1,'grant','LOCAL-CHANGE-001','')", [ids.DEST],
    ))).rejects.toMatchObject({ code: "42501" });
  });
  it("manutenção recusa acumulação técnica em AF", async () => {
    await expect(asActor(db, { role: "gestor_security_operator" }, () => maintenance(db, "AF", "grant"))).rejects.toMatchObject({ code: "42501" });
  });
  it("manutenção encerra concessão técnica corrente", async () => {
    await asActor(db, { role: "gestor_security_operator" }, () => maintenance(db, "AT", "revoke"), async () => {
      expect((await db.query("select bool_and(valid_until is not null) as closed from public.user_role_assignments where user_id=$1", [ids.AT])).rows).toEqual([{ closed: true }]);
    });
  });
  it("manutenção cancela concessão futura sem criar intervalo inválido", async () => {
    await asActor(db, { role: "gestor_security_operator" }, () => maintenance(db, "FUTUREAT", "revoke"), async () => {
      expect((await db.query("select valid_from=valid_until as cancelled from public.user_role_assignments where user_id=$1", [ids.FUTUREAT])).rows).toEqual([{ cancelled: true }]);
    });
  });
  it("manutenção suspende conta técnica com auditoria", async () => {
    await asActor(db, { role: "gestor_security_operator" }, () => maintenance(db, "AT", "suspend"), async () => {
      expect((await db.query("select status from public.profiles where id=$1", [ids.AT])).rows).toEqual([{ status: "suspended" }]);
    });
  });
  it("delegação funcional continua sem conceder poderes implícitos", async () => {
    await asActor(db, { role: "service_role" }, () => db.exec(`insert into public.delegations(from_user_id,to_user_id,permission_code,scope_unit_id,valid_from,valid_until)
      values('${ids.AF}','${ids.COL}','activities.assign','${unit}',now(),now()+interval '1 day')`), async () => {
      await db.query("select set_config('request.jwt.claim.sub',$1,true)", [ids.COL]);
      expect((await db.query("select public.has_permission('activities.assign',$1) as allowed", [unit])).rows).toEqual([{ allowed: false }]);
    });
  });
  it("perfil inactivo continua a ler só o próprio perfil pelo RLS previsto", async () => {
    await asActor(db, { actor: ids.INACTIVE }, async () => {
      expect((await db.query("select id from public.profiles")).rows).toEqual([{ id: ids.INACTIVE }]);
      expect((await db.query("select public.my_permissions() as permissions")).rows).toEqual([{ permissions: [] }]);
    });
  });
});

it("pré-condições recusam catálogo contaminado sem instalar parcialmente a proposta", async () => {
  const db = await fixture(false);
  try {
    await db.exec("insert into public.role_permissions values('c_subject','users.manage')");
    await expect(db.exec(await readFile(proposalPath, "utf8"))).rejects.toMatchObject({ code: "23514" });
    await db.exec("rollback");
    expect((await db.query("select to_regnamespace('gestor_security') is null as absent")).rows).toEqual([{ absent: true }]);
    expect((await db.query("select to_regprocedure('public.admin_mutation(text,jsonb)') is not null as present")).rows).toEqual([{ present: true }]);
  } finally { await db.close(); }
}, 90000);

it.each([
  ["dono de auditoria divergente", "alter table public.audit_logs owner to local_operator"],
  ["CREATE assumível por NOINHERIT", "grant local_operator to authenticator; grant create on schema public to local_operator"],
  ["TRIGGER assumível por NOINHERIT", "grant local_operator to authenticator; grant trigger on public.user_role_assignments to local_operator"],
  ["SET de replicação assumível", "grant local_operator to authenticator; grant set on parameter session_replication_role to local_operator"],
])("preflight recusa %s e reverte toda a instalação", async (_label, contamination) => {
  const db = await fixture(false);
  try {
    await db.exec(contamination);
    await expect(db.exec(await readFile(proposalPath, "utf8"))).rejects.toMatchObject({ code: "23514" });
    await db.exec("rollback");
    expect((await db.query("select to_regnamespace('gestor_security') is null as absent")).rows).toEqual([{ absent: true }]);
    expect((await db.query("select to_regprocedure('public.admin_mutation(text,jsonb)') is not null as present")).rows).toEqual([{ present: true }]);
  } finally { await db.close(); }
}, 90000);

it("preflight recusa corpo de RPC divergente, sem o substituir silenciosamente", async () => {
  const db = await fixture(false);
  try {
    await db.exec("create or replace function public.admin_mutation(operation text,payload jsonb) returns void language plpgsql security definer set search_path='' as $$ begin return; end $$");
    await expect(db.exec(await readFile(proposalPath, "utf8"))).rejects.toMatchObject({ code: "23514" });
    await db.exec("rollback");
    expect((await db.query("select to_regnamespace('gestor_security') is null as absent")).rows).toEqual([{ absent: true }]);
  } finally { await db.close(); }
}, 90000);
