-- F2-F01: rascunhos definitivos. Preparacao local autorizada; SQL remoto NAO autorizado.
-- Dependencias: 202610300001_fase1.sql e 202611050001_at_af_segregation.sql.
-- Aplicacao unica em transaccao, depois de recuperacao/homologacao e autorizacao proprias.
-- Nao cria contas, concessoes funcionais, bootstrap, executores, prazos ou transicoes.
begin;
set local lock_timeout='5s';

-- Nao instalar sobre a fundacao sem a segregacao efectiva dos escritores/auditoria.
do $$
declare expected record;
begin
 if to_regnamespace('gestor_security') is null
   or to_regrole('gestor_security_operator') is null
   or to_regclass('gestor_security.write_epoch') is null then
   raise exception using errcode='23514',message='F2-F01 exige a migracao incremental AT/AF previamente instalada e verificada.';
 end if;
 for expected in select * from (values
   ('public.admin_mutation(text,jsonb)',true,'009e3bf1a02ace3f7743071137a87a918662890995c062b0a457ea299e126998'),
   ('public.in_unit_scope(uuid,uuid)',true,'82430433e56ad04c33869942fc5251cbfa6842696eca33ca7fbc8fd43bd82632'),
   ('gestor_security.serialize_write()',true,'575fea2e671d1e6c95f069e310fe558771627f88a28230f319f2a085cd3c20fb'),
   ('gestor_security.enforce_segregation()',true,'d415ae7a1c42b76533de0897df53ba79d626d297b66233c3ed284eb33aa84e9e'),
   ('gestor_security.protect_audit()',false,'333c5d229f51e933cb973f8ca87b69dc7798ddea97dca2338aa2fa351ea1f56b'),
   ('gestor_security.deny_truncate()',false,'04629512a6d2dfe09dd67d42bd201ceb27f4bd411d5df8ecfc58f9c6dcad5e12')
 ) as refs(signature,definer,digest) loop
   if not exists(select 1 from pg_catalog.pg_proc p
     where p.oid=pg_catalog.to_regprocedure(expected.signature)
     and p.proowner=current_user::regrole and p.prosecdef=expected.definer
     and p.proconfig=array['search_path=""']::text[]
     and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
       pg_catalog.replace(p.prosrc,E'\r\n',E'\n'),'UTF8')),'hex')=expected.digest) then
     raise exception using errcode='23514',message='Dependencia AT/AF/ownership divergente; nao instalar F2-F01.';
   end if;
 end loop;
end $$;

lock table public.roles,public.role_permissions,public.user_role_assignments,
 public.profiles,public.organizational_units,public.audit_logs in share row exclusive mode;

do $$
declare target text; guard record;
begin
 if exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname in
   ('roles','role_permissions','user_role_assignments','profiles','organizational_units','audit_logs')
   and (c.relkind<>'r' or c.relowner<>current_user::regrole)) then
   raise exception using errcode='23514',message='Ownership/tabelas da fundacao divergentes; nao instalar.';
 end if;
 if (select count(*) from public.roles where code in ('manager','director','executive') and not technical)<>3 then
   raise exception using errcode='23514',message='Perfis gerenciais canonicos ausentes ou classificados como tecnicos.';
 end if;
 foreach target in array array['roles','permissions','role_permissions','user_role_assignments','delegations','profiles','audit_logs'] loop
   for guard in select * from (values
     ('security_no_truncate','gestor_security.deny_truncate()',34),
     (case when target='audit_logs' then 'audit_integrity' else 'segregation_guard' end,
      case when target='audit_logs' then 'gestor_security.protect_audit()' else 'gestor_security.enforce_segregation()' end,31)
   ) as refs(name,signature,flags) loop
     if not exists(select 1 from pg_catalog.pg_trigger t
       where t.tgrelid=pg_catalog.to_regclass('public.'||target) and t.tgname=guard.name
       and t.tgfoid=pg_catalog.to_regprocedure(guard.signature) and t.tgtype=guard.flags
       and t.tgenabled='A' and not t.tgisinternal and t.tgnargs=0 and t.tgqual is null) then
       raise exception using errcode='23514',message='Guardas AT/AF ausentes ou alteradas; rever instalacao antes de F2-F01.';
     end if;
   end loop;
 end loop;
 if exists(select 1 from pg_catalog.pg_roles api cross join pg_catalog.pg_roles reachable
   where api.rolname in ('anon','authenticated','service_role','authenticator')
   and pg_catalog.pg_has_role(api.oid,reachable.oid,'MEMBER')
   and (reachable.rolsuper or reachable.rolcreaterole or reachable.oid=current_user::regrole
     or pg_catalog.has_schema_privilege(reachable.oid,'public','CREATE')
     or pg_catalog.has_parameter_privilege(reachable.oid,'session_replication_role','SET'))) then
   raise exception using errcode='23514',message='Identidade API com poderes assumiveis incompatíveis.';
 end if;
