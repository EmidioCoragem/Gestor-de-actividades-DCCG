-- BASELINE LIMITADA A PREPARACAO DA PRIMEIRA MIGRACAO, SEM CREDENCIAIS.
-- Exportar TODAS as linhas da grelha como CSV e guardar fora do Git publico.
-- Inventario/comprovativo; nao e um pg_dump nem um restauro integral Supabase.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
WITH
public_relations AS (
 SELECT c.oid, c.relname, c.relkind, pg_get_userbyid(c.relowner) AS owner,
   c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls,
   c.relacl::text AS acl,
   EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass
     AND d.objid=c.oid AND d.deptype='e') AS extension_owned
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')
),
items AS (
 SELECT '00_contexto'::text AS item, jsonb_build_object(
   'capturado_em_utc',transaction_timestamp() AT TIME ZONE 'UTC',
   'database',current_database(),'operador',current_user,
   'postgres',current_setting('server_version'),
   'read_only',current_setting('transaction_read_only'),
   'escopo','primeira migracao Fase 1; nao e backup integral'
 ) AS detalhe
 UNION ALL
 SELECT '01_contagens', jsonb_build_object(
   'auth_users',(SELECT count(*) FROM auth.users),
   'storage_buckets',(SELECT count(*) FROM storage.buckets),
   'storage_objects',(SELECT count(*) FROM storage.objects)
 )
 UNION ALL
 SELECT '02_relacoes_public',coalesce(jsonb_agg(to_jsonb(r)-'oid' ORDER BY relname),'[]'::jsonb)
 FROM public_relations r
 UNION ALL
 SELECT '03_colunas',coalesce(jsonb_agg(jsonb_build_object(
   'schema',n.nspname,'relacao',c.relname,'coluna',a.attname,
   'tipo',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,
   'default_md5',md5(pg_get_expr(ad.adbin,ad.adrelid))
 ) ORDER BY n.nspname,c.relname,a.attnum),'[]'::jsonb)
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 LEFT JOIN pg_attrdef ad ON ad.adrelid=c.oid AND ad.adnum=a.attnum
 WHERE a.attnum>0 AND NOT a.attisdropped AND (
   (n.nspname='public' AND c.relkind IN ('r','p','v','m','f'))
   OR (n.nspname='auth' AND c.relname='users')
 )
 UNION ALL
 SELECT '04_funcoes_public',coalesce(jsonb_agg(jsonb_build_object(
   'assinatura',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),
   'acl',p.proacl::text,'security_definer',p.prosecdef,
   'definition_md5',md5(pg_get_functiondef(p.oid)),
   'extension_owned',EXISTS(SELECT 1 FROM pg_depend d
     WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
 ) ORDER BY p.oid::regprocedure::text),'[]'::jsonb)
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind IN ('f','p')
 UNION ALL
 SELECT '05_triggers',coalesce(jsonb_agg(jsonb_build_object(
   'schema',n.nspname,'relacao',c.relname,'nome',t.tgname,
   'funcao',t.tgfoid::regprocedure::text,'enabled',t.tgenabled,
   'definition_md5',md5(pg_get_triggerdef(t.oid,true))
 ) ORDER BY n.nspname,c.relname,t.tgname),'[]'::jsonb)
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE NOT t.tgisinternal AND n.nspname IN ('public','auth','storage')
 UNION ALL
 SELECT '06_default_acl',coalesce(jsonb_agg(jsonb_build_object(
   'owner',pg_get_userbyid(d.defaclrole),'schema',coalesce(n.nspname,'(global)'),
   'tipo',d.defaclobjtype,'acl',d.defaclacl::text
 ) ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype),'[]'::jsonb)
 FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
 WHERE d.defaclnamespace=0 OR n.nspname IN ('public','auth','storage')
 UNION ALL
 SELECT '07_extensoes',coalesce(jsonb_agg(jsonb_build_object(
   'nome',e.extname,'versao',e.extversion,'schema',n.nspname
 ) ORDER BY e.extname),'[]'::jsonb)
 FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace
 UNION ALL
 SELECT '08_event_triggers',coalesce(jsonb_agg(jsonb_build_object(
   'nome',e.evtname,'evento',e.evtevent,'enabled',e.evtenabled,
   'tags',e.evttags,'funcao',e.evtfoid::regprocedure::text,
   'owner',pg_get_userbyid(e.evtowner),
   'function_md5',md5(pg_get_functiondef(e.evtfoid))
 ) ORDER BY e.evtname),'[]'::jsonb) FROM pg_event_trigger e
 UNION ALL
 SELECT '09_schema_acl',coalesce(jsonb_agg(jsonb_build_object(
   'schema',n.nspname,'owner',pg_get_userbyid(n.nspowner),'acl',n.nspacl::text
 ) ORDER BY n.nspname),'[]'::jsonb)
 FROM pg_namespace n WHERE n.nspname IN ('public','auth','storage')
 UNION ALL
 SELECT '10_politicas',coalesce(jsonb_agg(jsonb_build_object(
   'schema',n.nspname,'relacao',c.relname,'nome',p.polname,
   'comando',p.polcmd,'permissive',p.polpermissive,
   'roles',(SELECT jsonb_agg(CASE WHEN role_oid=0 THEN 'PUBLIC'
                  ELSE pg_get_userbyid(role_oid) END ORDER BY role_oid)
            FROM unnest(p.polroles) role_oid),
   'using_md5',md5(pg_get_expr(p.polqual,p.polrelid)),
   'check_md5',md5(pg_get_expr(p.polwithcheck,p.polrelid))
 ) ORDER BY n.nspname,c.relname,p.polname),'[]'::jsonb)
 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('public','auth','storage')
 UNION ALL
 SELECT '11_indices',coalesce(jsonb_agg(jsonb_build_object(
   'schema',n.nspname,'relacao',c.relname,'nome',ic.relname,
   'definition_md5',md5(pg_get_indexdef(i.indexrelid))
 ) ORDER BY n.nspname,c.relname,ic.relname),'[]'::jsonb)
 FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid
 JOIN pg_class ic ON ic.oid=i.indexrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('public','auth','storage')
 UNION ALL
 SELECT '12_constraints',coalesce(jsonb_agg(jsonb_build_object(
   'schema',n.nspname,'relacao',c.relname,'nome',k.conname,
   'definition_md5',md5(pg_get_constraintdef(k.oid,true))
 ) ORDER BY n.nspname,c.relname,k.conname),'[]'::jsonb)
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('public','auth','storage')
 UNION ALL
 SELECT '13_papeis_api',coalesce(jsonb_agg(jsonb_build_object(
   'nome',r.rolname,'inherit',r.rolinherit,'bypassrls',r.rolbypassrls,
   'superuser',r.rolsuper
 ) ORDER BY r.rolname),'[]'::jsonb)
 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
 UNION ALL
 SELECT '14_membros_papeis',coalesce(jsonb_agg(jsonb_build_object(
   'papel',pg_get_userbyid(m.roleid),'membro',pg_get_userbyid(m.member),
   'admin_option',m.admin_option
 ) ORDER BY pg_get_userbyid(m.roleid),pg_get_userbyid(m.member)),'[]'::jsonb)
 FROM pg_auth_members m
)
SELECT item,detalhe FROM items ORDER BY item;
ROLLBACK;
