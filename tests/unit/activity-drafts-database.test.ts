import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  activityActors as actors, activityUnits as units, activityRequestId as request,
  activityAuthFixtureSQL, activitySeedFixtureSQL, activityMigrationPaths,
  type ActivityActor,
} from "../fixtures/activity-drafts-database";

// SQL real em WASM, só memória. Não equivale a concorrência multi-sessão nativa
// nem a Auth/PostgREST reais. A suite nativa separada verifica essas corridas.
let db: PGlite;
type DraftReply = { id: string; code: string; status: string; version: number; replayed: boolean };
const callSql = "select public.create_activity_draft($1::uuid,$2::text,$3::text,$4::uuid) as draft";
beforeAll(async () => {
  db = new PGlite(); await db.waitReady;
  await db.exec(activityAuthFixtureSQL);
  await db.exec(await readFile(activityMigrationPaths[0], "utf8"));
  await db.exec(activitySeedFixtureSQL());
  await db.exec(await readFile(activityMigrationPaths[1], "utf8"));
  await db.exec(await readFile(activityMigrationPaths[2], "utf8"));
}, 90000);
afterAll(async () => { await db?.close(); });

async function identify(actor?: ActivityActor, role = "authenticated") {
  await db.exec("set session authorization postgres; reset role");
  if (actor || role !== "authenticated")
    await db.exec(`set session authorization authenticator; set local role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
    [actor ? actors[actor] : "", actor ? role : "", actor ? JSON.stringify({ sub: actors[actor], role }) : "{}"]);
}
async function transaction(run: () => Promise<void>, isolation = "READ COMMITTED") {
  await db.exec(`begin isolation level ${isolation}`);
  try { await run(); } finally { await db.exec("rollback;set session authorization postgres;reset role"); }
}
async function create(actor: ActivityActor, unit: string = units.a, key = request(1), title = "Rascunho fictício", description: string | null = "") {
  await identify(actor);
  return (await db.query<{ draft: DraftReply }>(callSql, [unit, title, description, key])).rows[0].draft;
}
async function totals() {
  await identify();
  return (await db.query(`select
    (select count(*)::int from public.activities) as drafts,
    (select count(*)::int from public.activity_events) as events,
    (select count(*)::int from activity_private.activity_draft_requests) as requests,
    (select count(*)::int from public.audit_logs where entity_type='activity') as audit`)).rows[0];
}
async function refuse(actor: ActivityActor, args: unknown[], code = "42501") {
  await identify(actor); await db.exec("savepoint denied_draft");
  await expect(db.query(callSql, args)).rejects.toMatchObject({ code });
  await db.exec("rollback to savepoint denied_draft");
}

describe("F2-F01 banco isolado: criação autorizada e efeito atómico", () => {
  it("cria apenas draft/version1 com actor da sessão, evento e auditoria sem copiar texto", () => transaction(async () => {
    const reply = await create("managerA", units.a, request(1), "  Título confidencial fictício  ", "Descrição confidencial fictícia");
    expect(reply).toMatchObject({ status: "draft", version: 1, replayed: false });
    expect(reply.code).toBe("ACT-" + reply.id.replaceAll("-", "").toUpperCase());
    await identify();
    expect((await db.query("select title,description,created_by,responsible_unit_id,status,version::int from public.activities where id=$1", [reply.id])).rows)
      .toEqual([{ title: "Título confidencial fictício", description: "Descrição confidencial fictícia", created_by: actors.managerA, responsible_unit_id: units.a, status: "draft", version: 1 }]);
    expect(await totals()).toEqual({ drafts: 1, events: 1, requests: 1, audit: 1 });
    const audit = (await db.query<{ actor_id: string; after_data: Record<string, unknown> }>("select actor_id,after_data from public.audit_logs where entity_type='activity'")).rows[0];
    expect(audit.actor_id).toBe(actors.managerA);
    expect(audit.after_data).toMatchObject({ code: reply.code, status: "draft", version: 1 });
    expect(JSON.stringify(audit)).not.toContain("confidencial");
    expect((await db.query("select actor_id,event_kind,version::int from public.activity_events")).rows)
      .toEqual([{ actor_id: actors.managerA, event_kind: "draft_created", version: 1 }]);
  }));

  it.each(["director", "executive"] as const)("%s autorizado cria no departamento B", actor => transaction(async () => {
    expect(await create(actor, units.b)).toMatchObject({ status: "draft", replayed: false });
  }));
  it("gestor de A inclui descendente A1, mas não a unidade B", () => transaction(async () => {
    expect(await create("managerA", units.a1)).toMatchObject({ status: "draft" });
    await refuse("managerA", [units.b, "Fora de âmbito", "", request(2)]);
    expect(await totals()).toEqual({ drafts: 1, events: 1, requests: 1, audit: 1 });
  }));
  it.each(["technician", "inactive", "suspended", "technical", "functional", "clone", "expired", "future", "flagged"] as const)("%s não ganha criação por sessão ou capacidades isoladas", actor => transaction(async () => {
    await refuse(actor, [units.a, "Não autorizado", "", request(1)]);
    expect(await totals()).toEqual({ drafts: 0, events: 0, requests: 0, audit: 0 });
  }));
  it("papel gestor em A mais capacidades personalizadas em B não abre B", () => transaction(async () => {
    await create("mixed", units.a);
    await refuse("mixed", [units.b, "B não autorizado", "", request(2)]);
    expect(await totals()).toEqual({ drafts: 1, events: 1, requests: 1, audit: 1 });
  }));
  it.each(["activities.create", "activities.read"])("gestor sem %s é recusado", permission => transaction(async () => {
    await identify(); await db.query("delete from public.role_permissions where role_code='manager' and permission_code=$1", [permission]);
    await refuse("managerA", [units.a, "Sem capacidade", "", request(1)]);
    expect(await totals()).toEqual({ drafts: 0, events: 0, requests: 0, audit: 0 });
  }));
  it("unidade inactiva não é destino nem passa a global", () => transaction(async () => {
    await refuse("executive", [units.inactive, "Destino inactivo", "", request(1)]);
    expect(await totals()).toEqual({ drafts: 0, events: 0, requests: 0, audit: 0 });
  }));
  it.each([
    ["title vazio", units.a, " \t\u00a0\ufeff", "", request(1)],
    ["title longo", units.a, "x".repeat(201), "", request(1)],
    ["description longa", units.a, "Título", "😀".repeat(10001), request(1)],
    ["request ausente", units.a, "Título", "", null],
    ["unit ausente", null, "Título", "", request(1)],
  ])("%s é recusado sem actividade/evento/auditoria parcial", (_label, unit, title, description, key) => transaction(async () => {
    await refuse("managerA", [unit, title, description, key], "22023");
    expect(await totals()).toEqual({ drafts: 0, events: 0, requests: 0, audit: 0 });
  }));
  it("limites Unicode e whitespace equivalem ao contrato JS", () => transaction(async () => {
    const reply = await create("managerA", units.a, request(1), "\ufeff" + "😀".repeat(200) + "\u3000", "😀".repeat(10000));
    await identify();
    expect((await db.query("select char_length(title)::int as title,char_length(description)::int as description from public.activities where id=$1", [reply.id])).rows)
      .toEqual([{ title: 200, description: 10000 }]);
  }));
  it.each(["REPEATABLE READ", "SERIALIZABLE"])("isolamento %s falha fechado, sem assumir snapshot fresco", isolation => transaction(async () => {
    await refuse("managerA", [units.a, "Snapshot não suportado", "", request(1)], "0A000");
    expect(await totals()).toEqual({ drafts: 0, events: 0, requests: 0, audit: 0 });
  }, isolation));
});

describe("F2-F01 leituras RLS, idempotência e ausência de DML directo", () => {
  it("lista/detalhe/eventos de A não devolvem actividade existente de B", () => transaction(async () => {
    const a = await create("managerA", units.a, request(1));
    const b = await create("managerB", units.b, request(2));
    await identify("managerA");
    expect((await db.query("select id from public.activities order by id")).rows).toEqual([{ id: a.id }]);
    expect((await db.query("select id from public.activities where id=$1", [b.id])).rows).toEqual([]);
    expect((await db.query("select activity_id from public.activity_events")).rows).toEqual([{ activity_id: a.id }]);
    expect((await db.query("select id from public.list_activity_draft_units() order by id")).rows).toEqual([{ id: units.a }, { id: units.a1 }]);
  }));
  it.each(["technician", "technical", "functional", "clone", "inactive", "suspended"] as const)("%s não lê rascunhos só por conhecer IDs", actor => transaction(async () => {
    const reply = await create("managerA"); await identify(actor);
    expect((await db.query("select id from public.activities where id=$1", [reply.id])).rows).toEqual([]);
    expect((await db.query("select activity_id from public.activity_events")).rows).toEqual([]);
  }));
  it("mesma intenção/conteúdo normalizado devolve o mesmo id sem duplicar eventos", () => transaction(async () => {
    const first = await create("managerA", units.a, request(1), "  Título  ", null);
    const second = await create("managerA", units.a, request(1), "Título", "");
    expect(second).toEqual({ ...first, replayed: true });
    expect(await totals()).toEqual({ drafts: 1, events: 1, requests: 1, audit: 1 });
  }));
  it("mesma intenção com conteúdo diferente recusa conflito sem novo efeito", () => transaction(async () => {
    await create("managerA");
    await refuse("managerA", [units.a, "Outro conteúdo", "", request(1)], "23505");
    expect(await totals()).toEqual({ drafts: 1, events: 1, requests: 1, audit: 1 });
  }));
  it("request_id igual de outro criador não devolve o resultado anterior", () => transaction(async () => {
    const first = await create("managerA"); const second = await create("peerA");
    expect(second.id).not.toBe(first.id);
    expect(second.replayed).toBe(false);
    expect(await totals()).toEqual({ drafts: 2, events: 2, requests: 2, audit: 2 });
  }));
  it.each(["revoke", "suspend"] as const)("replay revalida acesso após %s, sem devolver um id por posse da chave", mode => transaction(async () => {
    await create("managerA"); await identify();
    if (mode === "revoke") await db.query("update public.user_role_assignments set valid_until=clock_timestamp() where user_id=$1 and role_code='manager'", [actors.managerA]);
    else await db.query("update public.profiles set status='suspended' where id=$1", [actors.managerA]);
    await refuse("managerA", [units.a, "Rascunho fictício", "", request(1)]);
    expect(await totals()).toEqual({ drafts: 1, events: 1, requests: 1, audit: 1 });
  }));
  it.each(["anon", "authenticated", "service_role"])("%s não recebe DML, TRUNCATE ou acesso ao registry privado", role => transaction(async () => {
    await identify();
    expect((await db.query("select has_table_privilege($1,'public.activities','INSERT') as insert,has_table_privilege($1,'public.activities','UPDATE') as update,has_table_privilege($1,'public.activities','DELETE') as delete,has_table_privilege($1,'public.activities','TRUNCATE') as truncate,has_schema_privilege($1,'activity_private','USAGE') as private", [role])).rows)
      .toEqual([{ insert: false, update: false, delete: false, truncate: false, private: false }]);
  }));
  it("pedido de DML directo não pode injectar actor/status/código", () => transaction(async () => {
    await identify("managerA"); await db.exec("savepoint direct_insert");
    await expect(db.query("insert into public.activities(code,title,responsible_unit_id,created_by,status) values('ACT-00000000000000000000000000000000','Forjado',$1,$2,'completed')", [units.a, actors.peerA])).rejects.toMatchObject({ code: "42501" });
    await db.exec("rollback to savepoint direct_insert");
    expect(await totals()).toEqual({ drafts: 0, events: 0, requests: 0, audit: 0 });
  }));
});
