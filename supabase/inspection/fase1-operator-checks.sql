-- Grelha independente dos nove checks; evita mostrar apenas o ultimo SELECT.
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

ROLLBACK;
