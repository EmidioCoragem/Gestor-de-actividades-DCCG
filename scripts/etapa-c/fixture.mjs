// APENAS LOCAL: PostgreSQL em memória; não aceita URL, credenciais ou ambiente.
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

export const aliases = ["AT","AF","DIR","GA","GB","CA","CB","EST"];
export const people = Object.fromEntries(aliases.map((a,i) =>
  [a, "30000000-0000-4000-8000-"+String(i+1).padStart(12,"0")]));
export const units = {
  ROOT:"40000000-0000-4000-8000-000000000001",
  A:"40000000-0000-4000-8000-000000000002",
  B:"40000000-0000-4000-8000-000000000003",
  A1:"40000000-0000-4000-8000-000000000004",
};
export async function createLocalFixture() {
  const source = await readFile(new URL("../../supabase/migrations/202610300001_fase1.sql",import.meta.url),"utf8");
  if(createHash("sha256").update(source).digest("hex")!==
    "56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58") {
    throw new Error("Migração original alterada; interromper.");
  }
  const db = new PGlite(); // Sempre memória. Não é um cliente Supabase.
  try {
    await db.exec([
      "create role anon; create role authenticated; create schema auth;",
      "create table auth.users(id uuid primary key,email varchar(255),raw_user_meta_data jsonb default '{}');",
      "create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;",
      "grant usage on schema public,auth to anon,authenticated;",
      "grant execute on function auth.uid() to anon,authenticated;",
    ].join("\n"));
    await db.exec(source); // Apenas neste PGlite local.
    for(const alias of aliases) {
      await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3::jsonb)",
        [people[alias],"etapa-c-"+alias.toLowerCase()+"@example.invalid",JSON.stringify({full_name:"Fictício C "+alias})]);
      if(alias!=="EST") await db.query("update public.profiles set status='active' where id=$1",[people[alias]]);
    }
    for(const [key,code,name,kind,parent] of [
      ["ROOT","C-EMP","Empresa Fictícia C","company",null],
      ["A","C-DEP-A","Departamento Fictício A","department",units.ROOT],
      ["B","C-DEP-B","Departamento Fictício B","department",units.ROOT],
      ["A1","C-SEC-A1","Secção Fictícia A1","section",units.A],
    ]) await db.query("insert into public.organizational_units(id,code,name,kind,parent_id) values($1,$2,$3,$4,$5)",
      [units[key],code,name,kind,parent]);
    await db.exec([
      "insert into public.roles(code,name) values ('c_org_admin','C Organização'),('c_cost_reader','C Leitor de custos'),('c_scope_access','C Acesso limitado de ensaio');",
      "insert into public.role_permissions values ('c_org_admin','org.read'),('c_org_admin','org.manage'),('c_cost_reader','cost_centers.read'),('c_scope_access','access.manage');",
    ].join("\n"));
    for(const [alias,role,scope] of [
      ["AT","technical_admin",null],["AF","access_admin",null],["AF","c_org_admin",null],
      ["DIR","director",units.ROOT],["GA","manager",units.A],["GB","manager",units.B],
      ["GA","c_cost_reader",units.A],["GB","c_cost_reader",units.B],
      ["CA","technician",units.A],["CB","technician",units.B],
    ]) await db.query("insert into public.user_role_assignments(user_id,role_code,scope_unit_id) values($1,$2,$3)",
      [people[alias],role,scope]);
    const jobs={AT:"Tecnologia",AF:"Administração funcional",DIR:"Direcção",GA:"Chefia",GB:"Chefia",CA:"Colaborador",CB:"Colaborador",EST:"Colaborador"};
    for(const alias of aliases) {
      const unit=["AT","AF","DIR"].includes(alias)?units.ROOT:["GB","CB"].includes(alias)?units.B:units.A;
      await db.query("insert into public.positions(code,name) values($1,$2) on conflict(code) do nothing",[jobs[alias],"C Cargo "+jobs[alias]]);
      await db.query("insert into public.user_positions(user_id,unit_id,position_id) select $1,$2,id from public.positions where code=$3",
        [people[alias],unit,jobs[alias]]);
    }
    for(const [code,unit] of [["000C-A",units.A],["000C-B",units.B]]) {
      await db.query("insert into public.cost_centers(code,name,unit_id) values($1,$2,$3)",[code,"Fictício "+code,unit]);
    }
    return db;
  } catch(error) { await db.close(); throw error; }
}
export async function fingerprint(db) {
  const result={};
  const names=["profiles","organizational_units","positions","user_positions","unit_responsibilities",
    "reporting_lines","roles","permissions","role_permissions","user_role_assignments","delegations",
    "cost_centers","integration_sources","external_identity_mappings","import_batches","audit_logs"];
  for(const name of names) {
    result[name]=(await db.query("select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb)::text) as hash from public."+name+" t")).rows[0].hash;
  }
  return result;
}
