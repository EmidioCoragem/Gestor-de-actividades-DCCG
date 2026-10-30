begin;

create table public.profiles (
 id uuid primary key references auth.users(id),
 full_name text not null check (length(full_name) between 1 and 160),
 email text not null,
 status text not null default 'inactive' check(status in ('active','inactive','suspended')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organizational_units (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(trim(code)) between 1 and 60),
 name text not null check(length(trim(name)) between 1 and 160),
 kind text not null check(kind in ('company','direction','department','section','team','other')),
 parent_id uuid references public.organizational_units(id), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((kind='company' and parent_id is null) or (kind<>'company' and parent_id is not null))
);
create unique index one_company on public.organizational_units(kind) where kind='company';
create index units_parent on public.organizational_units(parent_id);
create table public.positions (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(code) between 1 and 60 and code=trim(code)), name text not null check(length(name) between 1 and 160),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_positions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 unit_id uuid not null references public.organizational_units(id), position_id uuid not null references public.positions(id),
 valid_from timestamptz not null default now(), valid_until timestamptz,
 check(valid_until is null or valid_until>=valid_from)
);
create unique index current_user_position on public.user_positions(user_id) where valid_until is null;
create index positions_unit on public.user_positions(unit_id,user_id);
create table public.unit_responsibilities (
 id uuid primary key default gen_random_uuid(), unit_id uuid not null references public.organizational_units(id),
 user_id uuid not null references public.profiles(id), valid_from timestamptz not null default now(), valid_until timestamptz,
 check(valid_until is null or valid_until>=valid_from)
);
create unique index current_unit_responsible on public.unit_responsibilities(unit_id) where valid_until is null;
create table public.reporting_lines (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 supervisor_id uuid not null references public.profiles(id), unit_id uuid not null references public.organizational_units(id),
 valid_from timestamptz not null default now(), valid_until timestamptz,
 check(user_id<>supervisor_id), check(valid_until is null or valid_until>=valid_from)
);
create unique index current_reporting_line on public.reporting_lines(user_id) where valid_until is null;
create table public.roles (code text primary key check(code ~ '^[a-z][a-z0-9_.-]{1,59}$'), name text not null check(length(trim(name)) between 1 and 160), technical boolean not null default false);
create table public.permissions (code text primary key, description text not null);
create table public.role_permissions (
 role_code text not null references public.roles(code), permission_code text not null references public.permissions(code), primary key(role_code,permission_code)
);
create table public.user_role_assignments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 role_code text not null references public.roles(code), scope_unit_id uuid references public.organizational_units(id),
 valid_from timestamptz not null default now(), valid_until timestamptz, granted_by uuid references public.profiles(id),
 check(valid_until is null or valid_until>=valid_from)
);
create index role_assignments_user on public.user_role_assignments(user_id,scope_unit_id);
create table public.delegations (
 id uuid primary key default gen_random_uuid(), from_user_id uuid not null references public.profiles(id),
 to_user_id uuid not null references public.profiles(id), permission_code text not null references public.permissions(code),
 scope_unit_id uuid not null references public.organizational_units(id), valid_from timestamptz not null, valid_until timestamptz not null,
 check(from_user_id<>to_user_id), check(valid_until>valid_from)
);
-- Delegações ficam preparadas e sem concessão de poderes até implementação e aprovação do fluxo.
create table public.cost_centers (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(code) between 1 and 80 and code=trim(code)),
 name text not null, description text, parent_id uuid references public.cost_centers(id), active boolean not null default true,
 responsible_id uuid references public.profiles(id), unit_id uuid references public.organizational_units(id),
 source_system text not null default 'manual', external_id text, valid_from date not null default ((now() at time zone 'Africa/Luanda')::date), valid_until date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), last_synced_at timestamptz,
 check(valid_until is null or valid_until>=valid_from)
);
create unique index cost_external_identity on public.cost_centers(source_system,external_id) where external_id is not null;
create index cost_parent on public.cost_centers(parent_id);
create table public.integration_sources (code text primary key, description text not null, authoritative_for text[] not null default '{}');
create table public.external_identity_mappings (
 id uuid primary key default gen_random_uuid(), source_code text not null references public.integration_sources(code),
 entity_type text not null check(entity_type in ('cost_center','organizational_unit','worker')),
 cost_center_id uuid references public.cost_centers(id), organizational_unit_id uuid references public.organizational_units(id), worker_id uuid references public.profiles(id),
 internal_id uuid generated always as (coalesce(cost_center_id,organizational_unit_id,worker_id)) stored,
 check(num_nonnulls(cost_center_id,organizational_unit_id,worker_id)=1),
 check((entity_type='cost_center' and cost_center_id is not null) or (entity_type='organizational_unit' and organizational_unit_id is not null) or (entity_type='worker' and worker_id is not null)),
 external_id text not null, last_synced_at timestamptz, unique(source_code,entity_type,external_id), unique(source_code,entity_type,internal_id)
);
create table public.import_batches (
 id uuid primary key default gen_random_uuid(), source_code text references public.integration_sources(code),
 created_by uuid not null references public.profiles(id), status text not null check(status in ('staged','validated','applied','rejected','reverted')),
 created_at timestamptz not null default now(), report jsonb not null default '{}'
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid, entity_type text not null, entity_id text not null,
 action text not null, unit_id uuid, before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index audit_created on public.audit_logs(created_at desc);

insert into public.permissions(code,description) values
 ('org.read','Consultar estrutura autorizada'),('org.manage','Gerir estrutura autorizada'),
 ('users.read','Consultar utilizadores autorizados'),('users.manage','Gerir contas autorizadas'),
 ('access.manage','Gerir atribuições e permissões de terceiros'),('audit.read','Consultar auditoria autorizada'),
 ('activities.read','Consultar actividades autorizadas'),('activities.create','Criar actividades'),
 ('activities.assign','Atribuir actividades'),('activities.cross_assign','Atribuir entre departamentos'),
 ('activities.validate','Validar execução de terceiros'),('closing.read','Consultar fecho'),
 ('kpis.read','Consultar indicadores'),('cost_centers.read','Consultar centros de custo'),
 ('planning.read','Consultar planeamento'),('reports.read','Consultar relatórios'),('notifications.read','Consultar notificações');
insert into public.roles(code,name,technical) values
 ('technician','Técnico',false),('manager','Gestor',false),('director','Director',false),
 ('executive','Director Executivo',false),('technical_admin','Administrador técnico',true),('access_admin','Responsável de acessos',true);
insert into public.role_permissions values
 ('technician','activities.read'),('technician','notifications.read'),('technician','org.read'),
 ('manager','users.read'),('director','users.read'),('executive','users.read'),('manager','org.read'),('manager','activities.read'),('manager','activities.create'),('manager','activities.assign'),('manager','activities.validate'),('manager','planning.read'),('manager','notifications.read'),
 ('director','org.read'),('director','activities.read'),('director','activities.create'),('director','activities.assign'),('director','activities.validate'),('director','closing.read'),('director','reports.read'),('director','kpis.read'),
 ('executive','org.read'),('executive','activities.read'),('executive','activities.create'),('executive','activities.assign'),('executive','activities.validate'),('executive','closing.read'),('executive','reports.read'),('executive','kpis.read'),
 ('technical_admin','users.read'),('technical_admin','users.manage'),
 ('access_admin','access.manage'),('access_admin','users.read'),('access_admin','org.read'),('access_admin','audit.read');

create function public.is_active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and status='active');
$$;
create function public.in_unit_scope(target uuid, scope uuid) returns boolean language sql stable security definer set search_path='' as $$
 with recursive descendants as (
 select id from public.organizational_units where id=scope and active
 union select u.id from public.organizational_units u join descendants d on u.parent_id=d.id where u.active
 ) select target is not null and exists(select 1 from descendants where id=target);
