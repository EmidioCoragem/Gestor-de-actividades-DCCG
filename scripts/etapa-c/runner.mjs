import assert from "node:assert/strict";
import { createLocalFixture, fingerprint, people } from "./fixture.mjs";
import { localCases } from "./cases.mjs";

// Nunca executa HTTP nem lê configuração de ambiente. auth.uid local é fixture:
// isto NÃO valida emissão de JWT, cookies, SMTP ou o serviço PostgREST.
export async function runLocalCase(db, scenario) {
  assert.ok(scenario.actor==="anon" || Object.hasOwn(people,scenario.actor));
  const before=await fingerprint(db);
  let failure;
  let lastRows=[];
  await db.exec("begin");
  try {
    for(const s of scenario.setup??[]) await db.query(s.sql,s.params);
    await db.exec(scenario.actor==="anon"?"set local role anon":"set local role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",
      [scenario.actor==="anon"?"":people[scenario.actor]]);
    for(const s of scenario.steps) lastRows=(await db.query(s.sql,s.params)).rows;
  } catch(error) { failure=error; }
  finally { await db.exec("rollback"); }
  // Mesmo os cenários positivos não deixam mutações nem auditoria residual na fixture.
  assert.deepEqual(await fingerprint(db),before,"Fixture alterada após rollback: "+scenario.id);
  if(scenario.error) {
    assert.equal(failure?.code,scenario.error,"SQLSTATE inesperado: "+scenario.id);
  } else {
    if(failure) throw failure;
    assert.deepEqual(lastRows,scenario.rows,"Resultado inesperado: "+scenario.id);
  }
  return {id:scenario.id,actor:scenario.actor,result:"LOCAL_PASS",remote:"NOT_EXECUTED"};
}
export async function runLocalSuite() {
  const db=await createLocalFixture();
  try {
    const results=[];
    for(const scenario of localCases) results.push(await runLocalCase(db,scenario));
    return {mode:"PGLITE_MEMORY_ONLY",remoteExecuted:false,results};
  } finally { await db.close(); }
}
