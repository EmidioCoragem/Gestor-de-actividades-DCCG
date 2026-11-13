-- GERADO por node scripts/generate-at-af-postflight.mjs. Nao executa SQL ao gerar.
-- Original SHA-256: 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58
-- Incremental SHA-256: fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5
-- SELECT UNICO. Executar somente apos instalacao autorizada; nao instala/repara nada.
-- Pre-condicao: as 16 tabelas da migracao original ja existem. NUNCA reaplicar a original.
-- PG17+: apenas pg_catalog/builtins de leitura. Nenhuma RPC, auth.uid ou funcao da aplicacao e chamada.
-- Usar inspector com visibilidade integral aprovada; RLS parcial nao prova ausencia de dados.
-- PASS significa conformidade catalogal/aggregate neste snapshot, nao homologacao PostgREST.
-- Referencias de codigo nao sao baseline historica remota. Campos abaixo ficam NULL no Git.
-- Preencher SOMENTE numa copia privada previamente aprovada com baseline anterior a instalacao.
-- Capturar ANTES com at-af-pre-baseline.sql; incluir formato/contexto e os cinco valores.
-- Fingerprints de preservacao usam a expressao EXACTA deste checker, nas duas capturas.
-- Os hashes antigos audit_logs/politicas_public de outro formato NAO sao intercambiaveis.
-- A captura posterior isolada, os catalogos e a guarda append-only NAO provam preservacao historica.
-- Nao emite corpos, nomes pessoais, emails, UUIDs, nomes de operadores ou dados de auditoria.
-- Baseline ausente, contexto sem visibilidade ou autorizacao operacional nao comprovada => INDETERMINADO.
WITH
baseline(formula_id,context_sha256,audit_rows,audit_sha256,policy_sha256,rls_sha256,owners_sha256,at_user_id,af_user_id,at_status,af_status) AS (
 VALUES (NULL::text,NULL::text,NULL::bigint,NULL::text,NULL::text,NULL::text,NULL::text,NULL::uuid,NULL::uuid,NULL::text,NULL::text)
),
expected_functions(schema_name,function_name,argument_types,argument_names,default_count,result_type,language_name,definer,volatility,source_sha256,unchanged_original) AS (
 VALUES
 ('public','is_active_user','','[]',0,'boolean','sql',true,'s','67b5971cc9615f7a03aa6646b1c3dc6b999324d5d0f8e87e906550112fe00506',true),
 ('public','in_unit_scope','uuid, uuid','["target","scope"]',0,'boolean','sql',true,'s','82430433e56ad04c33869942fc5251cbfa6842696eca33ca7fbc8fd43bd82632',true),
 ('public','has_permission','text, uuid','["required","target"]',1,'boolean','sql',true,'s','75cac24a0045a71da3c7c241228f6faca0cab0b769a55c568a4276396db6bc39',true),
 ('public','visible_person','uuid, text','["target","required"]',0,'boolean','sql',true,'s','ce7ed34d0dc9d985b47b7005843beafc18b19a6dbcdae0cb061d9b2ae7cf7849',true),
 ('public','my_permissions','','[]',0,'text[]','sql',true,'s','acb927c14a591eb923eaebf01f93d842007d4270022161c3a06217a15f203001',true),
 ('public','may_validate_activity','uuid[], uuid','["executors","target"]',0,'boolean','sql',true,'s','1324af55de241090bd6552c8d701087f95a489146bc86275c32e7711b23f3db6',true),
 ('public','handle_auth_user','','[]',0,'trigger','plpgsql',true,'v','964ade604e8b820df7210457fa6cf40ad7a92ca7ec1c623326e2123587f18915',true),
 ('public','protect_unit_tree','','[]',0,'trigger','plpgsql',true,'v','b006d3af86f7b5260cf8e9773695731053a380f6377a4e00b3622ffef6b57b47',true),
 ('public','protect_cost_tree','','[]',0,'trigger','plpgsql',true,'v','4309ec57f30c344836c0dc6bb12e61ee2aa3aab5f495ef8d8c9ff3ed3cfe6194',true),
 ('public','record_audit','','[]',0,'trigger','plpgsql',true,'v','2a1a9061e54138c19dadee49bcb5e80f3cd887223cc05ed8d7cb76eb4ce84a20',true),
 ('gestor_security','admin_mutation_legacy','text, jsonb','["operation","payload"]',0,'void','plpgsql',true,'v','9a50d386bfd96e335b635ffab51860d0ad69dc98ad3ae6d3caaf2babf9367057',false),
 ('public','audit_invitation','text, text, uuid','["email","stage","invited_user"]',1,'void','plpgsql',true,'v','b0566c60255a6a400cbe9226311b4369cf140e04c3926d205c9afc6f44c162c7',true),
 ('gestor_security','serialize_write','','[]',0,'void','plpgsql',true,'v','575fea2e671d1e6c95f069e310fe558771627f88a28230f319f2a085cd3c20fb',false),
 ('gestor_security','operator_session','','[]',0,'boolean','sql',true,'s','a9494593bb9ebba8da7bc6f659bbe35ff57da6f9f8a2c0d77500b20824d4822a',false),
 ('gestor_security','maintenance_context','','[]',0,'boolean','sql',true,'s','17973e54b5b2d3f0555b14585c763ef5be19bbf9f5ddcccd2635ca2dfc440050',false),
 ('gestor_security','enforce_segregation','','[]',0,'trigger','plpgsql',true,'v','d415ae7a1c42b76533de0897df53ba79d626d297b66233c3ed284eb33aa84e9e',false),
 ('gestor_security','deny_truncate','','[]',0,'trigger','plpgsql',false,'v','04629512a6d2dfe09dd67d42bd201ceb27f4bd411d5df8ecfc58f9c6dcad5e12',false),
 ('gestor_security','protect_audit','','[]',0,'trigger','plpgsql',false,'v','333c5d229f51e933cb973f8ca87b69dc7798ddea97dca2338aa2fa351ea1f56b',false),
 ('public','admin_mutation','text, jsonb','["operation","payload"]',0,'void','plpgsql',true,'v','009e3bf1a02ace3f7743071137a87a918662890995c062b0a457ea299e126998',false),
 ('gestor_security','maintain_technical_admin','uuid, text, text, text','["target","operation","change_ref","approval_ref"]',0,'void','plpgsql',true,'v','f48d8ca6ff201d9f658f6f221bfff1db5986cc78f519a1df7c603018edcb13ad',false)
),
functions_now AS (
 SELECT e.*,p.oid,p.proowner,p.proconfig,p.prosecdef,p.provolatile,p.prokind,p.proretset,p.prorettype,p.proleakproof,p.proisstrict,p.proparallel,
   p.pronargdefaults,p.proargnames,p.prosrc,l.lanname,
   pg_catalog.pg_get_function_arguments(p.oid) AS argument_definition,
   pg_catalog.pg_get_expr(p.proargdefaults,0) AS defaults_definition
 FROM expected_functions e
 LEFT JOIN pg_catalog.pg_namespace n ON n.nspname=e.schema_name
 LEFT JOIN pg_catalog.pg_proc p ON p.pronamespace=n.oid AND p.proname=e.function_name
   AND pg_catalog.oidvectortypes(p.proargtypes)=e.argument_types
 LEFT JOIN pg_catalog.pg_language l ON l.oid=p.prolang
),
expected_tables(table_name,protected,rls,force_rls) AS (
 VALUES
 ('audit_logs',true,true,false),
 ('cost_centers',false,true,false),
 ('delegations',true,true,false),
 ('external_identity_mappings',false,true,false),
 ('import_batches',false,true,false),
 ('integration_sources',false,true,false),
 ('organizational_units',false,true,false),
 ('permissions',true,true,false),
 ('positions',false,true,false),
 ('profiles',true,true,false),
 ('reporting_lines',false,true,false),
 ('role_permissions',true,true,false),
 ('roles',true,true,false),
 ('unit_responsibilities',false,true,false),
 ('user_positions',false,true,false),
 ('user_role_assignments',true,true,false)
),
tables_now AS (
 SELECT e.*,c.oid,c.relowner,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.relacl
 FROM expected_tables e
 LEFT JOIN pg_catalog.pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_catalog.pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
),
expected_policies(table_name,policy_name,detail_text) AS (
 VALUES
 ('audit_logs','audit_read','{"check":null,"roles":["authenticated"],"using":"has_permission(''audit.read''::text, unit_id)","command":"r","permissive":true}'),
 ('cost_centers','cost_read','{"check":null,"roles":["authenticated"],"using":"has_permission(''cost_centers.read''::text, unit_id)","command":"r","permissive":true}'),
 ('delegations','delegation_read','{"check":null,"roles":["authenticated"],"using":"(is_active_user() AND ((from_user_id = auth.uid()) OR (to_user_id = auth.uid()) OR has_permission(''access.manage''::text, scope_unit_id)))","command":"r","permissive":true}'),
 ('organizational_units','unit_read','{"check":null,"roles":["authenticated"],"using":"(has_permission(''org.read''::text, id) OR has_permission(''org.manage''::text, id) OR (is_active_user() AND (EXISTS ( SELECT 1'||pg_catalog.chr(92)||'n   FROM user_positions p'||pg_catalog.chr(92)||'n  WHERE ((p.user_id = auth.uid()) AND (p.unit_id = organizational_units.id) AND (p.valid_until IS NULL))))))","command":"r","permissive":true}'),
 ('permissions','permission_catalog_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'),
 ('positions','position_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'),
 ('profiles','profile_read','{"check":null,"roles":["authenticated"],"using":"((id = auth.uid()) OR visible_person(id, ''users.read''::text))","command":"r","permissive":true}'),
 ('reporting_lines','reporting_read','{"check":null,"roles":["authenticated"],"using":"(((user_id = auth.uid()) AND is_active_user()) OR has_permission(''org.read''::text, unit_id))","command":"r","permissive":true}'),
 ('role_permissions','role_permission_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'),
 ('roles','role_catalog_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'),
 ('unit_responsibilities','responsible_read','{"check":null,"roles":["authenticated"],"using":"has_permission(''org.read''::text, unit_id)","command":"r","permissive":true}'),
 ('user_positions','membership_read','{"check":null,"roles":["authenticated"],"using":"(((user_id = auth.uid()) AND is_active_user()) OR has_permission(''org.read''::text, unit_id) OR has_permission(''users.read''::text, unit_id))","command":"r","permissive":true}'),
 ('user_role_assignments','grants_read','{"check":null,"roles":["authenticated"],"using":"(((user_id = auth.uid()) AND is_active_user()) OR has_permission(''access.manage''::text, scope_unit_id))","command":"r","permissive":true}')
),
policies_now AS (
 SELECT c.relname AS table_name,p.polname AS policy_name,
   pg_catalog.jsonb_build_object('command',p.polcmd,'permissive',p.polpermissive,
     'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(r) END ORDER BY r)
       FROM pg_catalog.unnest(p.polroles) r),
     'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),
     'check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) AS detail
 FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid
 JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public'
),
expected_triggers(schema_name,table_name,trigger_name,function_schema,function_name,event_flags,enabled,new_guard) AS (
 VALUES
 ('auth','users','auth_user_profile','public','handle_auth_user',5,'O',false),
 ('public','cost_centers','audit_changes','public','record_audit',29,'O',false),
 ('public','cost_centers','cost_tree','public','protect_cost_tree',23,'O',false),
 ('public','delegations','audit_changes','public','record_audit',29,'O',false),
 ('public','external_identity_mappings','audit_changes','public','record_audit',29,'O',false),
 ('public','import_batches','audit_changes','public','record_audit',29,'O',false),
 ('public','integration_sources','audit_changes','public','record_audit',29,'O',false),
 ('public','organizational_units','audit_changes','public','record_audit',29,'O',false),
 ('public','organizational_units','unit_tree','public','protect_unit_tree',23,'O',false),
 ('public','positions','audit_changes','public','record_audit',29,'O',false),
 ('public','profiles','audit_changes','public','record_audit',29,'O',false),
 ('public','reporting_lines','audit_changes','public','record_audit',29,'O',false),
 ('public','role_permissions','audit_changes','public','record_audit',29,'O',false),
 ('public','roles','audit_changes','public','record_audit',29,'O',false),
 ('public','unit_responsibilities','audit_changes','public','record_audit',29,'O',false),
 ('public','user_positions','audit_changes','public','record_audit',29,'O',false),
 ('public','user_role_assignments','audit_changes','public','record_audit',29,'O',false),
 ('public','roles','security_no_truncate','gestor_security','deny_truncate',34,'A',true),
 ('public','permissions','security_no_truncate','gestor_security','deny_truncate',34,'A',true),
 ('public','role_permissions','security_no_truncate','gestor_security','deny_truncate',34,'A',true),
 ('public','user_role_assignments','security_no_truncate','gestor_security','deny_truncate',34,'A',true),
 ('public','delegations','security_no_truncate','gestor_security','deny_truncate',34,'A',true),
 ('public','profiles','security_no_truncate','gestor_security','deny_truncate',34,'A',true),
 ('public','audit_logs','security_no_truncate','gestor_security','deny_truncate',34,'A',true),
 ('public','roles','segregation_guard','gestor_security','enforce_segregation',31,'A',true),
 ('public','permissions','segregation_guard','gestor_security','enforce_segregation',31,'A',true),
 ('public','role_permissions','segregation_guard','gestor_security','enforce_segregation',31,'A',true),
 ('public','user_role_assignments','segregation_guard','gestor_security','enforce_segregation',31,'A',true),
 ('public','delegations','segregation_guard','gestor_security','enforce_segregation',31,'A',true),
 ('public','profiles','segregation_guard','gestor_security','enforce_segregation',31,'A',true),
 ('public','audit_logs','audit_integrity','gestor_security','protect_audit',31,'A',true)
),
triggers_now AS (
 SELECT e.*,t.oid,t.tgtype,t.tgenabled,t.tgnargs,t.tgargs,t.tgqual,t.tgisinternal,
   t.tgdeferrable,t.tginitdeferred,t.tgconstraint,t.tgoldtable,t.tgnewtable,
   t.tgattr::text AS update_columns,p.proname,p.pronargs,p.prorettype,pn.nspname AS actual_function_schema
 FROM expected_triggers e
 LEFT JOIN pg_catalog.pg_namespace n ON n.nspname=e.schema_name
 LEFT JOIN pg_catalog.pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
 LEFT JOIN pg_catalog.pg_trigger t ON t.tgrelid=c.oid AND t.tgname=e.trigger_name
 LEFT JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
 LEFT JOIN pg_catalog.pg_namespace pn ON pn.oid=p.pronamespace
),
api_names(role_name) AS (VALUES ('anon'),('authenticated'),('service_role'),('authenticator')),
api_roles AS (
 SELECT a.role_name,r.* FROM api_names a LEFT JOIN pg_catalog.pg_roles r ON r.rolname=a.role_name
),
reachable AS (
 SELECT a.role_name AS api_origin,r.* FROM api_roles a CROSS JOIN pg_catalog.pg_roles r
 WHERE a.oid IS NOT NULL AND (r.oid=a.oid OR pg_catalog.pg_has_role(a.oid,r.oid,'SET'))
),
member_reachable AS (
 SELECT a.role_name AS api_origin,r.* FROM api_roles a CROSS JOIN pg_catalog.pg_roles r
 WHERE a.oid IS NOT NULL AND pg_catalog.pg_has_role(a.oid,r.oid,'MEMBER')
),
operator_role AS (SELECT r.* FROM pg_catalog.pg_roles r WHERE r.rolname='gestor_security_operator'),
owner_reference AS (SELECT relowner AS oid FROM tables_now WHERE table_name='audit_logs'),
inspection_context AS (
 SELECT NOT EXISTS(SELECT 1 FROM tables_now c WHERE c.oid IS NULL OR c.relkind<>'r' OR NOT (
   (c.relowner=(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=current_user) AND NOT c.relforcerowsecurity)
   OR EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls))
 )) AS full_visibility
),
policy_fingerprint AS (
 SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(coalesce(pg_catalog.jsonb_agg(
   pg_catalog.jsonb_build_object('table',table_name,'policy',policy_name,'detail',detail)
   ORDER BY table_name,policy_name)::text,'[]'),'UTF8')),'hex') AS digest FROM policies_now
),
table_fingerprint AS (
 SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(coalesce(pg_catalog.jsonb_agg(
   pg_catalog.jsonb_build_object('table',table_name,'kind',relkind,'rls',relrowsecurity,'force',relforcerowsecurity)
   ORDER BY table_name)::text,'[]'),'UTF8')),'hex') AS digest FROM tables_now
),
ownership_fingerprint AS (
 SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(coalesce(pg_catalog.jsonb_agg(
   pg_catalog.jsonb_build_object('table',table_name,'owner',pg_catalog.pg_get_userbyid(relowner))
   ORDER BY table_name)::text,'[]'),'UTF8')),'hex') AS digest FROM tables_now
),
context_fingerprint AS (
 SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
   'formula','at-af-baseline-v1','server',pg_catalog.current_setting('server_version_num'),
   'timezone',pg_catalog.current_setting('TimeZone'),'datestyle',pg_catalog.current_setting('DateStyle'),
   'search_path',pg_catalog.current_setting('search_path'),'role',current_user)::text,'UTF8')),'hex') AS digest
),
data_checks AS (
 SELECT 'PF-DATA-01'::text AS criterion,
   EXISTS(SELECT 1 FROM public.roles WHERE code='technical_admin' AND technical)
   AND EXISTS(SELECT 1 FROM public.roles WHERE code='access_admin' AND technical)
   AND (SELECT pg_catalog.array_agg(permission_code ORDER BY permission_code) FROM public.role_permissions WHERE role_code='technical_admin')
     IS NOT DISTINCT FROM ARRAY['users.manage','users.read']::text[]
   AND (SELECT pg_catalog.array_agg(permission_code ORDER BY permission_code) FROM public.role_permissions WHERE role_code='access_admin')
     IS NOT DISTINCT FROM ARRAY['access.manage','audit.read','org.read','users.read']::text[] AS ok,
   'Catalogos AT/AF canonicos e capacidades exactas; nao activa perfis.'::text AS note
 UNION ALL
 SELECT 'PF-DATA-02',NOT EXISTS(SELECT 1 FROM public.role_permissions WHERE permission_code='users.manage' AND role_code<>'technical_admin'),
   'users.manage exclusivo do papel tecnico, sem clonagem.'
 UNION ALL
 SELECT 'PF-DATA-03',NOT EXISTS(SELECT 1 FROM public.user_role_assignments WHERE role_code='technical_admin' AND scope_unit_id IS NOT NULL),
   'Nenhuma concessao tecnica limitada, incluindo historico.'
 UNION ALL
 SELECT 'PF-DATA-04',NOT EXISTS(SELECT 1 FROM public.delegations WHERE permission_code IN ('users.manage','access.manage')),
   'Nenhuma delegacao administrativa, incluindo historico.'
 UNION ALL
 SELECT 'PF-DATA-05',NOT EXISTS(SELECT 1 FROM public.user_role_assignments a JOIN public.user_role_assignments b
   ON a.user_id=b.user_id AND a.id<>b.id AND (a.role_code='technical_admin' OR b.role_code='technical_admin')
   AND pg_catalog.tstzrange(a.valid_from,a.valid_until,'[)') && pg_catalog.tstzrange(b.valid_from,b.valid_until,'[)')),
   'Sem sobreposicao tecnica/qualquer outro papel, independentemente de perfil activo ou futuro.'
),
checks(criterion,result,note) AS (
 SELECT 'PF-FUNC-'||schema_name||'.'||function_name||'('||argument_types||')',
   CASE WHEN oid IS NOT NULL AND prokind='f' AND NOT proretset
     AND lanname=language_name AND prosecdef=definer AND provolatile=volatility
     AND NOT proleakproof AND NOT proisstrict AND proparallel='u'
     AND proconfig=ARRAY['search_path=""']::text[]
     AND pg_catalog.to_jsonb(coalesce(proargnames,ARRAY[]::text[]))=argument_names::jsonb
     AND pronargdefaults=default_count
     AND (default_count=0 OR defaults_definition='NULL::uuid')
     AND prorettype=pg_catalog.to_regtype('pg_catalog.'||CASE WHEN result_type='boolean' THEN 'bool' ELSE result_type END)
     AND pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.replace(prosrc,pg_catalog.chr(13)||pg_catalog.chr(10),pg_catalog.chr(10)),'UTF8')),'hex')=source_sha256
     AND proowner=(SELECT oid FROM owner_reference)
   THEN 'PASS' ELSE 'FAIL' END,
   'Assinatura, corpo SHA-256 LF, linguagem, retorno, argumentos/defaults, flags, search_path e owner coerente; nao prova owner historico.'
 FROM functions_now
 UNION ALL
 SELECT 'PF-FUNC-INVENTORY',CASE WHEN
   (SELECT pg_catalog.count(*) FROM functions_now WHERE oid IS NOT NULL)=20
   AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname IN ('public','gestor_security') AND p.prokind IN ('f','p')
     AND NOT EXISTS(SELECT 1 FROM functions_now f WHERE f.oid=p.oid)
     AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_catalog.pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'))
   THEN 'PASS' ELSE 'FAIL' END,'20 funcoes esperadas; routines adicionais nao pertencentes a extensoes exigem revisao.'
 UNION ALL
 SELECT 'PF-TRIGGER-'||schema_name||'.'||table_name||'.'||trigger_name,
   CASE WHEN oid IS NOT NULL AND tgtype=event_flags AND tgenabled::text=enabled AND tgnargs=0
     AND pg_catalog.encode(tgargs,'hex')='' AND tgqual IS NULL AND NOT tgisinternal
     AND NOT tgdeferrable AND NOT tginitdeferred AND tgconstraint=0 AND tgoldtable IS NULL AND tgnewtable IS NULL
     AND update_columns='' AND proname=function_name AND actual_function_schema=function_schema AND pronargs=0
     AND prorettype=pg_catalog.to_regtype('pg_catalog.trigger')
   THEN 'PASS' ELSE 'FAIL' END,'Eventos, linha/instrucao, BEFORE/AFTER, ALWAYS/O, argumentos/WHEN e funcao exactos; sem executar trigger.'
 FROM triggers_now
 UNION ALL
 SELECT 'PF-TRIGGER-INVENTORY',CASE WHEN
   (SELECT pg_catalog.count(*) FROM triggers_now WHERE new_guard AND oid IS NOT NULL)=14
   AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
     WHERE NOT t.tgisinternal AND (n.nspname='public' OR (n.nspname='auth' AND c.relname='users'))
     AND NOT EXISTS(SELECT 1 FROM triggers_now e WHERE e.oid=t.oid)
     AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_catalog.pg_trigger'::regclass AND d.objid=t.oid AND d.deptype='e'))
   THEN 'PASS' ELSE 'FAIL' END,'14 novas guardas e 17 triggers originais; nenhum trigger adicional nao revisto.'
 UNION ALL
 SELECT 'PF-RLS-CODE-'||table_name,CASE WHEN oid IS NOT NULL AND relkind='r' AND relrowsecurity=rls AND relforcerowsecurity=force_rls THEN 'PASS' ELSE 'FAIL' END,
   'RLS/FORCE compativeis com a referencia original do codigo; preservacao remota exige baseline privada.' FROM tables_now
 UNION ALL
 SELECT 'PF-POLICY-CODE-'||e.table_name||'.'||e.policy_name,CASE WHEN p.detail=e.detail_text::jsonb THEN 'PASS' ELSE 'FAIL' END,
   'Politica compativel com referencia do codigo; diferencas de pg_get_expr/search_path exigem revisao, nunca reparacao automatica.'
 FROM expected_policies e LEFT JOIN policies_now p ON p.table_name=e.table_name AND p.policy_name=e.policy_name
 UNION ALL
 SELECT 'PF-POLICY-INVENTORY',CASE WHEN (SELECT pg_catalog.count(*) FROM policies_now)=13
   AND NOT EXISTS(SELECT 1 FROM policies_now p WHERE NOT EXISTS(SELECT 1 FROM expected_policies e WHERE e.table_name=p.table_name AND e.policy_name=p.policy_name)) THEN 'PASS' ELSE 'FAIL' END,
   'Treze politicas public esperadas; nao e prova temporal de preservacao.'
 UNION ALL
 SELECT 'PF-API-ROLES',CASE WHEN (SELECT pg_catalog.count(*) FROM api_roles WHERE oid IS NOT NULL)=4
   AND NOT EXISTS(SELECT 1 FROM api_roles WHERE rolsuper OR rolcreaterole OR (role_name IN ('anon','authenticated') AND rolbypassrls)) THEN 'PASS' ELSE 'FAIL' END,
   'Quatro identidades API presentes, sem poderes SQL incompatíveis.'
 UNION ALL
 SELECT 'PF-API-DDL-SET',CASE WHEN NOT EXISTS(SELECT 1 FROM reachable r WHERE r.rolsuper OR r.rolcreaterole
   OR pg_catalog.has_schema_privilege(r.oid,'public','CREATE')
   OR pg_catalog.has_parameter_privilege(r.oid,'session_replication_role','SET')
   OR EXISTS(SELECT 1 FROM tables_now t WHERE t.protected AND (r.oid=t.relowner OR pg_catalog.has_table_privilege(r.oid,t.oid,'TRIGGER'))))
   THEN 'PASS' ELSE 'FAIL' END,'Poderes efectivos e alcancaveis por SET ROLE; nao testa DDL nem SET.'
 UNION ALL
 SELECT 'PF-API-DDL-MEMBER',CASE WHEN NOT EXISTS(SELECT 1 FROM member_reachable r WHERE r.rolsuper OR r.rolcreaterole
   OR pg_catalog.has_schema_privilege(r.oid,'public','CREATE')
   OR pg_catalog.has_parameter_privilege(r.oid,'session_replication_role','SET')
   OR EXISTS(SELECT 1 FROM tables_now t WHERE t.protected AND (r.oid=t.relowner OR pg_catalog.has_table_privilege(r.oid,t.oid,'TRIGGER'))))
   THEN 'PASS' ELSE 'FAIL' END,'Guarda conservadora MEMBER alinhada com migracao; MEMBER pode incluir ligacoes SET FALSE.'
 UNION ALL
 SELECT 'PF-API-SCHEMA-PRIVATE',CASE WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='gestor_security')
   AND NOT EXISTS(SELECT 1 FROM reachable r JOIN pg_catalog.pg_namespace n ON n.nspname='gestor_security'
     WHERE pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE') OR pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE') OR r.oid=n.nspowner)
   THEN 'PASS' ELSE 'FAIL' END,'Schema privado existente e inacessivel a API efectiva/assumivel.'
 UNION ALL
 SELECT 'PF-API-FUNCTION-ACL',CASE WHEN NOT EXISTS(SELECT 1 FROM reachable r CROSS JOIN functions_now f WHERE f.oid IS NOT NULL
   AND NOT (r.rolname='service_role' AND f.unchanged_original) AND
   pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE') IS DISTINCT FROM
   CASE WHEN f.schema_name='gestor_security' THEN false
     WHEN r.rolname='authenticated' THEN f.function_name IN ('admin_mutation','is_active_user','has_permission','visible_person','my_permissions','may_validate_activity','audit_invitation')
     ELSE false END)
   AND NOT EXISTS(SELECT 1 FROM functions_now f JOIN pg_catalog.pg_proc p ON p.oid=f.oid
     CROSS JOIN LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
     WHERE a.grantee=0 AND a.privilege_type='EXECUTE') THEN 'PASS' ELSE 'FAIL' END,
   'API/SET ROLE: wrapper so authenticated; privadas/legado negados. EXCLUI grants service_role dos onze helpers originais: criterio separado indeterminado.'
 UNION ALL
 SELECT 'PF-API-SERVICE-LEGACY-GRANTS','INDETERMINADO',
   'Concessoes personalizadas service_role dos onze helpers inalterados exigem baseline privada anterior. Nao inferir nem alterar por comparacao tautologica.'
 UNION ALL
 SELECT 'PF-API-TABLE-ACL',CASE WHEN NOT EXISTS(SELECT 1 FROM reachable r CROSS JOIN tables_now t
   CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN')) AS v(privilege_name)
   WHERE t.protected AND t.oid IS NOT NULL AND pg_catalog.has_table_privilege(r.oid,t.oid,v.privilege_name)
     IS DISTINCT FROM (v.privilege_name='SELECT' AND r.rolname IN ('authenticated','service_role')))
   THEN 'PASS' ELSE 'FAIL' END,'Sete tabelas: apenas SELECT para authenticated/service_role; sem DML/TRUNCATE/TRIGGER/REFERENCES/MAINTAIN.'
 UNION ALL
 SELECT 'PF-API-COLUMN-ACL',CASE WHEN NOT EXISTS(SELECT 1 FROM reachable r CROSS JOIN tables_now t
   JOIN pg_catalog.pg_attribute a ON a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped
   CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('REFERENCES')) AS v(privilege_name)
   WHERE t.protected AND pg_catalog.has_column_privilege(r.oid,t.oid,a.attnum,v.privilege_name)
     IS DISTINCT FROM (v.privilege_name='SELECT' AND r.rolname IN ('authenticated','service_role')))
   AND NOT EXISTS(SELECT 1 FROM tables_now t JOIN pg_catalog.pg_attribute c ON c.attrelid=t.oid AND c.attnum>0 AND NOT c.attisdropped
     CROSS JOIN LATERAL pg_catalog.aclexplode(c.attacl) a
     WHERE t.protected AND a.is_grantable AND (a.grantee=0 OR EXISTS(SELECT 1 FROM reachable r WHERE r.oid=a.grantee)))
   THEN 'PASS' ELSE 'FAIL' END,'Privilegios efectivos por coluna e grant options; revogar tabela nao remove ACLs de coluna.'
 UNION ALL
 SELECT 'PF-API-GRANT-OPTIONS',CASE WHEN NOT EXISTS(SELECT 1 FROM tables_now t
   CROSS JOIN LATERAL pg_catalog.aclexplode(t.relacl) a WHERE t.protected AND a.is_grantable
   AND (a.grantee=0 OR EXISTS(SELECT 1 FROM reachable r WHERE r.oid=a.grantee)))
   AND NOT EXISTS(SELECT 1 FROM functions_now f JOIN pg_catalog.pg_proc p ON p.oid=f.oid CROSS JOIN LATERAL pg_catalog.aclexplode(p.proacl) a
     WHERE a.is_grantable AND (a.grantee=0 OR EXISTS(SELECT 1 FROM reachable r WHERE r.oid=a.grantee))) THEN 'PASS' ELSE 'FAIL' END,
   'Nenhuma capacidade API de redistribuir grants de tabela/funcao.'
 UNION ALL
 SELECT 'PF-OPERATOR-ATTRIBUTES',CASE WHEN EXISTS(SELECT 1 FROM operator_role WHERE NOT rolcanlogin AND NOT rolinherit AND NOT rolsuper
   AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication AND NOT rolbypassrls)
   AND NOT EXISTS(SELECT 1 FROM reachable r JOIN operator_role o ON r.oid=o.oid OR pg_catalog.pg_has_role(r.oid,o.oid,'MEMBER')) THEN 'PASS' ELSE 'FAIL' END,
   'Operador NOLOGIN/NOINHERIT restrito; nenhuma pertença API, mesmo indirecta.'
 UNION ALL
 SELECT 'PF-OPERATOR-FUNCTION-ACL',CASE WHEN EXISTS(SELECT 1 FROM operator_role)
   AND NOT EXISTS(SELECT 1 FROM operator_role r CROSS JOIN functions_now f WHERE f.schema_name='gestor_security' AND f.oid IS NOT NULL
     AND pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE') IS DISTINCT FROM (f.function_name='maintain_technical_admin'))
   AND NOT EXISTS(SELECT 1 FROM functions_now f JOIN pg_catalog.pg_proc p ON p.oid=f.oid
     CROSS JOIN LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
     WHERE f.schema_name='gestor_security' AND a.grantee<>p.proowner
       AND NOT (f.function_name='maintain_technical_admin' AND a.grantee=(SELECT oid FROM operator_role) AND NOT a.is_grantable))
   THEN 'PASS' ELSE 'FAIL' END,'So a manutencao tecnica e executavel pelo operador; nenhum grant privado adicional ou grant option.'
 UNION ALL
 SELECT 'PF-OPERATOR-SCHEMA-ACL',CASE WHEN EXISTS(SELECT 1 FROM operator_role r JOIN pg_catalog.pg_namespace n ON n.nspname='gestor_security'
   WHERE pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE') AND NOT pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE')) THEN 'PASS' ELSE 'FAIL' END,
   'Operador tem USAGE, nunca CREATE no schema privado; nao altera grants.'
 UNION ALL
 SELECT 'PF-OPERATOR-MEMBERS',CASE WHEN NOT EXISTS(SELECT 1 FROM operator_role) THEN 'FAIL'
   WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_auth_members m JOIN operator_role o ON o.oid=m.roleid WHERE m.member IS DISTINCT FROM (SELECT oid FROM owner_reference))
   THEN 'INDETERMINADO' ELSE 'PASS' END,'Membros alem do eventual instalador exigem autorizacao privada independente; nao identifica pessoas nem revoga membros.'
 UNION ALL
 SELECT 'PF-OWNER-COHERENCE',CASE WHEN (SELECT oid FROM owner_reference) IS NOT NULL
   AND NOT EXISTS(SELECT 1 FROM tables_now WHERE protected AND relowner IS DISTINCT FROM (SELECT oid FROM owner_reference))
   AND EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='gestor_security' AND nspowner=(SELECT oid FROM owner_reference))
   AND NOT EXISTS(SELECT 1 FROM member_reachable r WHERE r.oid=(SELECT oid FROM owner_reference)) THEN 'PASS' ELSE 'FAIL' END,
   'Owners coerentes entre tabelas protegidas/funcoes/schema; identidade historica depende de baseline, nao current_user.'
 UNION ALL
 SELECT 'PF-EPOCH-CATALOG',CASE WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='gestor_security' AND c.relname='write_epoch' AND c.relkind='r' AND c.relowner=(SELECT oid FROM owner_reference)
   AND (SELECT pg_catalog.count(*) FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped)=2
   AND EXISTS(SELECT 1 FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid AND a.attname='id' AND a.attnotnull AND a.atttypid=pg_catalog.to_regtype('pg_catalog.int4'))
   AND EXISTS(SELECT 1 FROM pg_catalog.pg_attribute a WHERE a.attrelid=c.oid AND a.attname='epoch' AND a.attnotnull AND a.atttypid=pg_catalog.to_regtype('pg_catalog.int8'))
   AND EXISTS(SELECT 1 FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attname='id'
     WHERE k.conrelid=c.oid AND k.contype='p' AND k.convalidated AND k.conkey=ARRAY[a.attnum])
   AND EXISTS(SELECT 1 FROM pg_catalog.pg_constraint k WHERE k.conrelid=c.oid AND k.contype='c' AND k.convalidated AND pg_catalog.pg_get_expr(k.conbin,k.conrelid)='(id = 1)')
   AND NOT EXISTS(SELECT 1 FROM reachable r CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN')) AS v(privilege_name)
     WHERE pg_catalog.has_table_privilege(r.oid,c.oid,v.privilege_name))
   AND NOT EXISTS(SELECT 1 FROM operator_role r CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN')) AS v(privilege_name)
     WHERE pg_catalog.has_table_privilege(r.oid,c.oid,v.privilege_name))) THEN 'PASS' ELSE 'FAIL' END,
   'Catalogo/ACL da guarda de serializacao; nao le nem altera epoch e nao demonstra concorrencia.'
 UNION ALL
 SELECT 'PF-EPOCH-OPERATIONAL','INDETERMINADO',
   'Catalogo nao prova existencia/conteudo da linha id=1 nem serializacao real. Leitura especifica de epoch so apos schema/privilegios confirmados e autorizacao propria.'
 UNION ALL
 SELECT criterion,CASE WHEN NOT (SELECT full_visibility FROM inspection_context) THEN 'INDETERMINADO' WHEN ok THEN 'PASS' ELSE 'FAIL' END,note FROM data_checks
 UNION ALL
 SELECT 'PF-PROFILE-STATES',CASE WHEN NOT (SELECT full_visibility FROM inspection_context) THEN 'INDETERMINADO'
   WHEN EXISTS(SELECT 1 FROM public.profiles WHERE status NOT IN ('active','inactive','suspended') OR status IS NULL) THEN 'FAIL' ELSE 'PASS' END,
   'Estados validos dos perfis; nao prova quem e AT/AF, nem activa/recria contas.'
 UNION ALL
 SELECT 'PF-AT-AF-PROFILES',CASE WHEN b.at_user_id IS NULL OR b.af_user_id IS NULL OR b.at_status IS NULL OR b.af_status IS NULL
     OR NOT (SELECT full_visibility FROM inspection_context) THEN 'INDETERMINADO'
   WHEN b.at_user_id=b.af_user_id OR b.at_status NOT IN ('active','inactive','suspended') OR b.af_status NOT IN ('active','inactive','suspended') THEN 'FAIL'
   WHEN EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=b.at_user_id AND p.status=b.at_status)
     AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=b.af_user_id AND p.status=b.af_status) THEN 'PASS' ELSE 'FAIL' END,
   'Aliases distintos e estados esperados da fase so com identificadores privados aprovados; nao confirma titulares humanos, Auth ou bootstrap.' FROM baseline b
 UNION ALL
 SELECT 'PF-BASELINE-CONTEXT',CASE WHEN b.formula_id IS NULL OR b.context_sha256 IS NULL THEN 'INDETERMINADO'
   WHEN b.formula_id='at-af-baseline-v1' AND b.context_sha256=c.digest THEN 'PASS' ELSE 'FAIL' END,
   'Formato/contexto da captura privada compativeis; nao reutilizar hash antigo com outra formula, TimeZone, DateStyle, search_path, role ou versao.' FROM baseline b CROSS JOIN context_fingerprint c
 UNION ALL
 SELECT 'PF-BASELINE-AUDIT',CASE WHEN b.formula_id IS DISTINCT FROM 'at-af-baseline-v1' OR b.context_sha256 IS DISTINCT FROM (SELECT digest FROM context_fingerprint)
   OR b.audit_rows IS NULL OR b.audit_rows<0 OR b.audit_sha256 IS NULL OR NOT (SELECT full_visibility FROM inspection_context) THEN 'INDETERMINADO'
   WHEN b.audit_rows=(SELECT pg_catalog.count(*) FROM public.audit_logs) AND b.audit_sha256=(SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
     coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.id)::text,'[]'),'UTF8')),'hex') FROM public.audit_logs a) THEN 'PASS' ELSE 'FAIL' END,
   'Comparar imediatamente com baseline privada anterior, mesma formula; mudancas concorrentes/legitimas tambem divergem. Hash/count nao sao backup.' FROM baseline b
 UNION ALL
 SELECT 'PF-BASELINE-POLICIES',CASE WHEN b.formula_id IS DISTINCT FROM 'at-af-baseline-v1' OR b.context_sha256 IS DISTINCT FROM (SELECT digest FROM context_fingerprint)
   OR b.policy_sha256 IS NULL THEN 'INDETERMINADO' WHEN b.policy_sha256=p.digest THEN 'PASS' ELSE 'FAIL' END,
   'Preservacao temporal so com fingerprint privado anterior no mesmo formato; referencia de codigo nao substitui.' FROM baseline b CROSS JOIN policy_fingerprint p
 UNION ALL
 SELECT 'PF-BASELINE-RLS',CASE WHEN b.formula_id IS DISTINCT FROM 'at-af-baseline-v1' OR b.context_sha256 IS DISTINCT FROM (SELECT digest FROM context_fingerprint)
   OR b.rls_sha256 IS NULL THEN 'INDETERMINADO' WHEN b.rls_sha256=p.digest THEN 'PASS' ELSE 'FAIL' END,
   'RLS/FORCE preservados apenas mediante baseline privada anterior, capturada no mesmo formato.' FROM baseline b CROSS JOIN table_fingerprint p
 UNION ALL
 SELECT 'PF-BASELINE-OWNERS',CASE WHEN b.formula_id IS DISTINCT FROM 'at-af-baseline-v1' OR b.context_sha256 IS DISTINCT FROM (SELECT digest FROM context_fingerprint)
   OR b.owners_sha256 IS NULL THEN 'INDETERMINADO' WHEN b.owners_sha256=p.digest THEN 'PASS' ELSE 'FAIL' END,
   'Owners historicos so comprovados por baseline privada anterior; nao emite nomes.' FROM baseline b CROSS JOIN ownership_fingerprint p
 UNION ALL
 SELECT 'PF-DEFAULT-PRIVILEGES','INDETERMINADO',
   'Grants explicitos default globais/public/privado a PUBLIC/API/operador: '||pg_catalog.count(*)::text||
   '. Defaults implicitos de funcoes tambem podem conceder poderes futuros; isto nao e incompatibilidade automatica dos objectos actuais. Revisao separada antes de futuras migracoes.'
 FROM pg_catalog.pg_default_acl d CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) a
 WHERE (d.defaclnamespace=0 OR d.defaclnamespace IN (SELECT oid FROM pg_catalog.pg_namespace WHERE nspname IN ('public','gestor_security')))
   AND (a.grantee=0 OR a.grantee IN (SELECT oid FROM reachable) OR a.grantee IN (SELECT oid FROM operator_role))
 UNION ALL
 SELECT 'PF-POSTGREST-RUNTIME','INDETERMINADO',
   'Catalogos nao comprovam schema exposto/cache, db_pre_request efectivo, identidades Auth ou ausencia de efeitos dos pedidos reais.'
 UNION ALL
 SELECT 'PF-INSTALLATION-COMMIT','INDETERMINADO',
   'Conformidade de objectos nao demonstra resposta COMMIT nem autoriza repetir aplicacao. Reconciliar registo operacional privado.'
)
SELECT criterion AS criterio,result AS resultado,note AS observacao FROM checks ORDER BY criterion;