$$;
create function public.has_permission(required text, target uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_active_user() and exists (
 select 1 from public.user_role_assignments a join public.role_permissions rp on rp.role_code=a.role_code
 where a.user_id=auth.uid() and rp.permission_code=required and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now())
 and (a.scope_unit_id is null or public.in_unit_scope(target,a.scope_unit_id)));
$$;
create function public.visible_person(target uuid, required text) returns boolean language sql stable security definer set search_path='' as $$
 select public.has_permission(required,null) or exists(select 1 from public.user_positions p
 where p.user_id=target and p.valid_from<=now() and (p.valid_until is null or p.valid_until>now()) and public.has_permission(required,p.unit_id));
$$;
create function public.my_permissions() returns text[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(distinct rp.permission_code),'{}') from public.user_role_assignments a join public.role_permissions rp on rp.role_code=a.role_code
 where public.is_active_user() and a.user_id=auth.uid() and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now())
 and (a.scope_unit_id is null or exists(select 1 from public.organizational_units u where u.id=a.scope_unit_id and u.active));
$$;
create function public.may_validate_activity(executors uuid[], target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.has_permission('activities.validate',target) and not (auth.uid()=any(executors)) and cardinality(executors)>0;
$$;

create function public.handle_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 insert into public.profiles(id,email,full_name) values(new.id,coalesce(new.email,''),left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),new.email,'Utilizador'),160));
 return new;
 end;
