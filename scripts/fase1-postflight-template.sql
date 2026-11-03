-- GERADO por node scripts/generate-fase1-postflight.mjs; nao editar a referencia.
-- Migração original SHA-256: 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58
-- APENAS LEITURA. Nao reaplica a migracao nem chama RPCs da aplicacao.
-- Exportar a UNICA grelha completa para CSV, incluindo OK/REVER/BLOQUEIO/INFO.
-- Comparacoes de definicao podem exigir revisao de normalizacao entre versoes PG.
-- NOT NULL e verificado em pg_attribute.attnotnull (comum a PG17/18),
-- nao por entradas contype=n de pg_constraint introduzidas em tabelas no PG18.
-- Corpos de funcoes: normaliza somente CRLF para LF, sem retirar outro texto.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
WITH expected(kind,object,detail) AS (
 VALUES
-- EXPECTED_VALUES
), observed_catalog AS (
-- CURRENT_CATALOG
), allowed_rpc(signature) AS (
 VALUES ('public.is_active_user()'),('public.has_permission(text, uuid)'),
 ('public.visible_person(uuid, text)'),('public.my_permissions()'),
 ('public.may_validate_activity(uuid[], uuid)'),
 ('public.admin_mutation(text, jsonb)'),('public.audit_invitation(text, text, uuid)')
), table_targets AS (
 SELECT split_part(object,'.',2) AS name FROM expected WHERE kind='table'
), tables AS (
 SELECT c.* FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN (SELECT name FROM table_targets)
), functions AS (
 SELECT p.*, n.nspname||'.'||p.proname||'('||oidvectortypes(p.proargtypes)||')' AS signature
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind IN ('f','p')
), table_rights AS (
 SELECT c.relname,r.rolname,
 has_table_privilege(r.oid,c.oid,'SELECT') AS can_select,
 has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,
 has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update,
 has_table_privilege(r.oid,c.oid,'DELETE') AS can_delete,
 has_table_privilege(r.oid,c.oid,'TRUNCATE') AS can_truncate,
 has_table_privilege(r.oid,c.oid,'REFERENCES') AS can_reference,
 has_table_privilege(r.oid,c.oid,'TRIGGER') AS can_trigger,
 has_table_privilege(r.oid,c.oid,'MAINTAIN') AS can_maintain
 FROM tables c CROSS JOIN pg_roles r WHERE r.rolname IN ('anon','authenticated')
), reports AS (
 SELECT '00_resumo'::text AS categoria,'INFO'::text AS estado,'Fase 1'::text AS objecto,
 jsonb_build_object(
 'operador',current_user,'instante_utc',transaction_timestamp() AT TIME ZONE 'UTC',
 'read_only',current_setting('transaction_read_only'),
 'postgres',current_setting('server_version'),
 'tabelas',(SELECT count(*) FROM tables WHERE relkind IN ('r','p')),
 'tabelas_rls',(SELECT count(*) FROM tables WHERE relrowsecurity),
 'politicas',(SELECT count(*) FROM pg_policy p JOIN tables c ON c.oid=p.polrelid),
 'funcoes_public',(SELECT count(*) FROM functions),
 'triggers_referencia',(SELECT count(*) FROM expected WHERE kind='trigger'),
 'observacao','Totais nao substituem os checks de definicoes/privilegios; RLS nao testa aqui contas reais.'
 ) AS detalhe
 UNION ALL
 SELECT '01_catalogo_'||coalesce(e.kind,a.kind),
 CASE WHEN a.object IS NULL THEN 'BLOQUEIO'
      WHEN e.object IS NULL OR a.detail IS DISTINCT FROM e.detail THEN 'REVER'
      ELSE 'OK' END,
 coalesce(e.object,a.object),
 jsonb_build_object('esperado',e.detail,'actual',a.detail)
 FROM expected e FULL JOIN observed_catalog a ON e.kind=a.kind AND e.object=a.object
 UNION ALL
 SELECT '02_rls',CASE WHEN c.relrowsecurity THEN 'OK' ELSE 'BLOQUEIO' END,
 'public.'||c.relname,jsonb_build_object('rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
 'observacao','FORCE RLS=false e intencional para owner/SECURITY DEFINER; nao e bypass dos papeis API normais.')
 FROM tables c
 UNION ALL
 SELECT '03_privilegios_tabela',
 CASE WHEN can_insert OR can_update OR can_delete OR can_truncate OR can_reference OR can_trigger OR can_maintain
   OR (rolname='anon' AND can_select) OR (rolname='authenticated' AND NOT can_select)
 THEN 'BLOQUEIO' ELSE 'OK' END,
 'public.'||relname||' / '||rolname,to_jsonb(r)-'relname'-'rolname'
 FROM table_rights r
 UNION ALL
 SELECT '04_privilegios_coluna',
 CASE WHEN (r.rolname='anon' AND has_column_privilege(r.oid,c.oid,a.attnum,'SELECT,INSERT,UPDATE,REFERENCES'))
   OR (r.rolname='authenticated' AND has_column_privilege(r.oid,c.oid,a.attnum,'INSERT,UPDATE,REFERENCES'))
 THEN 'BLOQUEIO' ELSE 'OK' END,
 'public.'||c.relname||'.'||a.attname||' / '||r.rolname,
 jsonb_build_object('select',has_column_privilege(r.oid,c.oid,a.attnum,'SELECT'),
 'insert',has_column_privilege(r.oid,c.oid,a.attnum,'INSERT'),
 'update',has_column_privilege(r.oid,c.oid,a.attnum,'UPDATE'),
 'references',has_column_privilege(r.oid,c.oid,a.attnum,'REFERENCES'))
 FROM tables c JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
 CROSS JOIN pg_roles r WHERE r.rolname IN ('anon','authenticated')
 UNION ALL
 SELECT '05_PUBLIC_tabelas',CASE WHEN EXISTS(
   SELECT 1 FROM aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x WHERE x.grantee=0
 ) THEN 'BLOQUEIO' ELSE 'OK' END,'public.'||c.relname,
 jsonb_build_object('acl',c.relacl::text)
 FROM tables c
 UNION ALL
 SELECT '06_RPC',
 CASE WHEN has_function_privilege('anon',p.oid,'EXECUTE')
   OR has_function_privilege('authenticated',p.oid,'EXECUTE') IS DISTINCT FROM (r.signature IS NOT NULL)
   OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x
             WHERE x.grantee=0 AND x.privilege_type='EXECUTE')
   OR NOT p.prosecdef OR NOT EXISTS(SELECT 1 FROM unnest(p.proconfig) config
                                  WHERE config IN ('search_path=','search_path=""'))
 THEN 'BLOQUEIO' ELSE 'OK' END,p.signature,
 jsonb_build_object('owner',pg_get_userbyid(p.proowner),'security_definer',p.prosecdef,
 'config',p.proconfig,'acl',p.proacl::text,
 'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
 'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
 'authenticated_execute_esperado',r.signature IS NOT NULL,
 'source_md5_raw',md5(p.prosrc),
 'source_md5_lf',md5(replace(p.prosrc,chr(13)||chr(10),chr(10))),
 'observacao','A consulta nao executa a funcao. Ver tambem correspondencia de corpo/argumentos em catalogo_function.')
 FROM functions p LEFT JOIN allowed_rpc r ON r.signature=p.signature
 UNION ALL
 SELECT '07_papeis_api',CASE WHEN r.rolsuper OR r.rolbypassrls
   OR has_schema_privilege(r.oid,'public','CREATE') THEN 'BLOQUEIO' ELSE 'OK' END,r.rolname,
 jsonb_build_object('superuser',r.rolsuper,'bypassrls',r.rolbypassrls,
 'create_public',has_schema_privilege(r.oid,'public','CREATE'))
 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated')
 UNION ALL
 SELECT '08_politicas_escrita',CASE WHEN p.polcmd='r' THEN 'OK' ELSE 'BLOQUEIO' END,
 'public.'||c.relname||'.'||p.polname,
 jsonb_build_object('command',p.polcmd,'observacao','Escritas administrativas devem passar pelas RPCs autorizadas.')
 FROM pg_policy p JOIN tables c ON c.oid=p.polrelid
 UNION ALL
 SELECT '09_service_role','INFO','service_role',
 jsonb_build_object('bypassrls',r.rolbypassrls,
 'observacao','Papel administrativo de confianca; chave exclusivamente servidor. Nao e identidade de teste do isolamento RLS.')
 FROM pg_roles r WHERE r.rolname='service_role'
 UNION ALL
 SELECT '10_catalogos_iniciais',
 CASE WHEN actual.n=e.n AND actual.fingerprint=e.fingerprint THEN 'OK' ELSE 'REVER' END,
 e.name,jsonb_build_object('linhas_esperadas',e.n,'linhas_actuais',actual.n,
 'md5_esperado',e.fingerprint,'md5_actual',actual.fingerprint,
 'observacao','Referencia inicial antes do bootstrap; alteracoes autorizadas futuras exigem rever capacidades e nao reaplicar seeds.')
 FROM (VALUES
  ('roles',6::bigint,'5dffea29ebbe4758e454989bf8229f9e'),
  ('permissions',17::bigint,'400d1c0b05bff133c63235410ae1105f'),
  ('role_permissions',35::bigint,'3ee96dffb7c53b2d8988882360a38148')
 ) e(name,n,fingerprint)
 JOIN (
  SELECT 'roles' AS name,count(*) AS n,md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text) AS fingerprint FROM public.roles t
  UNION ALL SELECT 'permissions',count(*),md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text) FROM public.permissions t
  UNION ALL SELECT 'role_permissions',count(*),md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text) FROM public.role_permissions t
 ) actual USING(name)
 UNION ALL
 SELECT '11_contagens_utilizacao','INFO','Contagens sem dados pessoais',jsonb_build_object(
 'auth_users',(SELECT count(*) FROM auth.users),
 'profiles',(SELECT count(*) FROM public.profiles),
 'atribuicoes',(SELECT count(*) FROM public.user_role_assignments),
 'unidades',(SELECT count(*) FROM public.organizational_units),
 'centros_custo',(SELECT count(*) FROM public.cost_centers),
 'auditoria',(SELECT count(*) FROM public.audit_logs))
)
SELECT categoria,estado,objecto,detalhe,count(*) OVER () AS total_linhas
FROM reports ORDER BY categoria,objecto;
ROLLBACK;
