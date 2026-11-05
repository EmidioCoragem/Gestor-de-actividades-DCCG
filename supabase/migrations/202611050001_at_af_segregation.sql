-- Migracao incremental AT/AF. Implementacao local autorizada; aplicacao remota NAO autorizada.
-- Preserva 202610300001_fase1.sql; executar uma unica vez apenas apos aprovacao propria.
begin;
set local lock_timeout='5s';
-- Estabilizar inventario antes do preflight; sem saneamento ou concessoes automaticas.
lock table public.roles,public.permissions,public.role_permissions,public.user_role_assignments,
 public.delegations,public.profiles,public.audit_logs in share row exclusive mode;

do $$ begin
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname in ('roles','permissions','role_permissions','user_role_assignments','delegations','profiles','audit_logs')
   and c.relowner<>current_user::regrole)
 or exists(select 1 from pg_proc p where p.oid in (
   'public.admin_mutation(text,jsonb)'::regprocedure,'public.record_audit()'::regprocedure,
   'public.audit_invitation(text,text,uuid)'::regprocedure,'public.handle_auth_user()'::regprocedure)
   and p.proowner<>current_user::regrole) then
   raise exception using errcode='23514',message='Propriedade divergente: rever escritores e auditoria antes de instalar.';
 end if;
 if not exists(select 1 from public.roles where code='technical_admin' and technical)
 or not exists(select 1 from public.roles where code='access_admin' and technical)
 or (select array_agg(permission_code order by permission_code) from public.role_permissions where role_code='technical_admin')
    is distinct from array['users.manage','users.read']::text[]
 or (select array_agg(permission_code order by permission_code) from public.role_permissions where role_code='access_admin')
    is distinct from array['access.manage','audit.read','org.read','users.read']::text[]
 or exists(select 1 from public.role_permissions where permission_code='users.manage' and role_code<>'technical_admin')
 or exists(select 1 from public.user_role_assignments where role_code='technical_admin' and scope_unit_id is not null)
 or exists(select 1 from public.delegations where permission_code in ('users.manage','access.manage'))
 or exists(select 1 from public.user_role_assignments a join public.user_role_assignments b
   on a.user_id=b.user_id and a.id<>b.id and (a.role_code='technical_admin' or b.role_code='technical_admin')
   and tstzrange(a.valid_from,a.valid_until,'[)') && tstzrange(b.valid_from,b.valid_until,'[)'))
 then raise exception using errcode='23514',message='Inventario incompatível; rever antes de instalar. Nenhum saneamento automatico.'; end if;
end $$;

-- Detectar drift de corpos/ownership antes de reutilizar o legado privilegiado.
-- SHA-256 do prosrc original; apenas CRLF e normalizado para LF.
do $$ begin
 if exists(select 1 from (values
  ('public.is_active_user()','67b5971cc9615f7a03aa6646b1c3dc6b999324d5d0f8e87e906550112fe00506'),
  ('public.in_unit_scope(uuid,uuid)','82430433e56ad04c33869942fc5251cbfa6842696eca33ca7fbc8fd43bd82632'),
  ('public.has_permission(text,uuid)','75cac24a0045a71da3c7c241228f6faca0cab0b769a55c568a4276396db6bc39'),
  ('public.visible_person(uuid,text)','ce7ed34d0dc9d985b47b7005843beafc18b19a6dbcdae0cb061d9b2ae7cf7849'),
  ('public.my_permissions()','acb927c14a591eb923eaebf01f93d842007d4270022161c3a06217a15f203001'),
  ('public.may_validate_activity(uuid[],uuid)','1324af55de241090bd6552c8d701087f95a489146bc86275c32e7711b23f3db6'),
  ('public.handle_auth_user()','964ade604e8b820df7210457fa6cf40ad7a92ca7ec1c623326e2123587f18915'),
  ('public.protect_unit_tree()','b006d3af86f7b5260cf8e9773695731053a380f6377a4e00b3622ffef6b57b47'),
  ('public.protect_cost_tree()','4309ec57f30c344836c0dc6bb12e61ee2aa3aab5f495ef8d8c9ff3ed3cfe6194'),
  ('public.record_audit()','2a1a9061e54138c19dadee49bcb5e80f3cd887223cc05ed8d7cb76eb4ce84a20'),
  ('public.admin_mutation(text,jsonb)','9a50d386bfd96e335b635ffab51860d0ad69dc98ad3ae6d3caaf2babf9367057'),
  ('public.audit_invitation(text,text,uuid)','b0566c60255a6a400cbe9226311b4369cf140e04c3926d205c9afc6f44c162c7')
 ) expected(signature,digest)
 left join pg_proc p on p.oid=to_regprocedure(expected.signature)
 where p.oid is null or p.proowner<>current_user::regrole
   or encode(sha256(convert_to(replace(p.prosrc,E'\r\n',E'\n'),'UTF8')),'hex')<>expected.digest) then
   raise exception using errcode='23514',message='Drift de funcao/ownership: rever a base antes de instalar.';
 end if;