$$;
create trigger auth_user_profile after insert on auth.users for each row execute function public.handle_auth_user();
-- Contas existentes também começam sem acesso: nunca activar nem conceder perfis automaticamente.
insert into public.profiles(id,email,full_name)
 select id,coalesce(email,''),left(coalesce(nullif(trim(raw_user_meta_data->>'full_name'),''),email,'Utilizador'),160) from auth.users
 on conflict(id) do nothing;


create function public.protect_unit_tree() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 perform pg_advisory_xact_lock(109031);
 if new.parent_id is not null and (new.parent_id=new.id or exists(
 with recursive parents as (select id,parent_id from public.organizational_units where id=new.parent_id
 union select u.id,u.parent_id from public.organizational_units u join parents p on u.id=p.parent_id)
 select 1 from parents where id=new.id)) then raise exception 'Hierarquia circular não permitida'; end if;
 new.updated_at=now(); return new;
 end;
$$;
create trigger unit_tree before insert or update on public.organizational_units for each row execute function public.protect_unit_tree();
create function public.protect_cost_tree() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 perform pg_advisory_xact_lock(109032);
 if new.parent_id is not null and (new.parent_id=new.id or exists(
 with recursive parents as(select id,parent_id from public.cost_centers where id=new.parent_id
 union select c.id,c.parent_id from public.cost_centers c join parents p on c.id=p.parent_id)
 select 1 from parents where id=new.id)) then raise exception 'Centro de custo circular não permitido'; end if;
 new.updated_at=now(); return new;
 end;
$$;
create trigger cost_tree before insert or update on public.cost_centers for each row execute function public.protect_cost_tree();
create function public.record_audit() returns trigger language plpgsql security definer set search_path='' as $$
 declare previous jsonb; current_data jsonb; scope_id uuid;
 begin
 if tg_op<>'INSERT' then previous=to_jsonb(old); end if;
 if tg_op<>'DELETE' then current_data=to_jsonb(new); end if;
 scope_id=nullif(coalesce(current_data->>'unit_id',current_data->>'scope_unit_id',previous->>'unit_id',previous->>'scope_unit_id'),'')::uuid;
 if tg_table_name='organizational_units' then scope_id=coalesce(new.id,old.id); end if;
 insert into public.audit_logs(actor_id,entity_type,entity_id,action,unit_id,before_data,after_data)
 values(auth.uid(),tg_table_name,coalesce(current_data->>'id',current_data->>'code',current_data->>'role_code',previous->>'id',previous->>'code',previous->>'role_code'),tg_op,scope_id,previous,current_data);
 return coalesce(new,old);
 end;
