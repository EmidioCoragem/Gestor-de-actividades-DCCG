-- Complemento de leitura: a baseline de inventario nao exporta estes
-- privilegios efectivos. Nao concede privilegios nem adquire locks SHARE.
-- Para PostgreSQL 17 (versao observada na baseline recebida).
BEGIN TRANSACTION READ ONLY;
WITH checks(objecto, permitido) AS (
 VALUES
 ('01_USAGE_public',has_schema_privilege(to_regnamespace('public')::oid,'USAGE')),
 ('02_CREATE_public',has_schema_privilege(to_regnamespace('public')::oid,'CREATE')),
 ('03_USAGE_auth',has_schema_privilege(to_regnamespace('auth')::oid,'USAGE')),
 ('04_SELECT_auth_users',has_table_privilege(to_regclass('auth.users'),'SELECT')),
 ('05_TRIGGER_auth_users',has_table_privilege(to_regclass('auth.users'),'TRIGGER')),
 ('06_REFERENCES_auth_users_id',has_column_privilege(to_regclass('auth.users'),'id','REFERENCES')),
 ('07_LOCK_SHARE_auth_users_recuperacao',
    has_table_privilege(to_regclass('auth.users'),'MAINTAIN')
 OR has_table_privilege(to_regclass('auth.users'),'UPDATE')
 OR has_table_privilege(to_regclass('auth.users'),'DELETE')
 OR has_table_privilege(to_regclass('auth.users'),'TRUNCATE')),
 ('08_EXECUTE_auth_uid',has_function_privilege(to_regprocedure('auth.uid()')::oid,'EXECUTE')),
 ('09_EXECUTE_gen_random_uuid',has_function_privilege(to_regprocedure('gen_random_uuid()')::oid,'EXECUTE'))
)
SELECT current_user AS operador,
 CASE WHEN permitido IS TRUE THEN 'OK' ELSE 'BLOQUEIO' END AS estado,
 objecto,permitido
FROM checks ORDER BY objecto;

-- Metadados adicionais para rever propriedade e o papel especial Supabase.
-- A pertença ao papel especial nao equivale a validar todas as operacoes DDL.
SELECT current_database() AS database,current_user AS operador,
 pg_get_userbyid(d.datdba) AS database_owner,
 pg_get_userbyid(c.relowner) AS auth_users_owner,
 pg_has_role(current_user,c.relowner,'USAGE') AS herda_papel_owner_auth_users,
 CASE WHEN to_regrole('supabase_privileged_role') IS NOT NULL
   THEN pg_has_role(current_user,to_regrole('supabase_privileged_role')::oid,'USAGE')
   ELSE false END AS herda_papel_privilegiado_supabase
FROM pg_database d LEFT JOIN pg_class c ON c.oid=to_regclass('auth.users')
WHERE d.datname=current_database();
ROLLBACK;
