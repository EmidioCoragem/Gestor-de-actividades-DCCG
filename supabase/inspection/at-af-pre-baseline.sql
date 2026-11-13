-- GERADO: captura privada ANTES da instalacao, sob autorizacao separada.
-- Original SHA-256: 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58
-- Incremental SHA-256: fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5
-- SELECT UNICO; nao chama funcoes da aplicacao, nao altera settings ou dados.
-- Pre-condicao: tabelas originais existentes; nenhum SQL e executado pelo gerador.
-- Guardar a grelha PRIVADAMENTE fora do Git, juntamente com versao/data/alvo/operador.
-- PASS indica apenas contexto de visibilidade integral adequado para esta captura.
-- INDETERMINADO/NULL/erro/resultado incompleto: NAO usar como baseline nem instalar.
-- Formula/contexto sao obrigatorios; hashes antigos de outros inspectores nao servem.
-- Mesmas formulas, role, versao, TimeZone, DateStyle e search_path antes/depois.
-- Somente hashes/contagem: nao emite pessoas, UUIDs, nomes de operadores ou auditoria.
-- Fingerprints NAO constituem backup, prova de restauro ou aprovacao de migracao.
WITH
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
)
SELECT CASE WHEN i.full_visibility THEN 'PASS' ELSE 'INDETERMINADO' END AS resultado,
 'at-af-baseline-v1' AS formula_id,
 CASE WHEN i.full_visibility THEN c.digest ELSE NULL END AS context_sha256,
 CASE WHEN i.full_visibility THEN (SELECT pg_catalog.count(*) FROM public.audit_logs) ELSE NULL END AS audit_rows,
 CASE WHEN i.full_visibility THEN (SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
   coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(a) ORDER BY a.id)::text,'[]'),'UTF8')),'hex') FROM public.audit_logs a) ELSE NULL END AS audit_sha256,
 CASE WHEN i.full_visibility THEN p.digest ELSE NULL END AS policy_sha256,
 CASE WHEN i.full_visibility THEN t.digest ELSE NULL END AS rls_sha256,
 CASE WHEN i.full_visibility THEN o.digest ELSE NULL END AS owners_sha256
FROM inspection_context i CROSS JOIN context_fingerprint c CROSS JOIN policy_fingerprint p
 CROSS JOIN table_fingerprint t CROSS JOIN ownership_fingerprint o;