$$;
do $$ declare t text; begin
 foreach t in array array['profiles','organizational_units','positions','user_positions','unit_responsibilities','reporting_lines','roles','role_permissions','user_role_assignments','delegations','cost_centers','integration_sources','external_identity_mappings','import_batches'] loop
 execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.record_audit()',t);
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
alter table public.permissions enable row level security;
alter table public.audit_logs enable row level security;
revoke all on public.permissions,public.audit_logs from anon,authenticated;
grant select on public.permissions,public.audit_logs to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.visible_person(id,'users.read'));
create policy unit_read on public.organizational_units for select to authenticated using(public.has_permission('org.read',id) or public.has_permission('org.manage',id) or (public.is_active_user() and exists(select 1 from public.user_positions p where p.user_id=auth.uid() and p.unit_id=organizational_units.id and p.valid_until is null)));
create policy position_read on public.positions for select to authenticated using(public.is_active_user());
create policy membership_read on public.user_positions for select to authenticated using((user_id=auth.uid() and public.is_active_user()) or public.has_permission('org.read',unit_id) or public.has_permission('users.read',unit_id));
create policy responsible_read on public.unit_responsibilities for select to authenticated using(public.has_permission('org.read',unit_id));
create policy reporting_read on public.reporting_lines for select to authenticated using((user_id=auth.uid() and public.is_active_user()) or public.has_permission('org.read',unit_id));
create policy role_catalog_read on public.roles for select to authenticated using(public.is_active_user());
create policy permission_catalog_read on public.permissions for select to authenticated using(public.is_active_user());
create policy role_permission_read on public.role_permissions for select to authenticated using(public.is_active_user());
create policy grants_read on public.user_role_assignments for select to authenticated using((user_id=auth.uid() and public.is_active_user()) or public.has_permission('access.manage',scope_unit_id));
create policy delegation_read on public.delegations for select to authenticated using(public.is_active_user() and (from_user_id=auth.uid() or to_user_id=auth.uid() or public.has_permission('access.manage',scope_unit_id)));
create policy cost_read on public.cost_centers for select to authenticated using(public.has_permission('cost_centers.read',unit_id));
create policy audit_read on public.audit_logs for select to authenticated using(public.has_permission('audit.read',unit_id));
-- Integrações e lotes: deny-by-default, sem fluxo funcional de importação nesta fase.

