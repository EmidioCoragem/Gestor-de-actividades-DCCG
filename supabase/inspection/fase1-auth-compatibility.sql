-- Corrige exclusivamente a comparação de tipos da inspecção anterior.
-- Não é uma migração nem substitui a grelha completa de conflitos.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

WITH esperadas(nome, tipos_aceites, descricao) AS (
  VALUES
    ('id', ARRAY['pg_catalog.uuid'::regtype::oid], 'uuid'),
    ('email', ARRAY['pg_catalog.text'::regtype::oid,
                   'pg_catalog.varchar'::regtype::oid], 'text ou character varying'),
    ('raw_user_meta_data', ARRAY['pg_catalog.jsonb'::regtype::oid], 'jsonb')
)
SELECT
  '05_colunas_auth' AS categoria,
  CASE WHEN a.atttypid = ANY(e.tipos_aceites)
       THEN 'OK' ELSE 'BLOQUEIO' END AS estado,
  'auth.users.' || e.nome AS objecto,
  jsonb_build_object(
    'tipos_aceites', e.descricao,
    'tipo_actual', format_type(a.atttypid, a.atttypmod),
    'not_null', a.attnotnull,
    'pode_references', has_column_privilege(
      to_regclass('auth.users'), a.attnum, 'REFERENCES'
    ),
    'observacao', 'O estado desta linha verifica apenas compatibilidade do tipo.'
  ) AS detalhe
FROM esperadas e
LEFT JOIN pg_attribute a
  ON a.attrelid = to_regclass('auth.users')
 AND a.attname = e.nome AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY e.nome;

ROLLBACK;
