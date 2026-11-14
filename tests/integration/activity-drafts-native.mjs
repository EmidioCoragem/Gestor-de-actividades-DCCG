// F2-F01: PostgreSQL 17 real, exclusivamente local/descartavel; Auth/identidades ficticios.
// Requer Node 24, Docker local e postgres:17-alpine JA EM CACHE. Nunca descarrega imagens.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import {
  activityActorContextSQL,
  activityActors,
  activityAuthFixtureSQL,
  activityMigrationPaths,
  activityRequestId,
  activitySeedFixtureSQL,
  activityUnits,
} from "../fixtures/activity-drafts-database.ts";

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith("SUPABASE_") || key.startsWith("NEXT_PUBLIC_SUPABASE_") || key === "APP_ORIGIN") delete env[key];
}
for (const key of ["DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_TLS", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) delete env[key];
const host = ["--host=unix:///var/run/docker.sock"];
const token = randomUUID();
const name = `gestor-activity-drafts-native-${process.pid}-${token.slice(0, 8)}`;
const database = "activity_drafts_isolated";
const image = "postgres:17-alpine";
const root = new URL("../../", import.meta.url);
const migrations = activityMigrationPaths.map((path) => readFileSync(new URL(path, root), "utf8"));
const digest = (value) => createHash("sha256").update(value).digest("hex");
assert.equal(digest(migrations[0]), "56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58");
assert.equal(digest(migrations[1]), "fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5");
const clients = new Set();
let attemptedCreate = false;
let cleaned = false;
let passed = 0;
let serial = 0;

function docker(args, input) {
  const result = spawnSync("docker", [...host, ...args], {
    env, input, encoding: "utf8", maxBuffer: 2 * 1024 * 1024, timeout: 30000,
  });
  if (result.error || result.status !== 0) throw new Error(`Docker local: ${result.error?.message ?? result.stderr}`);
  return result.stdout.trim();
}
const psql = ["exec", "-i", name, "psql", "--no-psqlrc", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database];
const sql = (text) => docker(psql, text);

class Session {
  constructor(label) {
    this.label = `f01_${++serial}_${label}`;
    this.out = "";
    this.err = "";
    this.process = spawn("docker", [...host, ...psql], { env, stdio: ["pipe", "pipe", "pipe"] });
    clients.add(this);
    this.process.stdin.on("error", (error) => { if (error.code !== "EPIPE") this.err += error.message; });
    this.process.stdout.on("data", (data) => { this.out += data; });
    this.process.stderr.on("data", (data) => { this.err += data; });
    this.done = new Promise((resolve, reject) => {
      this.process.on("error", reject);
      this.process.on("close", (code) => { clients.delete(this); resolve(code); });
    });
    this.send(`\\set VERBOSITY sqlstate\nset application_name='${this.label}'; set statement_timeout='15s'; set lock_timeout='6s';`);
  }
  send(text) { this.process.stdin.write(text + "\n"); }
  async marker(value) {
    const end = Date.now() + 12000;
    while (!this.out.includes(value)) {
      if (this.err || this.process.exitCode !== null || Date.now() > end) throw new Error(`Sessao nao atingiu ${value}: ${this.err}`);
      await delay(25);
    }
  }
  async end(text = "") {
    if (!this.process.stdin.destroyed && !this.process.stdin.writableEnded) this.process.stdin.end(text + "\n");
    return this.done;
  }
  json() { return this.out.split("\n").filter((line) => line.startsWith("{")).map((line) => JSON.parse(line)); }
}

const call = (request, title = "Rascunho ficticio nativo", unit = activityUnits.a) =>
  `select public.create_activity_draft('${unit}','${title}','Descricao inteiramente ficticia','${request}');`;
const counts = () => sql(`select jsonb_build_array(
  (select count(*) from public.activities),(select count(*) from public.activity_events),
  (select count(*) from activity_private.activity_draft_requests),
  (select count(*) from public.audit_logs where entity_type='activity' and action='DRAFT_CREATED'));`);
const mark = (label) => { passed++; console.log(`APROVADO: ${label}`); };

async function waitLock(session, event) {
  const end = Date.now() + 4000;
  for (;;) {
    const result = sql(`select count(*) from pg_catalog.pg_stat_activity
      where application_name='${session.label}' and wait_event_type='Lock' and wait_event='${event}';`);
    if (result === "1") return;
    if (session.err || Date.now() > end) throw new Error(`Sessao nao esperou pelo lock ${event}: ${session.err}`);
    await delay(25);
  }
}
async function closeSessions(...sessions) {
  await Promise.allSettled(sessions.map((session) => session.end("rollback;")));
}
function assertFailure(code, session, state) {
  assert.notEqual(code, 0, "Operacao deveria falhar");
  assert.match(session.err, new RegExp(`ERROR:  ${state}`));
}

async function concurrentRequests(sameRequest, conflicting = false) {
  const a = new Session("create_a");
  const b = new Session("create_b");
  const requestA = activityRequestId(9100 + serial * 2);
  const requestB = sameRequest ? requestA : activityRequestId(9101 + serial * 2);
  const before = JSON.parse(counts());
  try {
    a.send(activityActorContextSQL("managerA") + call(requestA) + "\n\\echo A_CREATED");
    await a.marker("A_CREATED");
    b.send(activityActorContextSQL("managerA") + call(requestB, conflicting ? "Conteudo diferente ficticio" : undefined) + "\n\\echo B_CREATED");
    if (sameRequest) {
      await waitLock(b, "advisory");
      assert.equal(await a.end("commit;"), 0, a.err);
      if (conflicting) {
        assertFailure(await b.end("commit;"), b, "23505");
      } else {
        await b.marker("B_CREATED");
        assert.equal(await b.end("commit;"), 0, b.err);
        assert.equal(a.json()[0].id, b.json()[0].id);
        assert.equal(a.json()[0].replayed, false);
        assert.equal(b.json()[0].replayed, true);
      }
    } else {
      // B tem de concluir enquanto A ainda mantem as suas locks SHARE e transaccao aberta.
      await b.marker("B_CREATED");
      assert.equal(await b.end("commit;"), 0, b.err);
      assert.equal(sql("select count(*) from public.activities;"), String(before[0] + 1));
      assert.equal(await a.end("commit;"), 0, a.err);
      assert.notEqual(a.json()[0].id, b.json()[0].id);
    }
    const delta = sameRequest ? 1 : 2;
    assert.deepEqual(JSON.parse(counts()), before.map((count) => count + delta));
    mark(conflicting ? "mesma intencao concorrente com conteudo diferente: 23505, um draft/evento/auditoria"
      : sameRequest ? "mesma intencao concorrente: um draft/evento/auditoria e replay do mesmo ID"
        : "duas criacoes de chaves distintas compatíveis em SHARE, sem serializacao global");
  } finally { await closeSessions(a, b); }
}

async function revokeWhileWaiting(suspend) {
  const actor = suspend ? "peerA" : "managerB";
  const unit = suspend ? activityUnits.a : activityUnits.b;
  const request = activityRequestId(9300 + serial);
  const writer = new Session("authority_writer");
  const requester = new Session("authority_requester");
  const before = counts();
  try {
    // O inicio de B antecede a revogacao: um teste baseado apenas em now() seria insuficiente.
    requester.send(activityActorContextSQL(actor) + "select 1;\n\\echo REQUEST_BEGUN");
    await requester.marker("REQUEST_BEGUN");
    writer.send("begin;" + (suspend
      ? `update public.profiles set status='suspended' where id='${activityActors[actor]}';`
      : `update public.user_role_assignments set valid_until=clock_timestamp() where user_id='${activityActors[actor]}' and role_code='manager' and valid_until is null;`) + "\n\\echo AUTHORITY_CHANGED");
    await writer.marker("AUTHORITY_CHANGED");
    requester.send(call(request, undefined, unit));
    await waitLock(requester, "relation");
    assert.equal(await writer.end("commit;"), 0, writer.err);
    assertFailure(await requester.end("commit;"), requester, "42501");
    assert.equal(counts(), before, "Recusa nao pode criar draft/evento/pedido/auditoria de actividade");
    mark(suspend ? "suspensao confirmada durante espera SHARE: revalidacao recusa, zero efeitos"
      : "revogacao posterior ao inicio da transaccao durante espera SHARE: revalidacao recusa, zero efeitos");
  } finally {
    await closeSessions(writer, requester);
    sql(suspend ? `update public.profiles set status='active' where id='${activityActors[actor]}';`
      : `update public.user_role_assignments set valid_until=null where user_id='${activityActors[actor]}' and role_code='manager';`);
  }
}

async function expiresWhileWaiting(replay) {
  const request = activityRequestId(9500 + serial);
  const blocker = new Session("advisory_blocker");
  const requester = new Session("expiring_requester");
  if (replay) sql(activityActorContextSQL("managerA") + call(request) + "commit;");
  const before = counts();
  try {
    blocker.send(`begin; select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('${activityActors.managerA}:${request}',0));\n\\echo LOCK_HELD`);
    await blocker.marker("LOCK_HELD");
    sql(`update public.user_role_assignments set valid_until=clock_timestamp()+interval '3 seconds'
      where user_id='${activityActors.managerA}' and role_code='manager';`);
    requester.send(activityActorContextSQL("managerA") + call(request));
    await waitLock(requester, "advisory");
    const end = Date.now() + 4000;
    while (sql(`select bool_and(valid_until<=clock_timestamp()) from public.user_role_assignments
      where user_id='${activityActors.managerA}' and role_code='manager';`) !== "t") {
      assert.ok(Date.now() < end, "A concessao nao expirou dentro do limite do teste");
      await delay(25);
    }
    assert.equal(await blocker.end("commit;"), 0, blocker.err);
    assertFailure(await requester.end("commit;"), requester, "42501");
    assert.equal(counts(), before);
    mark(`${replay ? "replay" : "criacao"}: vigencia expirada durante espera advisory, recheck recusa sem efeitos`);
  } finally {
    await closeSessions(blocker, requester);
    sql(`update public.user_role_assignments set valid_until=null where user_id='${activityActors.managerA}' and role_code='manager';`);
  }
}

async function failAuditAtomically() {
  const request = activityRequestId(9700);
  const before = counts();
  sql(`create function public.f01_test_fail_audit() returns trigger language plpgsql as $$ begin
    if new.entity_type='activity' and new.action='DRAFT_CREATED' then raise exception using errcode='23514',message='FALHA FICTICIA DE AUDITORIA'; end if;
    return new; end $$;
    create trigger zz_f01_test_fail_audit before insert on public.audit_logs for each row execute function public.f01_test_fail_audit();`);
  const session = new Session("audit_rollback");
  try {
    assertFailure(await session.end(activityActorContextSQL("managerA") + call(request) + "commit;"), session, "23514");
    assert.equal(counts(), before);
    assert.equal(sql(`select count(*) from activity_private.activity_draft_requests where request_id='${request}';`), "0");
    mark("falha injectada de auditoria: rollback integral de draft, pedido idempotente e evento");
  } finally {
    await closeSessions(session);
    sql("drop trigger zz_f01_test_fail_audit on public.audit_logs; drop function public.f01_test_fail_audit();");
  }
}

async function refusal(label, text, state = "42501", actor = "managerA", role = "authenticated", isolation = "READ COMMITTED") {
  const before = counts();
  const session = new Session("refusal");
  try {
    const context = role === "authenticated" ? activityActorContextSQL(actor, isolation)
      : `set session authorization authenticator; begin; set local role ${role};`;
    assertFailure(await session.end(context + text + "commit;"), session, state);
    assert.equal(counts(), before);
    mark(`${label}: ${state}, sem efeitos`);
  } finally { await closeSessions(session); }
}

function cleanup() {
  if (cleaned) return;
  cleaned = true;
  for (const client of clients) client.process.kill("SIGTERM");
  if (!attemptedCreate) return;
  // Mesmo se docker run falhar apos criar: remover apenas o nome E o token deste runner.
  const result = spawnSync("docker", [...host, "inspect", "--format", '{{index .Config.Labels "gestor.activity_drafts_token"}}', name], { env, encoding: "utf8", timeout: 10000 });
  if (result.status === 0) {
    assert.equal(result.stdout.trim(), token, "Nunca remover contentor sem token proprio");
    docker(["rm", "--force", name]);
    const remaining = docker(["ps", "--all", "--quiet", "--filter", `label=gestor.activity_drafts_token=${token}`]);
    assert.equal(remaining, "", "O contentor descartavel tem de ficar removido");
    console.log("LIMPEZA: contentor proprio removido; dados tmpfs descartados; nenhum porto publicado.");
  } else if (!/No such (object|container)/i.test(result.stderr ?? "")) {
    throw new Error("Nao foi possivel confirmar limpeza do contentor proprio.");
  }
}
for (const [signal, exitCode] of [["SIGINT", 130], ["SIGTERM", 143]]) process.once(signal, () => {
  try { cleanup(); } finally { process.exit(exitCode); }
});

try {
  const imageId = docker(["image", "inspect", image, "--format", "{{.Id}}"]);
  attemptedCreate = true;
  docker(["run", "--detach", "--pull=never", "--name", name, "--network", "none",
    "--label", `gestor.activity_drafts_token=${token}`, "--env", "POSTGRES_HOST_AUTH_METHOD=trust",
    "--env", `POSTGRES_DB=${database}`, "--tmpfs", "/var/lib/postgresql/data:rw,size=268435456",
    image, "postgres", "-c", "listen_addresses=", "-c", "unix_socket_directories=/var/run/postgresql"]);
  const end = Date.now() + 60000;
  for (;;) {
    try {
      assert.equal(docker(["exec", name, "cat", "/proc/1/comm"]), "postgres");
      docker(["exec", name, "pg_isready", "-h", "/var/run/postgresql", "-U", "postgres", "-d", database]);
      break;
    } catch (error) { if (Date.now() > end) throw error; await delay(100); }
  }
  assert.equal(docker(["inspect", "--format", "{{.HostConfig.NetworkMode}}", name]), "none");
  assert.equal(docker(["inspect", "--format", "{{json .HostConfig.PortBindings}}", name]), "{}");
  assert.equal(sql("show listen_addresses;"), "");
  const version = sql("show server_version;");
  assert.match(version, /^17\./);
  console.log(`PostgreSQL ${version}; imagem local ${imageId}; --pull=never, rede none, sem TCP/portos, dados em tmpfs.`);
  console.log(`Migracao F2-F01 SHA-256: ${digest(migrations[2])}`);
  sql(activityAuthFixtureSQL);
  sql(migrations[0]);
  sql(activitySeedFixtureSQL());
  sql(migrations[1]);
  sql(migrations[2]);
  console.log("Tres migracoes aplicadas apenas na base descartavel; identidades Auth/organizacao inteiramente ficticias.");
  await concurrentRequests(false);
  await concurrentRequests(true);
  await concurrentRequests(true, true);
  await revokeWhileWaiting(false);
  await revokeWhileWaiting(true);
  await expiresWhileWaiting(false);
  await expiresWhileWaiting(true);
  await failAuditAtomically();
  for (const isolation of ["REPEATABLE READ", "SERIALIZABLE"]) {
    await refusal(`${isolation} recusado`, call(activityRequestId(9800 + passed)), "0A000", "managerA", "authenticated", isolation);
  }
  await refusal("INSERT directo", `insert into public.activities(id,code,title,responsible_unit_id,created_by)
    values('d1000000-0000-4000-8000-000000000001','ACT-D1000000000040008000000000000001','FORJADO','${activityUnits.a}','${activityActors.managerA}');`);
  await refusal("UPDATE directo", "update public.activities set title='FORJADO';");
  await refusal("DELETE directo", "delete from public.activities;");
  await refusal("evento directo forjado", "insert into public.activity_events(activity_id,event_kind,actor_id,version) select id,'draft_created',created_by,1 from public.activities;");
  await refusal("registry privado", "select * from activity_private.activity_manager_roles;");
  await refusal("service_role sem leitura operacional", "select * from public.activities;", "42501", "managerA", "service_role");
  await refusal("service_role sem RPC", call(activityRequestId(9900)), "42501", "managerA", "service_role");
  await refusal("anon sem leitura", "select * from public.activities;", "42501", "managerA", "anon");
  console.log(`RESULTADO: ${passed} verificacoes nativas aprovadas; nenhum servico remoto/real ou download.`);
} finally { cleanup(); }