end $$;

create schema gestor_security;
revoke all on schema gestor_security from public,anon,authenticated,service_role;
create role gestor_security_operator nologin noinherit;
-- Nao conceder esta identidade a authenticator, anon, authenticated ou service_role.
grant usage on schema gestor_security to gestor_security_operator;

-- Recusar proprietarios API: BYPASSRLS nao equivale a proprietario de objectos.
do $$ begin
 if exists(select 1 from pg_roles where rolname in ('anon','authenticated','service_role','authenticator')
   and (rolsuper or rolcreaterole))
 or exists(select 1 from pg_roles where rolname in ('anon','authenticated') and rolbypassrls) then
   raise exception using errcode='23514',message='Identidade API com poderes SQL incompatíveis.';
 end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
   join pg_roles r on r.oid=c.relowner where n.nspname='public'
   and c.relname in ('roles','permissions','role_permissions','user_role_assignments','delegations','profiles','audit_logs')
   and (r.rolname in ('anon','authenticated','service_role','authenticator')
     or exists(select 1 from pg_roles api where api.rolname in ('anon','authenticated','service_role','authenticator')
       and pg_has_role(api.oid,c.relowner,'MEMBER')))) then
   raise exception using errcode='23514',message='Proprietario API incompatível com a guarda.';
 end if;
end $$;

-- Um conflito de escrita real, alem do lock consultivo legado, faz falhar
-- snapshots obsoletos em REPEATABLE READ/SERIALIZABLE em vez de permitir mistura.
create table gestor_security.write_epoch(id integer primary key check(id=1), epoch bigint not null);
insert into gestor_security.write_epoch values(1,0);
revoke all on gestor_security.write_epoch from public,anon,authenticated,service_role,gestor_security_operator;

create function gestor_security.serialize_write() returns void
 language plpgsql security definer set search_path='' as $$ begin
 update gestor_security.write_epoch set epoch=epoch+1 where id=1;
 if not found then raise exception 'Guarda de segregacao indisponivel'; end if;
end $$;

create function gestor_security.operator_session() returns boolean
 language sql stable security definer set search_path='' as $$
 select current_setting('role',true)='gestor_security_operator'
 and session_user not in ('authenticator','anon','authenticated','service_role')
 and pg_has_role(session_user,'gestor_security_operator','MEMBER')
 and auth.uid() is null
 and coalesce(current_setting('request.jwt.claim.role',true),'')=''
 and coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb='{}'::jsonb;
$$;

create function gestor_security.maintenance_context() returns boolean
 language sql stable security definer set search_path='' as $$
 select gestor_security.operator_session()
 and coalesce(current_setting('gestor_security.change_ref',true),'') ~ '^[A-Za-z0-9_:/.-]{3,100}$'
 and coalesce(current_setting('gestor_security.approval_ref',true),'') ~ '^[A-Za-z0-9_:/.-]{3,100}$';
$$;