create function public.admin_mutation(operation text, payload jsonb) returns void language plpgsql security definer set search_path='' as $$
 declare target_unit uuid; target_user uuid; requested_role text; target_id uuid; parent_unit uuid;
 begin
 if not public.is_active_user() then raise exception 'Acesso recusado'; end if;
 perform pg_advisory_xact_lock(109030);
 target_unit=nullif(payload->>'unit_id','')::uuid;
 target_user=nullif(payload->>'user_id','')::uuid;
 target_id=nullif(payload->>'id','')::uuid;
 case operation
 when 'unit_create' then
 parent_unit=nullif(payload->>'parent_id','')::uuid;
 if not public.has_permission('org.manage',parent_unit) then raise exception 'Acesso recusado'; end if;
 insert into public.organizational_units(code,name,kind,parent_id) values(payload->>'code',payload->>'name',payload->>'kind',parent_unit);
 when 'unit_update' then
 if not exists(select 1 from public.organizational_units where id=target_id) or not public.has_permission('org.manage',target_id) then raise exception 'Acesso recusado'; end if;
 parent_unit=nullif(payload->>'parent_id','')::uuid;
 if not public.has_permission('org.manage',parent_unit) then raise exception 'Acesso recusado'; end if;
 if exists(select 1 from public.organizational_units where id=target_id and parent_id is distinct from parent_unit) then
   if not public.has_permission('org.manage',null) or not public.has_permission('access.manage',null) or exists(
     select 1 from public.user_role_assignments where user_id=auth.uid() and scope_unit_id is not null and valid_from<=now() and (valid_until is null or valid_until>now())
   ) then raise exception 'Reorganização exige responsável global sem concessões próprias limitadas à árvore'; end if;
 end if;
 update public.organizational_units set name=payload->>'name',parent_id=parent_unit,active=(payload->>'active')::boolean where id=target_id;
 when 'position_create' then
 if not public.has_permission('org.manage',null) then raise exception 'Acesso recusado'; end if;
 insert into public.positions(code,name) values(payload->>'code',payload->>'name');
 when 'assign_position' then
 if not public.has_permission('users.manage',target_unit) or target_user=auth.uid() then raise exception 'Acesso recusado'; end if;
 if exists(select 1 from public.user_positions where user_id=target_user and valid_until is null and not public.has_permission('users.manage',unit_id)) then raise exception 'Âmbito anterior não autorizado'; end if;
 update public.user_positions set valid_until=now() where user_id=target_user and valid_until is null;
 insert into public.user_positions(user_id,unit_id,position_id) values(target_user,target_unit,(payload->>'position_id')::uuid);
 when 'set_responsible' then
 if not public.has_permission('org.manage',target_unit) then raise exception 'Acesso recusado'; end if;
 if not exists(select 1 from public.user_positions where user_id=target_user and unit_id=target_unit and valid_until is null) then raise exception 'Responsável deve pertencer à unidade'; end if;
 update public.unit_responsibilities set valid_until=now() where unit_id=target_unit and valid_until is null;
 insert into public.unit_responsibilities(unit_id,user_id) values(target_unit,target_user);
 when 'set_supervisor' then
 if not public.has_permission('org.manage',target_unit) or not exists(select 1 from public.user_positions where user_id=target_user and unit_id=target_unit and valid_until is null) then raise exception 'Acesso recusado'; end if;
 if not public.visible_person((payload->>'supervisor_id')::uuid,'org.read') then raise exception 'Chefia fora do âmbito'; end if;
 if exists(with recursive chain as(select supervisor_id from public.reporting_lines where user_id=(payload->>'supervisor_id')::uuid and valid_until is null
 union select r.supervisor_id from public.reporting_lines r join chain c on r.user_id=c.supervisor_id where r.valid_until is null)
 select 1 from chain where supervisor_id=target_user) then raise exception 'Chefia circular não permitida'; end if;
 update public.reporting_lines set valid_until=now() where user_id=target_user and valid_until is null;
 insert into public.reporting_lines(user_id,supervisor_id,unit_id) values(target_user,(payload->>'supervisor_id')::uuid,target_unit);
 when 'user_status' then
 if target_user is null or not exists(select 1 from public.profiles where id=target_user) or target_user=auth.uid() or not public.visible_person(target_user,'users.manage') then raise exception 'Acesso recusado'; end if;
 update public.profiles set status=payload->>'status',updated_at=now() where id=target_user;
 when 'grant_role' then
 if target_user=auth.uid() or not public.has_permission('access.manage',target_unit) then raise exception 'Acesso recusado'; end if;
 requested_role=payload->>'role_code';
 if exists(select 1 from public.user_role_assignments where user_id=target_user and role_code=requested_role and scope_unit_id is not distinct from target_unit and valid_from<=now() and (valid_until is null or valid_until>now())) then raise exception 'Já existe uma concessão activa deste perfil no âmbito'; end if;
 insert into public.user_role_assignments(user_id,role_code,scope_unit_id,valid_until,granted_by) values(target_user,requested_role,target_unit,nullif(payload->>'valid_until','')::timestamptz,auth.uid());
 when 'revoke_role' then
 select user_id,scope_unit_id into target_user,target_unit from public.user_role_assignments where id=target_id;
 if target_user is null or target_user=auth.uid() or not public.has_permission('access.manage',target_unit) then raise exception 'Acesso recusado'; end if;
 update public.user_role_assignments set valid_until=now() where id=target_id and (valid_until is null or valid_until>now()) and valid_from<=now();
 when 'role_create' then
 if not public.has_permission('access.manage',null) then raise exception 'Acesso recusado'; end if;
 insert into public.roles(code,name) values(payload->>'code',payload->>'name');
 when 'role_permission' then
 requested_role=payload->>'role_code';
 if not public.has_permission('access.manage',null) or exists(select 1 from public.user_role_assignments where user_id=auth.uid() and role_code=requested_role and valid_from<=now() and (valid_until is null or valid_until>now())) then raise exception 'Não pode modificar o próprio perfil'; end if;
 if (payload->>'enabled')::boolean then insert into public.role_permissions values(requested_role,payload->>'permission_code') on conflict do nothing;
 else delete from public.role_permissions where role_code=requested_role and permission_code=payload->>'permission_code'; end if;
 else raise exception 'Operação não suportada';
 end case;
 end;
$$;
create function public.audit_invitation(email text, stage text, invited_user uuid default null) returns void language plpgsql security definer set search_path='' as $$
 begin
 if not public.has_permission('users.manage',null) or stage not in ('requested','sent','failed') or length(email) not between 3 and 254 then raise exception 'Convite não autorizado'; end if;
 insert into public.audit_logs(actor_id,entity_type,entity_id,action,after_data) values(auth.uid(),'auth_invitation',coalesce(invited_user::text,email),upper(stage),jsonb_build_object('email',email,'user_id',invited_user));
 end;
$$;
-- Funções definer não são executáveis por PUBLIC/anon. Escritas só por RPC transaccional.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in
 ('is_active_user','in_unit_scope','has_permission','visible_person','my_permissions','may_validate_activity','handle_auth_user','protect_unit_tree','protect_cost_tree','record_audit','admin_mutation','audit_invitation') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
grant execute on function public.is_active_user(),public.has_permission(text,uuid),public.visible_person(uuid,text),public.my_permissions(),public.may_validate_activity(uuid[],uuid),public.admin_mutation(text,jsonb),public.audit_invitation(text,text,uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
