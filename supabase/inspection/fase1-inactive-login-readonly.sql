-- APENAS LEITURA: executar no SQL Editor do projecto de desenvolvimento.
-- Substituir o marcador pelo email AT privadamente; não guardar o valor no Git.
-- SET LOCAL ROLE escolhe o executor SQL desta transacção. Não atribui papéis
-- à conta AT. set_config(...,true) só prepara contexto local, sem JWT real.
-- Não executar em terminal Bash. Não contém GRANT, DDL ou mutações de dados.
BEGIN TRANSACTION READ ONLY;

SELECT
  set_config('request.jwt.claim.sub',
    (SELECT id::text FROM auth.users
     WHERE lower(email)=lower('EMAIL_AT_A_SUBSTITUIR_PRIVADAMENTE')),true) IS NOT NULL
    AS sujeito_preparado,
  set_config('request.jwt.claims',
    (SELECT json_build_object('sub',id,'role','authenticated')::text FROM auth.users
     WHERE lower(email)=lower('EMAIL_AT_A_SUBSTITUIR_PRIVADAMENTE')),true) IS NOT NULL
    AS contexto_preparado,
  set_config('gestor.readonly.roles_total',
    (SELECT count(*)::text FROM public.roles),true) IS NOT NULL AS controlo_papeis,
  set_config('gestor.readonly.permissions_total',
    (SELECT count(*)::text FROM public.permissions),true) IS NOT NULL AS controlo_permissoes;

SET LOCAL ROLE authenticated;

SELECT
  current_user='authenticated' AS contexto_authenticated,
  (SELECT NOT (rolsuper OR rolbypassrls) FROM pg_roles WHERE rolname=current_user)
    AS executor_sem_bypass,
  auth.uid() IS NOT NULL AS sujeito_presente,
  (SELECT count(*) FROM public.profiles WHERE id=auth.uid()) AS perfil_proprio_linhas,
  coalesce((SELECT bool_and(status='inactive') FROM public.profiles WHERE id=auth.uid()),false)
    AS perfil_proprio_inactive,
  public.is_active_user() AS utilizador_activo,
  cardinality(public.my_permissions()) AS permissoes_efectivas,
  current_setting('gestor.readonly.roles_total')::integer AS catalogo_papeis_total,
  (SELECT count(*) FROM public.roles) AS papeis_visiveis,
  current_setting('gestor.readonly.permissions_total')::integer AS catalogo_permissoes_total,
  (SELECT count(*) FROM public.permissions) AS permissoes_visiveis,
  (SELECT count(*) FROM public.organizational_units) AS estrutura_visivel,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname IN (
     'profiles','organizational_units','positions','user_positions','unit_responsibilities',
     'reporting_lines','roles','permissions','role_permissions','user_role_assignments',
     'delegations','cost_centers','integration_sources','external_identity_mappings',
     'import_batches','audit_logs')) AS tabelas_encontradas,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relrowsecurity AND c.relname IN (
     'profiles','organizational_units','positions','user_positions','unit_responsibilities',
     'reporting_lines','roles','permissions','role_permissions','user_role_assignments',
     'delegations','cost_centers','integration_sources','external_identity_mappings',
     'import_batches','audit_logs')) AS tabelas_com_rls;

ROLLBACK;