create function gestor_security.enforce_segregation() returns trigger
 language plpgsql security definer set search_path='' as $$
 declare previous jsonb; incoming jsonb; old_role text; new_role text; actor uuid;
 begin
 perform gestor_security.serialize_write();
 actor=auth.uid();
 if tg_op<>'INSERT' then previous=to_jsonb(old); end if;
 if tg_op<>'DELETE' then incoming=to_jsonb(new); end if;
 old_role=previous->>'role_code'; new_role=incoming->>'role_code';

 if tg_table_name='roles' then
   if previous->>'code' in ('technical_admin','access_admin') or incoming->>'code' in ('technical_admin','access_admin') then
     raise exception using errcode='42501',message='Definicao de papel reservado exige revisao de migracao.';
   end if;
 elsif tg_table_name='permissions' then
   if previous->>'code' in ('users.manage','access.manage') or incoming->>'code' in ('users.manage','access.manage') then
     raise exception using errcode='42501',message='Catalogo administrativo reservado.';
   end if;
 elsif tg_table_name='role_permissions' then
   if old_role in ('technical_admin','access_admin') or new_role in ('technical_admin','access_admin')
     or (incoming->>'permission_code'='users.manage' and new_role<>'technical_admin') then
     raise exception using errcode='42501',message='Capacidade tecnica reservada; nao pode ser copiada ou alterada.';
   end if;
   if actor is not null and exists(select 1 from public.user_role_assignments a
     where a.user_id=actor and a.role_code in (old_role,new_role) and (a.valid_until is null or a.valid_until>now())) then
     raise exception using errcode='42501',message='Nao pode alterar capacidades de papel proprio actual ou futuro.';
   end if;
 elsif tg_table_name='user_role_assignments' then
   if actor is not null and (previous->>'user_id'=actor::text or incoming->>'user_id'=actor::text) then
     raise exception using errcode='42501',message='Auto-alteracao de concessoes recusada.';
   end if;
   if old_role='technical_admin' or new_role='technical_admin' then
     if not gestor_security.maintenance_context() then
       raise exception using errcode='42501',message='Concessao tecnica exclusiva de manutencao autorizada.';
     end if;
   end if;
   if tg_op<>'DELETE' then
     if new_role='technical_admin' and new.scope_unit_id is not null then
       raise exception using errcode='42501',message='Papel tecnico exige ambito global.';
     end if;
     if exists(select 1 from public.user_role_assignments a
       where a.user_id=new.user_id and a.id<>new.id
       and (a.role_code='technical_admin' or new_role='technical_admin')
       and tstzrange(a.valid_from,a.valid_until,'[)') && tstzrange(new.valid_from,new.valid_until,'[)')) then
       raise exception using errcode='42501',message='Concessoes tecnicas sobrepostas ou acumuladas recusadas.';
     end if;
   end if;
 elsif tg_table_name='delegations' then
   if incoming->>'permission_code' in ('users.manage','access.manage') then
     raise exception using errcode='42501',message='Autoridade administrativa nao delegavel.';
   end if;
 elsif tg_table_name='profiles' and tg_op in ('UPDATE','DELETE') then
   if (tg_op='DELETE' or new.status is distinct from old.status) and exists(
     select 1 from public.user_role_assignments a where a.user_id=old.id and a.role_code='technical_admin'
     and (a.valid_until is null or a.valid_until>now())) and not gestor_security.maintenance_context() then
     raise exception using errcode='42501',message='Estado de administrador tecnico exige manutencao autorizada.';
   end if;
 end if;
 return coalesce(new,old);
end $$;

do $$ declare name text; begin
 foreach name in array array['roles','permissions','role_permissions','user_role_assignments','delegations','profiles'] loop
   execute format('create trigger segregation_guard before insert or update or delete on public.%I for each row execute function gestor_security.enforce_segregation()',name);
   execute format('alter table public.%I enable always trigger segregation_guard',name);
 end loop;
end $$;

-- TRUNCATE nao executa triggers por linha. Recusar separadamente.
create function gestor_security.deny_truncate() returns trigger
 language plpgsql set search_path='' as $$ begin
 raise exception using errcode='42501',message='TRUNCATE de seguranca/auditoria recusado.';
end $$;

-- Invoker de proposito: uma escrita directa de service_role nao herda o dono.
-- Os escritores SECURITY DEFINER existentes continuam a inserir auditoria.
create function gestor_security.protect_audit() returns trigger
 language plpgsql set search_path='' as $$ begin
 if tg_op<>'INSERT' or current_user<>(select r.rolname from pg_class c
   join pg_roles r on r.oid=c.relowner where c.oid=tg_relid) then
   raise exception using errcode='42501',message='Auditoria append-only, escrita exclusiva do servidor autorizado.';
 end if;
 return new;
end $$;
create trigger audit_integrity before insert or update or delete on public.audit_logs
 for each row execute function gestor_security.protect_audit();
alter table public.audit_logs enable always trigger audit_integrity;
do $$ declare name text; begin
 foreach name in array array['roles','permissions','role_permissions','user_role_assignments','delegations','profiles','audit_logs'] loop
   execute format('create trigger security_no_truncate before truncate on public.%I for each statement execute function gestor_security.deny_truncate()',name);
   execute format('alter table public.%I enable always trigger security_no_truncate',name);
   -- Retira tambem TRIGGER/REFERENCES/TRUNCATE, nao apenas DML e RLS.
   execute format('revoke all on public.%I from public,anon,authenticated,service_role',name);
   execute format('grant select on public.%I to authenticated,service_role',name);
   if has_table_privilege('service_role',format('public.%I',name),'TRIGGER')
     or has_table_privilege('authenticated',format('public.%I',name),'TRIGGER')
     or has_table_privilege('anon',format('public.%I',name),'TRIGGER') then
     raise exception using errcode='23514',message='Privilegio TRIGGER herdado requer revisao.';
   end if;
 end loop;
end $$;

-- Retirar o ponto de entrada legado da API, preservando o corpo e as guardas.
alter function public.admin_mutation(text,jsonb) set schema gestor_security;
alter function gestor_security.admin_mutation(text,jsonb) rename to admin_mutation_legacy;
revoke all on function gestor_security.admin_mutation_legacy(text,jsonb) from public,anon,authenticated,service_role,gestor_security_operator;

