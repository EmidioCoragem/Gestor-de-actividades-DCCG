// PostgreSQL nativo descartável. Sem TCP, Supabase, JWT reais ou portas publicadas.
// Requer Docker local e a imagem postgres:17-alpine já obtida pelo operador.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
const env = { ...process.env };
for (const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[key];
const host = ['--host=unix:///var/run/docker.sock'];
const name = `gestor-at-af-native-${process.pid}`;
const database = 'segregation_local';
const original = readFileSync('supabase/migrations/202610300001_fase1.sql','utf8');
assert.equal(createHash('sha256').update(original).digest('hex'),'56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58');
const migration = readFileSync('supabase/migrations/202611050001_at_af_segregation.sql','utf8');
const af = '80000000-0000-4000-8000-000000000002';
let passed = 0;
function docker(args, input) {
  const r = spawnSync('docker',[...host,...args],{ env, input, encoding:'utf8', maxBuffer:2*1024*1024, timeout:60000 });
  if (r.error || r.status !== 0) throw new Error(`Docker local: ${r.error?.message ?? r.stderr}`);
  return r.stdout.trim();
}
const args = ['exec','-i',name,'psql','--no-psqlrc','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d',database];
function sql(text) { return docker(args,text); }
class Session {
  constructor(label) {
    this.out=''; this.err='';
    this.process=spawn('docker',[...host,...args],{env,stdio:['pipe','pipe','pipe']});
    this.process.stdin.on('error',error=>{ if(error.code!=='EPIPE') this.err+=error.message; });
    this.process.stdout.on('data',b=>{this.out+=b;});
    this.process.stderr.on('data',b=>{this.err+=b;});
    this.done=new Promise((resolve,reject)=>{this.process.on('error',reject);this.process.on('close',code=>resolve(code));});
    this.send(`\\set VERBOSITY sqlstate\nset application_name='at_af_${label}'; set statement_timeout='12s'; set lock_timeout='8s';`);
  }
  send(text) { this.process.stdin.write(text+'\n'); }
  async marker(value) {
    const end=Date.now()+12000;
    while (!this.out.includes(value)) {
      if (this.err || Date.now()>end) throw new Error(`Sessão não atingiu ${value}: ${this.err}`);
      await delay(50);
    }
  }
  async end(text='') { if(!this.process.stdin.destroyed && !this.process.stdin.writableEnded) this.process.stdin.end(text+'\n'); return this.done; }
}
function context(kind,isolation='READ COMMITTED') {
  const identity=kind==='technical'?'local_operator':'authenticator';
  const role=kind==='technical'?'gestor_security_operator':'authenticated';
  return `set session authorization ${identity}; begin isolation level ${isolation}; set local role ${role};`+
    (kind==='technical'?'':`set local request.jwt.claim.sub='${af}'; set local request.jwt.claim.role='authenticated'; set local request.jwt.claims='{"role":"authenticated","sub":"${af}"}';`);
}
function mutation(kind,target) {
  return kind==='technical'
    ? `select gestor_security.maintain_technical_admin('${target}','grant','LOCAL-CHANGE-001','LOCAL-APPROVAL-001');`
    : `select public.admin_mutation('grant_role','{"user_id":"${target}","role_code":"c_subject"}');`;
}
async function race(isolation,first,index) {
  const target=`83000000-0000-4000-8000-${String(index).padStart(12,'0')}`;
  sql(`insert into auth.users(id,email) values('${target}','case${index}@example.invalid'); update public.profiles set status='active' where id='${target}';`);
  const second=first==='technical'?'functional':'technical';
  const a=new Session('A'); const b=new Session('B');
  try {
    b.send(context(second,isolation)+"select count(*) from pg_catalog.pg_class;\n\\echo SNAPSHOT_B");
    await b.marker('SNAPSHOT_B');
    a.send(context(first)+mutation(first,target)+"\n\\echo WRITTEN_A");
    await a.marker('WRITTEN_A');
    b.send(mutation(second,target));
    const deadline=Date.now()+6000;
    while (sql("select count(*) from pg_stat_activity where application_name='at_af_B' and wait_event_type='Lock';")!=='1') {
      if (Date.now()>deadline || b.err) throw new Error(`B não bloqueou na guarda: ${b.err}`);
      await delay(50);
    }
    assert.equal(await a.end('commit;'),0,a.err);
    assert.notEqual(await b.end('commit;'),0,'B não pode confirmar mistura');
    const expected=isolation==='READ COMMITTED'?'42501':'40001';
    assert.match(b.err,new RegExp(`ERROR:  ${expected}`));
    assert.equal(sql(`select count(*) from public.user_role_assignments where user_id='${target}';`),'1');
    assert.equal(sql(`select count(*) from public.user_role_assignments a join public.user_role_assignments b on a.user_id=b.user_id and a.id<>b.id where a.user_id='${target}' and (a.role_code='technical_admin' or b.role_code='technical_admin') and tstzrange(a.valid_from,a.valid_until,'[)') && tstzrange(b.valid_from,b.valid_until,'[)');`),'0');
    passed++; console.log(`APROVADO: ${isolation}, ${first} primeiro, B=${expected}, sem mistura`);
  } finally {
    // Terminar apenas os clientes criados pelo teste. O servidor vive só neste contentor.
    if (!a.process.stdin.destroyed) a.process.stdin.end('rollback;\n');
    if (!b.process.stdin.destroyed) b.process.stdin.end('rollback;\n');
    await Promise.allSettled([a.done,b.done]);
  }
}
async function refusal(label,text,role='service_role') {
  const before=sql(`select md5(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text) from public.audit_logs t;`);
  const session=new Session('DENY');
  const code=await session.end(`set session authorization authenticator; begin;set local role ${role};${text}\ncommit;`);
  assert.notEqual(code,0,label); assert.match(session.err,/ERROR:  42501/,label);
  assert.equal(sql(`select md5(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text) from public.audit_logs t;`),before);
  passed++; console.log(`APROVADO: ${label}, 42501, auditoria preservada`);
}
let created=false;
try {
  docker(['run','--detach','--name',name,'--network','none','--label','gestor.at_af_native=true','--env','POSTGRES_HOST_AUTH_METHOD=trust','--env',`POSTGRES_DB=${database}`,'--tmpfs','/var/lib/postgresql/data:rw','postgres:17-alpine']);
  created=true;
  const deadline=Date.now()+60000;
  for (;;) {
    try {
      // O entrypoint usa um servidor temporário durante initdb; não o confundir com o definitivo.
      assert.equal(docker(['exec',name,'cat','/proc/1/comm']),'postgres');
      docker(['exec',name,'pg_isready','-U','postgres','-d',database]); break;
    }
    catch(error) { if(Date.now()>deadline) throw error; await delay(100); }
  }
  assert.equal(docker(['inspect','--format','{{.HostConfig.NetworkMode}}',name]),'none');
  assert.equal(docker(['inspect','--format','{{json .HostConfig.PortBindings}}',name]),'{}');
  sql(`create role anon; create role authenticated; create role service_role bypassrls;
    create role authenticator noinherit; create role local_operator noinherit;
    grant anon,authenticated,service_role to authenticator;
    create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to anon,authenticated,service_role;`);
  sql(original);
  sql(`insert into auth.users(id,email) values('${af}','af@example.invalid'); update public.profiles set status='active' where id='${af}';
    insert into public.user_role_assignments(user_id,role_code) values('${af}','access_admin');
    insert into public.roles(code,name) values('c_subject','Subject');`);
  sql(migration);
  sql(`grant gestor_security_operator to local_operator;
    grant select,insert,update,delete,truncate on public.roles,public.permissions,public.role_permissions,public.user_role_assignments,public.delegations,public.profiles,public.audit_logs to service_role;`);
  console.log('PostgreSQL local: '+sql('show server_version;')+'; contentor sem rede/portas; migrações aplicadas só na base descartável');
  let index=1;
  for (const isolation of ['READ COMMITTED','REPEATABLE READ','SERIALIZABLE'])
    for (const first of ['technical','functional']) await race(isolation,first,index++);
  for (const [label,text] of [
    ['TRUNCATE directo','truncate public.audit_logs;'],
    ['TRUNCATE com CASCADE','truncate public.user_role_assignments cascade;'],
    ['DELETE de auditoria','delete from public.audit_logs;'],
    ['UPDATE de auditoria',"update public.audit_logs set action='FORGED';"],
    ['INSERT forjado de auditoria',"insert into public.audit_logs(entity_type,action) values('forged','FORGED');"],
    ['desactivar trigger','alter table public.user_role_assignments disable trigger segregation_guard;'],
    ['contornar por replication_role',"set session_replication_role='replica';"],
    ['assumir manutenção','set role gestor_security_operator;'],
    ['chamar RPC legada',"select gestor_security.admin_mutation_legacy('grant_role','{}');"],
  ]) await refusal(label,text);
  assert.equal(sql("select count(*) from public.audit_logs where entity_type='technical_admin_maintenance' and actor_id is null and after_data->>'operator_db'='local_operator';"),'3');
  passed++; console.log('APROVADO: três concessões técnicas privilegiadas com proveniência SQL e referências de auditoria');
  console.log(`RESULTADO: ${passed} verificações nativas aprovadas; zero serviços remotos`);
} finally {
  if(created) docker(['rm','--force',name]);
}
