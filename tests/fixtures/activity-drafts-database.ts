// Identidades e SQL EXCLUSIVOS de bases locais descartáveis; nunca IDs remotos.
export const activityMigrationPaths = [
  "supabase/migrations/202610300001_fase1.sql",
  "supabase/migrations/202611050001_at_af_segregation.sql",
  "supabase/migrations/202611130001_activity_drafts.sql",
] as const;

export const activityActorNames = [
  "managerA", "managerB", "director", "executive", "technician", "inactive",
  "suspended", "technical", "functional", "clone", "mixed", "expired", "future", "flagged", "peerA",
] as const;
export type ActivityActor = typeof activityActorNames[number];
export const activityActors = Object.fromEntries(activityActorNames.map((name, index) =>
  [name, `a1000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`],
)) as Record<ActivityActor, string>;
export const activityUnits = {
  root: "b1000000-0000-4000-8000-000000000001",
  a: "b1000000-0000-4000-8000-000000000002",
  b: "b1000000-0000-4000-8000-000000000003",
  a1: "b1000000-0000-4000-8000-000000000004",
  inactive: "b1000000-0000-4000-8000-000000000005",
} as const;
export const activityRequestId = (index: number) => `c1000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

export const activityAuthFixtureSQL = `
create role anon; create role authenticated; create role service_role bypassrls;
create role authenticator noinherit;
grant anon,authenticated,service_role to authenticator;
create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth,public to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
-- Reproduzir defaults amplos: cada migração tem de fechar as ACLs dos seus objectos.
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
`;

export function activitySeedFixtureSQL() {
  const users = activityActorNames.map(name => `('${activityActors[name]}','${name.toLowerCase()}@example.invalid')`).join(",");
  const grants: [ActivityActor, string, string | null, string?][] = [
    ["managerA", "manager", activityUnits.a], ["managerB", "manager", activityUnits.b],
    ["director", "director", activityUnits.root], ["executive", "executive", null],
    ["technician", "technician", activityUnits.a], ["inactive", "manager", activityUnits.a],
    ["suspended", "manager", activityUnits.a], ["technical", "technical_admin", null],
    ["functional", "access_admin", null], ["clone", "c_draft_clone", activityUnits.a],
    ["mixed", "manager", activityUnits.a], ["mixed", "c_draft_clone", activityUnits.b],
    ["expired", "manager", activityUnits.a, "expired"], ["future", "manager", activityUnits.a, "future"],
    ["flagged", "c_draft_flagged", activityUnits.a], ["peerA", "manager", activityUnits.a],
  ];
  const assignments = grants.map(([actor, role, scope, period]) => {
    const from = period === "expired" ? "now()-interval '2 days'" : period === "future" ? "now()+interval '1 day'" : "now()-interval '1 day'";
    const until = period === "expired" ? "now()-interval '1 day'" : "NULL";
    return `('${activityActors[actor]}','${role}',${scope ? `'${scope}'` : "NULL"},${from},${until})`;
  }).join(",");
  return `
insert into auth.users(id,email) values ${users};
update public.profiles set status='active';
update public.profiles set status='inactive' where id='${activityActors.inactive}';
update public.profiles set status='suspended' where id='${activityActors.suspended}';
insert into public.organizational_units(id,code,name,kind) values('${activityUnits.root}','F01-ROOT','Empresa inteiramente fictícia','company');
insert into public.organizational_units(id,code,name,kind,parent_id,active) values
('${activityUnits.a}','F01-A','Departamento A fictício','department','${activityUnits.root}',true),
('${activityUnits.b}','F01-B','Departamento B fictício','department','${activityUnits.root}',true),
('${activityUnits.a1}','F01-A1','Secção A1 fictícia','section','${activityUnits.a}',true),
('${activityUnits.inactive}','F01-OFF','Unidade inactiva fictícia','department','${activityUnits.root}',false);
insert into public.roles(code,name,technical) values
('c_draft_clone','Capacidades sem papel elegível',false),('c_draft_flagged','Papel técnico fictício',true);
insert into public.role_permissions(role_code,permission_code) values
('c_draft_clone','activities.read'),('c_draft_clone','activities.create'),
('c_draft_flagged','activities.read'),('c_draft_flagged','activities.create');
insert into public.user_role_assignments(user_id,role_code,scope_unit_id,valid_from,valid_until) values ${assignments};
`;
}

export function activityActorContextSQL(actor: ActivityActor, isolation = "READ COMMITTED") {
  const id = activityActors[actor];
  return `set session authorization authenticator; begin isolation level ${isolation}; set local role authenticated;
set local request.jwt.claim.sub='${id}';set local request.jwt.claim.role='authenticated';
set local request.jwt.claims='{"role":"authenticated","sub":"${id}"}';`;
}