end $$;

create schema activity_private;
revoke all on schema activity_private from public,anon,authenticated,service_role,authenticator,gestor_security_operator;

-- Registo de elegibilidade, independente de nomes de cargos e sem manutencao pela API.
-- Novos perfis elegiveis requerem manutencao revista e aprovada; nunca seed de pessoas.
create table activity_private.activity_manager_roles (
 role_code text primary key references public.roles(code)
);
insert into activity_private.activity_manager_roles(role_code) values('manager'),('director'),('executive');

-- Mesma lista de whitespace de String.prototype.trim em ECMAScript.
-- char_length conta pontos Unicode, nao unidades UTF-16 nem grafemas visuais.
create function activity_private.normalise_draft_title(value text) returns text
 language sql immutable set search_path='' as $$
 select pg_catalog.btrim(value,U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
$$;

create table public.activities (
 id uuid primary key default pg_catalog.gen_random_uuid(),
 code text not null unique check(code ~ '^ACT-[0-9A-F]{32}$'),
 title text not null check(pg_catalog.char_length(title) between 1 and 200
   and title=activity_private.normalise_draft_title(title)),
 description text not null default '' check(pg_catalog.char_length(description)<=10000),
 responsible_unit_id uuid not null references public.organizational_units(id),
 created_by uuid not null references public.profiles(id),
 status text not null default 'draft' check(status in
   ('draft','assigned','in_progress','awaiting_validation','completed','suspended','cancelled')),
 constraint activity_drafts_only check(status='draft'),
 version bigint not null default 1 check(version=1),
 created_at timestamptz not null default pg_catalog.now(),
 updated_at timestamptz not null default pg_catalog.now(),
 check(code='ACT-'||pg_catalog.upper(pg_catalog.replace(id::text,'-','')))
);
create index activity_drafts_unit_created on public.activities(responsible_unit_id,created_at desc,id desc);
create index activity_drafts_created_by on public.activities(created_by);

create table public.activity_events (
 id uuid primary key default pg_catalog.gen_random_uuid(),
 activity_id uuid not null references public.activities(id),
 event_kind text not null check(event_kind='draft_created'),
 actor_id uuid not null references public.profiles(id),
 version bigint not null check(version=1),
 created_at timestamptz not null default pg_catalog.now(),
 unique(activity_id,event_kind)
);
create index activity_events_actor on public.activity_events(actor_id);

-- So metadados idempotentes; nao duplica titulo, descricao nem credenciais.
create table activity_private.activity_draft_requests (
 actor_id uuid not null references public.profiles(id),
 request_id uuid not null,
 payload_sha256 bytea not null check(pg_catalog.octet_length(payload_sha256)=32),
 activity_id uuid not null unique references public.activities(id),
 primary key(actor_id,request_id)
);

-- Snapshot temporal fresco, inclusive depois de esperar por revogacao/suspensao.
-- Nao usar now() da transaccao que pode anteceder a espera. Nao altera a Fase 1.
create function activity_private.can_access_drafts(target_unit uuid,requested_permission text) returns boolean
 language sql stable security definer set search_path='' as $$
 with context as materialized (
   select auth.uid() as actor,pg_catalog.clock_timestamp() as at
 )
 select requested_permission in ('activities.read','activities.create')
 and exists(select 1 from context x join public.profiles p on p.id=x.actor
   where p.status='active')
 and exists(select 1 from public.organizational_units u where u.id=target_unit and u.active)
 and not exists(select 1 from context x join public.user_role_assignments a on a.user_id=x.actor
   where a.role_code='technical_admin' and a.valid_from<=x.at and (a.valid_until is null or a.valid_until>x.at))
 and exists(select 1 from context x join public.user_role_assignments a on a.user_id=x.actor
   join activity_private.activity_manager_roles m on m.role_code=a.role_code
   join public.roles r on r.code=a.role_code and not r.technical
   where a.valid_from<=x.at and (a.valid_until is null or a.valid_until>x.at)
   and (a.scope_unit_id is null or public.in_unit_scope(target_unit,a.scope_unit_id)))
 and exists(select 1 from context x join public.user_role_assignments a on a.user_id=x.actor
   join public.role_permissions rp on rp.role_code=a.role_code and rp.permission_code=requested_permission
   where a.valid_from<=x.at and (a.valid_until is null or a.valid_until>x.at)
   and (a.scope_unit_id is null or public.in_unit_scope(target_unit,a.scope_unit_id)));
$$;

-- Wrappers de identidade corrente; nenhum actor, role ou unidade e inferido do browser.
create function public.can_read_activity_draft(unit_id uuid) returns boolean
 language sql stable security definer set search_path='' as $$
 select activity_private.can_access_drafts(unit_id,'activities.read');
$$;

create function public.list_activity_draft_units() returns table(id uuid,code text,name text)
 language sql stable security definer set search_path='' as $$
 select u.id,u.code,u.name from public.organizational_units u
 where activity_private.can_access_drafts(u.id,'activities.read')
   and activity_private.can_access_drafts(u.id,'activities.create')
 order by u.name,u.id;
$$;

alter table public.activities enable row level security;
alter table public.activity_events enable row level security;
create policy activity_drafts_read on public.activities for select to authenticated
 using(public.can_read_activity_draft(responsible_unit_id));
create policy activity_draft_events_read on public.activity_events for select to authenticated
 using(exists(select 1 from public.activities a where a.id=activity_id
   and public.can_read_activity_draft(a.responsible_unit_id)));

create function public.create_activity_draft(unit_id uuid,title text,description text,request_id uuid) returns jsonb
 language plpgsql security definer set search_path='' as $$
 declare
   actor uuid;
   clean_title text;
   clean_description text;
   payload_hash bytea;
   previous_hash bytea;
   previous_id uuid;
   draft public.activities%rowtype;
 begin
   -- Um snapshot REPEATABLE READ/SERIALIZABLE antigo nao e revalidacao actual.
   if pg_catalog.current_setting('transaction_isolation')<>'read committed' then
     raise exception using errcode='0A000',message='Criacao de rascunho exige READ COMMITTED.';
   end if;
   actor=auth.uid();
   if actor is null then
     raise exception using errcode='42501',message='Operacao nao autorizada.';
   end if;
   clean_title=activity_private.normalise_draft_title(title);
   clean_description=coalesce(description,'');
   if unit_id is null or request_id is null or clean_title is null
     or pg_catalog.char_length(clean_title) not between 1 and 200
     or pg_catalog.char_length(clean_description)>10000 then
     raise exception using errcode='22023',message='Campos do rascunho invalidos.';
   end if;

   -- F01 curto: seis autoridades em SHARE, compativel com outros criadores.
   -- Bloqueia writes concorrentes de perfis/papeis/ambitos/registry ate ao COMMIT.
   -- Contencao/deadlocks/timeouts falham fechado; nunca repetir cegamente.
   perform pg_catalog.set_config('lock_timeout','5s',true);
   lock table activity_private.activity_manager_roles,public.roles,public.role_permissions,
     public.user_role_assignments,public.profiles,public.organizational_units in share mode;
   if not coalesce(activity_private.can_access_drafts(unit_id,'activities.create'),false)
     or not coalesce(activity_private.can_access_drafts(unit_id,'activities.read'),false) then
     raise exception using errcode='42501',message='Operacao nao autorizada para este ambito.';
   end if;

   payload_hash=pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
     'unit_id',unit_id,'title',clean_title,'description',clean_description)::text,'UTF8'));
   -- Chave isolada por actor; colisoes do advisory apenas serializam, nunca deduplicam dados.
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':'||request_id::text,0));
   -- A vigencia pode expirar enquanto este pedido espera pelo pedido identico.
   if not coalesce(activity_private.can_access_drafts(unit_id,'activities.create'),false)
     or not coalesce(activity_private.can_access_drafts(unit_id,'activities.read'),false) then
     raise exception using errcode='42501',message='Operacao nao autorizada para este ambito.';
   end if;
   select r.payload_sha256,r.activity_id into previous_hash,previous_id
     from activity_private.activity_draft_requests r where r.actor_id=actor and r.request_id=create_activity_draft.request_id;
   if found then
     if previous_hash<>payload_hash then
       raise exception using errcode='23505',message='Chave de pedido ja utilizada com outro conteudo.';
     end if;
     select a.* into draft from public.activities a where a.id=previous_id;
     if not found or draft.created_by<>actor or draft.responsible_unit_id<>unit_id
       or draft.status<>'draft' or draft.version<>1 then
       raise exception using errcode='23514',message='Registo idempotente divergente; requer revisao.';
     end if;
     return pg_catalog.jsonb_build_object('id',draft.id,'code',draft.code,'status',draft.status,'version',draft.version,'replayed',true);
   end if;

   draft.id=pg_catalog.gen_random_uuid();
   insert into public.activities(id,code,title,description,responsible_unit_id,created_by)
     values(draft.id,'ACT-'||pg_catalog.upper(pg_catalog.replace(draft.id::text,'-','')),clean_title,clean_description,unit_id,actor)
     returning * into draft;
   insert into activity_private.activity_draft_requests(actor_id,request_id,payload_sha256,activity_id)
     values(actor,request_id,payload_hash,draft.id);
   insert into public.activity_events(activity_id,event_kind,actor_id,version)
     values(draft.id,'draft_created',actor,draft.version);
   -- Sem copiar titulo/descricao para outro repositorio de texto potencialmente sensivel.
   insert into public.audit_logs(actor_id,entity_type,entity_id,action,unit_id,after_data)
     values(actor,'activity',draft.id::text,'DRAFT_CREATED',unit_id,
       pg_catalog.jsonb_build_object('code',draft.code,'status',draft.status,'version',draft.version));
   return pg_catalog.jsonb_build_object('id',draft.id,'code',draft.code,'status',draft.status,'version',draft.version,'replayed',false);
 end;