create function public.admin_mutation(operation text,payload jsonb) returns void
 language plpgsql security definer set search_path='' as $$
 declare role_code text;
 begin
 if not public.is_active_user() then raise exception using errcode='42501',message='Acesso recusado'; end if;
 perform gestor_security.serialize_write();
 if operation='revoke_role' then
   select a.role_code into role_code from public.user_role_assignments a where a.id=nullif(payload->>'id','')::uuid;
 elsif operation in ('grant_role','role_permission') then role_code=payload->>'role_code';
 elsif operation='role_create' then role_code=payload->>'code';
 end if;
 if role_code='technical_admin' or (operation in ('role_create','role_permission') and role_code='access_admin')
   or (operation='role_permission' and payload->>'permission_code'='users.manage') then
   raise exception using errcode='42501',message='Administracao tecnica nao disponivel por RPC funcional.';
 end if;
 perform gestor_security.admin_mutation_legacy(operation,payload);
end $$;
revoke all on function public.admin_mutation(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.admin_mutation(text,jsonb) to authenticated;

create function gestor_security.maintain_technical_admin(
 target uuid, operation text, change_ref text, approval_ref text
) returns void language plpgsql security definer set search_path='' as $$
 declare changed integer;
 begin
 if not gestor_security.operator_session() or change_ref !~ '^[A-Za-z0-9_:/.-]{3,100}$'
   or approval_ref !~ '^[A-Za-z0-9_:/.-]{3,100}$' or change_ref is null or approval_ref is null then
   raise exception using errcode='42501',message='Operador ou referencias de autorizacao invalidos.';
 end if;
 if operation not in ('grant','revoke','activate','deactivate','suspend') or operation is null then
   raise exception using errcode='22023',message='Operacao de manutencao invalida.';
 end if;
 perform gestor_security.serialize_write();
 if not exists(select 1 from public.profiles where id=target) then raise exception using errcode='22023',message='Alvo inexistente'; end if;
 perform set_config('gestor_security.change_ref',change_ref,true);
 perform set_config('gestor_security.approval_ref',approval_ref,true);
 if operation='grant' then
   insert into public.user_role_assignments(user_id,role_code,scope_unit_id,granted_by)
   values(target,'technical_admin',null,null);
 elsif operation='revoke' then
   update public.user_role_assignments set valid_until=greatest(valid_from,now())
   where user_id=target and role_code='technical_admin' and (valid_until is null or valid_until>now());
   get diagnostics changed=row_count;
   if changed=0 then raise exception using errcode='22023',message='Nenhuma concessao tecnica a encerrar'; end if;
 else
   if not exists(select 1 from public.user_role_assignments where user_id=target and role_code='technical_admin'
     and (valid_until is null or valid_until>now())) then raise exception using errcode='22023',message='Alvo sem concessao tecnica'; end if;
   update public.profiles set status=case operation when 'activate' then 'active' when 'suspend' then 'suspended' else 'inactive' end,updated_at=now() where id=target;
 end if;
 insert into public.audit_logs(actor_id,entity_type,entity_id,action,after_data)
 values(null,'technical_admin_maintenance',target::text,upper(operation),jsonb_build_object(
   'change_ref',change_ref,'approval_ref',approval_ref,'operator_db',session_user,'role','technical_admin','scope','global'));
 perform set_config('gestor_security.change_ref','',true);
 perform set_config('gestor_security.approval_ref','',true);
end $$;

revoke all on all functions in schema gestor_security from public,anon,authenticated,service_role,gestor_security_operator;
grant execute on function gestor_security.maintain_technical_admin(uuid,text,text,text) to gestor_security_operator;
revoke create on schema public from public,anon,authenticated,service_role;
-- Incluir identidades assumiveis por SET ROLE, mesmo quando NOINHERIT.
do $$ begin
 if exists(select 1 from pg_roles api cross join pg_roles reachable
   where api.rolname in ('anon','authenticated','service_role','authenticator')
   and pg_has_role(api.oid,reachable.oid,'MEMBER')
   and (reachable.rolsuper or reachable.rolcreaterole
     or has_schema_privilege(reachable.oid,'public','CREATE')
     or has_parameter_privilege(reachable.oid,'session_replication_role','SET')
     or exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relname in ('roles','permissions','role_permissions','user_role_assignments','delegations','profiles','audit_logs')
       and has_table_privilege(reachable.oid,c.oid,'TRIGGER')))) then
   raise exception using errcode='23514',message='Privilegio herdado/assumivel de DDL ou replicacao requer revisao.';
 end if;
end $$;
-- Nao altera as politicas RLS, os helpers de leitura ou o significado das delegacoes.
notify pgrst,'reload schema';
commit;
