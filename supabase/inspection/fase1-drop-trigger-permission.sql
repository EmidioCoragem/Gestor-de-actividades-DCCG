-- Apenas leitura de uma configuracao nao secreta de autorizacao Supautils.
-- Nao altera configuracoes, nao adquire locks e nao remove triggers.
-- NULL ou erro de permissao nao provam que DROP TRIGGER esteja autorizado.
BEGIN TRANSACTION READ ONLY;
SELECT current_user AS operador,
       current_setting('supautils.drop_trigger_grants', true) AS drop_trigger_grants;
ROLLBACK;
