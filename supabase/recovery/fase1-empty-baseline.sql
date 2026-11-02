-- RECUPERACAO DESTRUTIVA E LIMITADA. NAO EXECUTAR NA PREPARACAO/ETAPA B.
-- Exige autorizacao separada e baseline pre-migracao guardada e revista.
-- Remove SOMENTE a Fase 1 imediatamente apos o COMMIT, sem contas/dados novos.
-- Nao restaura backups, configuracoes Auth, ficheiros Storage ou o projecto.
-- O operador autorizado deve activar gestor.phase1_recovery='authorized'
-- na mesma sessao. A ausencia dessa confirmacao bloqueia este ficheiro.
BEGIN;

DO $$
BEGIN
  IF current_setting('gestor.phase1_recovery', true) IS DISTINCT FROM 'authorized' THEN
    RAISE EXCEPTION 'Recuperacao bloqueada: exige autorizacao separada e confirmacao do operador';
  END IF;
END $$;

-- Serializa com as mutacoes da aplicacao e impede contas concorrentes.
SELECT pg_advisory_xact_lock(109030);
LOCK TABLE auth.users IN SHARE MODE;
LOCK TABLE public.profiles, public.organizational_units, public.positions,
 public.user_positions, public.unit_responsibilities, public.reporting_lines,
 public.roles, public.permissions, public.role_permissions,
 public.user_role_assignments, public.delegations, public.cost_centers,
 public.integration_sources, public.external_identity_mappings,
 public.import_batches, public.audit_logs IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE t text; total bigint; fingerprint text;
BEGIN
  SELECT count(*) INTO total FROM auth.users;
  IF total <> 0 THEN RAISE EXCEPTION 'Recuperacao recusada: existem contas Auth'; END IF;
  IF EXISTS(SELECT 1 FROM storage.buckets) OR EXISTS(SELECT 1 FROM storage.objects) THEN
    RAISE EXCEPTION 'Recuperacao recusada: existe conteudo Storage fora do ambito vazio';
  END IF;
  FOREACH t IN ARRAY ARRAY[
    'profiles','organizational_units','positions','user_positions',
    'unit_responsibilities','reporting_lines','user_role_assignments',
    'delegations','cost_centers','integration_sources',
    'external_identity_mappings','import_batches','audit_logs'
  ] LOOP
    EXECUTE format('select count(*) from public.%I',t) INTO total;
    IF total <> 0 THEN
      RAISE EXCEPTION 'Recuperacao recusada: public.% contem dados',t;
    END IF;
  END LOOP;
  -- MD5 apenas compara os conteudos dos catalogos iniciais, sem segredos.
  -- As constantes foram calculadas a partir da migracao original inalterada.
  FOREACH t IN ARRAY ARRAY['roles','permissions','role_permissions'] LOOP
    EXECUTE format(
      'select md5(coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text),''[]''::jsonb)::text) from public.%I r',t
    ) INTO fingerprint;
    IF fingerprint IS DISTINCT FROM (CASE t
      WHEN 'roles' THEN '5dffea29ebbe4758e454989bf8229f9e'
      WHEN 'permissions' THEN '400d1c0b05bff133c63235410ae1105f'
      WHEN 'role_permissions' THEN '3ee96dffb7c53b2d8988882360a38148'
    END) THEN
      RAISE EXCEPTION 'Recuperacao recusada: catalogo public.% alterado',t;
    END IF;
  END LOOP;
END $$;

-- RESTRICT e intencional: qualquer dependencia adicional deve fazer falhar
-- a transaccao inteira. Nunca substituir por CASCADE para forcar o resultado.
DROP TRIGGER auth_user_profile ON auth.users RESTRICT;
-- As politicas da propria Fase 1 referenciam outras tabelas da Fase 1.
-- Remove-las explicitamente antes das tabelas evita CASCADE.
DROP POLICY profile_read ON public.profiles;
DROP POLICY unit_read ON public.organizational_units;
DROP POLICY position_read ON public.positions;
DROP POLICY membership_read ON public.user_positions;
DROP POLICY responsible_read ON public.unit_responsibilities;
DROP POLICY reporting_read ON public.reporting_lines;
DROP POLICY role_catalog_read ON public.roles;
DROP POLICY permission_catalog_read ON public.permissions;
DROP POLICY role_permission_read ON public.role_permissions;
DROP POLICY grants_read ON public.user_role_assignments;
DROP POLICY delegation_read ON public.delegations;
DROP POLICY cost_read ON public.cost_centers;
DROP POLICY audit_read ON public.audit_logs;
DROP TABLE public.audit_logs RESTRICT;
DROP TABLE public.import_batches RESTRICT;
DROP TABLE public.external_identity_mappings RESTRICT;
DROP TABLE public.integration_sources RESTRICT;
DROP TABLE public.cost_centers RESTRICT;
DROP TABLE public.delegations RESTRICT;
DROP TABLE public.user_role_assignments RESTRICT;
DROP TABLE public.role_permissions RESTRICT;
DROP TABLE public.permissions RESTRICT;
DROP TABLE public.roles RESTRICT;
DROP TABLE public.reporting_lines RESTRICT;
DROP TABLE public.unit_responsibilities RESTRICT;
DROP TABLE public.user_positions RESTRICT;
DROP TABLE public.positions RESTRICT;
DROP TABLE public.organizational_units RESTRICT;
DROP TABLE public.profiles RESTRICT;
DROP FUNCTION public.audit_invitation(text,text,uuid) RESTRICT;
DROP FUNCTION public.admin_mutation(text,jsonb) RESTRICT;
DROP FUNCTION public.record_audit() RESTRICT;
DROP FUNCTION public.protect_cost_tree() RESTRICT;
DROP FUNCTION public.protect_unit_tree() RESTRICT;
DROP FUNCTION public.handle_auth_user() RESTRICT;
DROP FUNCTION public.may_validate_activity(uuid[],uuid) RESTRICT;
DROP FUNCTION public.my_permissions() RESTRICT;
DROP FUNCTION public.visible_person(uuid,text) RESTRICT;
DROP FUNCTION public.has_permission(text,uuid) RESTRICT;
DROP FUNCTION public.in_unit_scope(uuid,uuid) RESTRICT;
DROP FUNCTION public.is_active_user() RESTRICT;
NOTIFY pgrst, 'reload schema';
COMMIT;