$$;

-- Nao herdar os default grants genericos do fornecedor para novos objectos.
revoke all on public.activities,public.activity_events from public,anon,authenticated,service_role,authenticator,gestor_security_operator;
grant select on public.activities,public.activity_events to authenticated;
revoke all on all tables in schema activity_private from public,anon,authenticated,service_role,authenticator,gestor_security_operator;
revoke all on all functions in schema activity_private from public,anon,authenticated,service_role,authenticator,gestor_security_operator;
revoke all on function public.can_read_activity_draft(uuid),public.list_activity_draft_units(),
 public.create_activity_draft(uuid,text,text,uuid) from public,anon,authenticated,service_role,authenticator,gestor_security_operator;
grant execute on function public.can_read_activity_draft(uuid),public.list_activity_draft_units(),
 public.create_activity_draft(uuid,text,text,uuid) to authenticated;

-- ACL efectiva/assumivel: SELECT apenas authenticated; nada de DML/DDL por API.
do $$
declare reachable record; relation_oid oid; permission text; fn oid;
begin
 for reachable in select distinct r.oid,r.rolname from pg_catalog.pg_roles api cross join pg_catalog.pg_roles r
   where api.rolname in ('anon','authenticated','service_role','authenticator')
   and (api.oid=r.oid or pg_catalog.pg_has_role(api.oid,r.oid,'SET')) loop
   if pg_catalog.has_schema_privilege(reachable.oid,'activity_private','USAGE')
     or pg_catalog.has_schema_privilege(reachable.oid,'activity_private','CREATE') then
     raise exception using errcode='23514',message='Privilegios privados herdados/assumiveis requerem revisao.';
   end if;
   foreach relation_oid in array array['public.activities'::regclass::oid,'public.activity_events'::regclass::oid] loop
     foreach permission in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] loop
       if pg_catalog.has_table_privilege(reachable.oid,relation_oid,permission)
         is distinct from (permission='SELECT' and reachable.rolname='authenticated') then
         raise exception using errcode='23514',message='ACL de actividades/eventos divergente.';
       end if;
     end loop;
   end loop;
   foreach fn in array array['public.can_read_activity_draft(uuid)'::regprocedure::oid,
     'public.list_activity_draft_units()'::regprocedure::oid,'public.create_activity_draft(uuid,text,text,uuid)'::regprocedure::oid] loop
     if pg_catalog.has_function_privilege(reachable.oid,fn,'EXECUTE') is distinct from (reachable.rolname='authenticated') then
       raise exception using errcode='23514',message='EXECUTE herdado/assumivel de RPC requer revisao.';
     end if;
   end loop;
 end loop;
end $$;

notify pgrst,'reload schema';
commit;
