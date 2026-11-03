-- GERADO por node scripts/generate-fase1-postflight.mjs; nao editar a referencia.
-- Migração original SHA-256: 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58
-- APENAS LEITURA. Nao reaplica a migracao nem chama RPCs da aplicacao.
-- Exportar a UNICA grelha completa para CSV, incluindo OK/REVER/BLOQUEIO/INFO.
-- Comparacoes de definicao podem exigir revisao de normalizacao entre versoes PG.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
WITH expected(kind,object,detail) AS (
 VALUES
 ('column','public.audit_logs.action','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.audit_logs.actor_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.audit_logs.after_data','{"type":"jsonb","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.audit_logs.before_data','{"type":"jsonb","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.audit_logs.created_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.audit_logs.entity_id','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.audit_logs.entity_type','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.audit_logs.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.audit_logs.unit_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.active','{"type":"boolean","identity":"","not_null":true,"generated":"","default_md5":"b326b5062b2f0e69046810717534cb09"}'::jsonb),
 ('column','public.cost_centers.code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.created_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.cost_centers.description','{"type":"text","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.external_id','{"type":"text","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.cost_centers.last_synced_at','{"type":"timestamp with time zone","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.name','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.parent_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.responsible_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.source_system','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":"1c86fb6219cabad38570bf1d10fc4e27"}'::jsonb),
 ('column','public.cost_centers.unit_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.cost_centers.updated_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.cost_centers.valid_from','{"type":"date","identity":"","not_null":true,"generated":"","default_md5":"c1ffc6281509068f27832c103f1235f2"}'::jsonb),
 ('column','public.cost_centers.valid_until','{"type":"date","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.delegations.from_user_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.delegations.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.delegations.permission_code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.delegations.scope_unit_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.delegations.to_user_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.delegations.valid_from','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.delegations.valid_until','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.external_identity_mappings.cost_center_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.external_identity_mappings.entity_type','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.external_identity_mappings.external_id','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.external_identity_mappings.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.external_identity_mappings.internal_id','{"type":"uuid","identity":"","not_null":false,"generated":"s","default_md5":"e17066d363176a877da840073862f0ea"}'::jsonb),
 ('column','public.external_identity_mappings.last_synced_at','{"type":"timestamp with time zone","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.external_identity_mappings.organizational_unit_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.external_identity_mappings.source_code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.external_identity_mappings.worker_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.import_batches.created_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.import_batches.created_by','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.import_batches.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.import_batches.report','{"type":"jsonb","identity":"","not_null":true,"generated":"","default_md5":"f3db357cf4f4a03883484fa3281a056c"}'::jsonb),
 ('column','public.import_batches.source_code','{"type":"text","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.import_batches.status','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.integration_sources.authoritative_for','{"type":"text[]","identity":"","not_null":true,"generated":"","default_md5":"f81a5133416544064d5b9b182f73a6e1"}'::jsonb),
 ('column','public.integration_sources.code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.integration_sources.description','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.organizational_units.active','{"type":"boolean","identity":"","not_null":true,"generated":"","default_md5":"b326b5062b2f0e69046810717534cb09"}'::jsonb),
 ('column','public.organizational_units.code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.organizational_units.created_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.organizational_units.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.organizational_units.kind','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.organizational_units.name','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.organizational_units.parent_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.organizational_units.updated_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.permissions.code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.permissions.description','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.positions.active','{"type":"boolean","identity":"","not_null":true,"generated":"","default_md5":"b326b5062b2f0e69046810717534cb09"}'::jsonb),
 ('column','public.positions.code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.positions.created_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.positions.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.positions.name','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.positions.updated_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.profiles.created_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.profiles.email','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.profiles.full_name','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.profiles.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.profiles.status','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":"186a391358656bb143bed327b3632761"}'::jsonb),
 ('column','public.profiles.updated_at','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.reporting_lines.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.reporting_lines.supervisor_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.reporting_lines.unit_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.reporting_lines.user_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.reporting_lines.valid_from','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.reporting_lines.valid_until','{"type":"timestamp with time zone","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.role_permissions.permission_code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.role_permissions.role_code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.roles.code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.roles.name','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.roles.technical','{"type":"boolean","identity":"","not_null":true,"generated":"","default_md5":"68934a3e9455fa72420237eb05902327"}'::jsonb),
 ('column','public.unit_responsibilities.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.unit_responsibilities.unit_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.unit_responsibilities.user_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.unit_responsibilities.valid_from','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.unit_responsibilities.valid_until','{"type":"timestamp with time zone","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_positions.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.user_positions.position_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_positions.unit_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_positions.user_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_positions.valid_from','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.user_positions.valid_until','{"type":"timestamp with time zone","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_role_assignments.granted_by','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_role_assignments.id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":"f3b72bb359a50b640590970a2ab8e514"}'::jsonb),
 ('column','public.user_role_assignments.role_code','{"type":"text","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_role_assignments.scope_unit_id','{"type":"uuid","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_role_assignments.user_id','{"type":"uuid","identity":"","not_null":true,"generated":"","default_md5":null}'::jsonb),
 ('column','public.user_role_assignments.valid_from','{"type":"timestamp with time zone","identity":"","not_null":true,"generated":"","default_md5":"75230039beb12ce952f24927f2bfa2f2"}'::jsonb),
 ('column','public.user_role_assignments.valid_until','{"type":"timestamp with time zone","identity":"","not_null":false,"generated":"","default_md5":null}'::jsonb),
 ('constraint','public.audit_logs.audit_logs_action_not_null','{"type":"n","validated":true,"definition":"NOT NULL action"}'::jsonb),
 ('constraint','public.audit_logs.audit_logs_created_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL created_at"}'::jsonb),
 ('constraint','public.audit_logs.audit_logs_entity_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL entity_id"}'::jsonb),
 ('constraint','public.audit_logs.audit_logs_entity_type_not_null','{"type":"n","validated":true,"definition":"NOT NULL entity_type"}'::jsonb),
 ('constraint','public.audit_logs.audit_logs_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.audit_logs.audit_logs_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_active_not_null','{"type":"n","validated":true,"definition":"NOT NULL active"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_check','{"type":"c","validated":true,"definition":"CHECK (valid_until IS NULL OR valid_until >= valid_from)"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_code_check','{"type":"c","validated":true,"definition":"CHECK (length(code) >= 1 AND length(code) <= 80 AND code = TRIM(BOTH FROM code))"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_code_key','{"type":"u","validated":true,"definition":"UNIQUE (code)"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL code"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_created_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL created_at"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_name_not_null','{"type":"n","validated":true,"definition":"NOT NULL name"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_parent_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (parent_id) REFERENCES cost_centers(id)"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_responsible_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (responsible_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_source_system_not_null','{"type":"n","validated":true,"definition":"NOT NULL source_system"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_unit_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (unit_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_updated_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL updated_at"}'::jsonb),
 ('constraint','public.cost_centers.cost_centers_valid_from_not_null','{"type":"n","validated":true,"definition":"NOT NULL valid_from"}'::jsonb),
 ('constraint','public.delegations.delegations_check','{"type":"c","validated":true,"definition":"CHECK (from_user_id <> to_user_id)"}'::jsonb),
 ('constraint','public.delegations.delegations_check1','{"type":"c","validated":true,"definition":"CHECK (valid_until > valid_from)"}'::jsonb),
 ('constraint','public.delegations.delegations_from_user_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (from_user_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.delegations.delegations_from_user_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL from_user_id"}'::jsonb),
 ('constraint','public.delegations.delegations_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.delegations.delegations_permission_code_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (permission_code) REFERENCES permissions(code)"}'::jsonb),
 ('constraint','public.delegations.delegations_permission_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL permission_code"}'::jsonb),
 ('constraint','public.delegations.delegations_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.delegations.delegations_scope_unit_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (scope_unit_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.delegations.delegations_scope_unit_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL scope_unit_id"}'::jsonb),
 ('constraint','public.delegations.delegations_to_user_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (to_user_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.delegations.delegations_to_user_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL to_user_id"}'::jsonb),
 ('constraint','public.delegations.delegations_valid_from_not_null','{"type":"n","validated":true,"definition":"NOT NULL valid_from"}'::jsonb),
 ('constraint','public.delegations.delegations_valid_until_not_null','{"type":"n","validated":true,"definition":"NOT NULL valid_until"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_check','{"type":"c","validated":true,"definition":"CHECK (num_nonnulls(cost_center_id, organizational_unit_id, worker_id) = 1)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_check1','{"type":"c","validated":true,"definition":"CHECK (entity_type = ''cost_center''::text AND cost_center_id IS NOT NULL OR entity_type = ''organizational_unit''::text AND organizational_unit_id IS NOT NULL OR entity_type = ''worker''::text AND worker_id IS NOT NULL)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_cost_center_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_entity_type_check','{"type":"c","validated":true,"definition":"CHECK (entity_type = ANY (ARRAY[''cost_center''::text, ''organizational_unit''::text, ''worker''::text]))"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_entity_type_not_null','{"type":"n","validated":true,"definition":"NOT NULL entity_type"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_external_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL external_id"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_organizational_unit_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (organizational_unit_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_source_code_entity_type_external_key','{"type":"u","validated":true,"definition":"UNIQUE (source_code, entity_type, external_id)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_source_code_entity_type_internal_key','{"type":"u","validated":true,"definition":"UNIQUE (source_code, entity_type, internal_id)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_source_code_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (source_code) REFERENCES integration_sources(code)"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_source_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL source_code"}'::jsonb),
 ('constraint','public.external_identity_mappings.external_identity_mappings_worker_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (worker_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.import_batches.import_batches_created_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL created_at"}'::jsonb),
 ('constraint','public.import_batches.import_batches_created_by_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (created_by) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.import_batches.import_batches_created_by_not_null','{"type":"n","validated":true,"definition":"NOT NULL created_by"}'::jsonb),
 ('constraint','public.import_batches.import_batches_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.import_batches.import_batches_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.import_batches.import_batches_report_not_null','{"type":"n","validated":true,"definition":"NOT NULL report"}'::jsonb),
 ('constraint','public.import_batches.import_batches_source_code_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (source_code) REFERENCES integration_sources(code)"}'::jsonb),
 ('constraint','public.import_batches.import_batches_status_check','{"type":"c","validated":true,"definition":"CHECK (status = ANY (ARRAY[''staged''::text, ''validated''::text, ''applied''::text, ''rejected''::text, ''reverted''::text]))"}'::jsonb),
 ('constraint','public.import_batches.import_batches_status_not_null','{"type":"n","validated":true,"definition":"NOT NULL status"}'::jsonb),
 ('constraint','public.integration_sources.integration_sources_authoritative_for_not_null','{"type":"n","validated":true,"definition":"NOT NULL authoritative_for"}'::jsonb),
 ('constraint','public.integration_sources.integration_sources_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL code"}'::jsonb),
 ('constraint','public.integration_sources.integration_sources_description_not_null','{"type":"n","validated":true,"definition":"NOT NULL description"}'::jsonb),
 ('constraint','public.integration_sources.integration_sources_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (code)"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_active_not_null','{"type":"n","validated":true,"definition":"NOT NULL active"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_check','{"type":"c","validated":true,"definition":"CHECK (kind = ''company''::text AND parent_id IS NULL OR kind <> ''company''::text AND parent_id IS NOT NULL)"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_code_check','{"type":"c","validated":true,"definition":"CHECK (length(TRIM(BOTH FROM code)) >= 1 AND length(TRIM(BOTH FROM code)) <= 60)"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_code_key','{"type":"u","validated":true,"definition":"UNIQUE (code)"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL code"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_created_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL created_at"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_kind_check','{"type":"c","validated":true,"definition":"CHECK (kind = ANY (ARRAY[''company''::text, ''direction''::text, ''department''::text, ''section''::text, ''team''::text, ''other''::text]))"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_kind_not_null','{"type":"n","validated":true,"definition":"NOT NULL kind"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_name_check','{"type":"c","validated":true,"definition":"CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 160)"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_name_not_null','{"type":"n","validated":true,"definition":"NOT NULL name"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_parent_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (parent_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.organizational_units.organizational_units_updated_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL updated_at"}'::jsonb),
 ('constraint','public.permissions.permissions_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL code"}'::jsonb),
 ('constraint','public.permissions.permissions_description_not_null','{"type":"n","validated":true,"definition":"NOT NULL description"}'::jsonb),
 ('constraint','public.permissions.permissions_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (code)"}'::jsonb),
 ('constraint','public.positions.positions_active_not_null','{"type":"n","validated":true,"definition":"NOT NULL active"}'::jsonb),
 ('constraint','public.positions.positions_code_check','{"type":"c","validated":true,"definition":"CHECK (length(code) >= 1 AND length(code) <= 60 AND code = TRIM(BOTH FROM code))"}'::jsonb),
 ('constraint','public.positions.positions_code_key','{"type":"u","validated":true,"definition":"UNIQUE (code)"}'::jsonb),
 ('constraint','public.positions.positions_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL code"}'::jsonb),
 ('constraint','public.positions.positions_created_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL created_at"}'::jsonb),
 ('constraint','public.positions.positions_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.positions.positions_name_check','{"type":"c","validated":true,"definition":"CHECK (length(name) >= 1 AND length(name) <= 160)"}'::jsonb),
 ('constraint','public.positions.positions_name_not_null','{"type":"n","validated":true,"definition":"NOT NULL name"}'::jsonb),
 ('constraint','public.positions.positions_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.positions.positions_updated_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL updated_at"}'::jsonb),
 ('constraint','public.profiles.profiles_created_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL created_at"}'::jsonb),
 ('constraint','public.profiles.profiles_email_not_null','{"type":"n","validated":true,"definition":"NOT NULL email"}'::jsonb),
 ('constraint','public.profiles.profiles_full_name_check','{"type":"c","validated":true,"definition":"CHECK (length(full_name) >= 1 AND length(full_name) <= 160)"}'::jsonb),
 ('constraint','public.profiles.profiles_full_name_not_null','{"type":"n","validated":true,"definition":"NOT NULL full_name"}'::jsonb),
 ('constraint','public.profiles.profiles_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (id) REFERENCES auth.users(id)"}'::jsonb),
 ('constraint','public.profiles.profiles_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.profiles.profiles_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.profiles.profiles_status_check','{"type":"c","validated":true,"definition":"CHECK (status = ANY (ARRAY[''active''::text, ''inactive''::text, ''suspended''::text]))"}'::jsonb),
 ('constraint','public.profiles.profiles_status_not_null','{"type":"n","validated":true,"definition":"NOT NULL status"}'::jsonb),
 ('constraint','public.profiles.profiles_updated_at_not_null','{"type":"n","validated":true,"definition":"NOT NULL updated_at"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_check','{"type":"c","validated":true,"definition":"CHECK (user_id <> supervisor_id)"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_check1','{"type":"c","validated":true,"definition":"CHECK (valid_until IS NULL OR valid_until >= valid_from)"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_supervisor_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (supervisor_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_supervisor_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL supervisor_id"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_unit_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (unit_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_unit_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL unit_id"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_user_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_user_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL user_id"}'::jsonb),
 ('constraint','public.reporting_lines.reporting_lines_valid_from_not_null','{"type":"n","validated":true,"definition":"NOT NULL valid_from"}'::jsonb),
 ('constraint','public.role_permissions.role_permissions_permission_code_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (permission_code) REFERENCES permissions(code)"}'::jsonb),
 ('constraint','public.role_permissions.role_permissions_permission_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL permission_code"}'::jsonb),
 ('constraint','public.role_permissions.role_permissions_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (role_code, permission_code)"}'::jsonb),
 ('constraint','public.role_permissions.role_permissions_role_code_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (role_code) REFERENCES roles(code)"}'::jsonb),
 ('constraint','public.role_permissions.role_permissions_role_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL role_code"}'::jsonb),
 ('constraint','public.roles.roles_code_check','{"type":"c","validated":true,"definition":"CHECK (code ~ ''^[a-z][a-z0-9_.-]{1,59}$''::text)"}'::jsonb),
 ('constraint','public.roles.roles_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL code"}'::jsonb),
 ('constraint','public.roles.roles_name_check','{"type":"c","validated":true,"definition":"CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 160)"}'::jsonb),
 ('constraint','public.roles.roles_name_not_null','{"type":"n","validated":true,"definition":"NOT NULL name"}'::jsonb),
 ('constraint','public.roles.roles_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (code)"}'::jsonb),
 ('constraint','public.roles.roles_technical_not_null','{"type":"n","validated":true,"definition":"NOT NULL technical"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_check','{"type":"c","validated":true,"definition":"CHECK (valid_until IS NULL OR valid_until >= valid_from)"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_unit_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (unit_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_unit_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL unit_id"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_user_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_user_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL user_id"}'::jsonb),
 ('constraint','public.unit_responsibilities.unit_responsibilities_valid_from_not_null','{"type":"n","validated":true,"definition":"NOT NULL valid_from"}'::jsonb),
 ('constraint','public.user_positions.user_positions_check','{"type":"c","validated":true,"definition":"CHECK (valid_until IS NULL OR valid_until >= valid_from)"}'::jsonb),
 ('constraint','public.user_positions.user_positions_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.user_positions.user_positions_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.user_positions.user_positions_position_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (position_id) REFERENCES positions(id)"}'::jsonb),
 ('constraint','public.user_positions.user_positions_position_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL position_id"}'::jsonb),
 ('constraint','public.user_positions.user_positions_unit_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (unit_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.user_positions.user_positions_unit_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL unit_id"}'::jsonb),
 ('constraint','public.user_positions.user_positions_user_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.user_positions.user_positions_user_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL user_id"}'::jsonb),
 ('constraint','public.user_positions.user_positions_valid_from_not_null','{"type":"n","validated":true,"definition":"NOT NULL valid_from"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_check','{"type":"c","validated":true,"definition":"CHECK (valid_until IS NULL OR valid_until >= valid_from)"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_granted_by_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (granted_by) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL id"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_pkey','{"type":"p","validated":true,"definition":"PRIMARY KEY (id)"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_role_code_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (role_code) REFERENCES roles(code)"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_role_code_not_null','{"type":"n","validated":true,"definition":"NOT NULL role_code"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_scope_unit_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (scope_unit_id) REFERENCES organizational_units(id)"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_user_id_fkey','{"type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES profiles(id)"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_user_id_not_null','{"type":"n","validated":true,"definition":"NOT NULL user_id"}'::jsonb),
 ('constraint','public.user_role_assignments.user_role_assignments_valid_from_not_null','{"type":"n","validated":true,"definition":"NOT NULL valid_from"}'::jsonb),
 ('function','public.admin_mutation(text, jsonb)','{"owner":"postgres","config":["search_path=\"\""],"result":"void","definer":true,"arguments":"operation text, payload jsonb","source_md5":"1bce1ebfd15a16e392af368f638b8603","volatility":"v"}'::jsonb),
 ('function','public.audit_invitation(text, text, uuid)','{"owner":"postgres","config":["search_path=\"\""],"result":"void","definer":true,"arguments":"email text, stage text, invited_user uuid DEFAULT NULL::uuid","source_md5":"10db0520ae7c019f5c1c92a122db2f14","volatility":"v"}'::jsonb),
 ('function','public.handle_auth_user()','{"owner":"postgres","config":["search_path=\"\""],"result":"trigger","definer":true,"arguments":"","source_md5":"41fab9f6fe598fed270624a6863d16f7","volatility":"v"}'::jsonb),
 ('function','public.has_permission(text, uuid)','{"owner":"postgres","config":["search_path=\"\""],"result":"boolean","definer":true,"arguments":"required text, target uuid DEFAULT NULL::uuid","source_md5":"80df2a5e9102572757d9e338745abb05","volatility":"s"}'::jsonb),
 ('function','public.in_unit_scope(uuid, uuid)','{"owner":"postgres","config":["search_path=\"\""],"result":"boolean","definer":true,"arguments":"target uuid, scope uuid","source_md5":"fbd474bd92059cbba9815cfc8874a2f9","volatility":"s"}'::jsonb),
 ('function','public.is_active_user()','{"owner":"postgres","config":["search_path=\"\""],"result":"boolean","definer":true,"arguments":"","source_md5":"b03f24aba18ee8d917bbf44a6ed8616a","volatility":"s"}'::jsonb),
 ('function','public.may_validate_activity(uuid[], uuid)','{"owner":"postgres","config":["search_path=\"\""],"result":"boolean","definer":true,"arguments":"executors uuid[], target uuid","source_md5":"4a76317a68076d443fd64a6bb278b73c","volatility":"s"}'::jsonb),
 ('function','public.my_permissions()','{"owner":"postgres","config":["search_path=\"\""],"result":"text[]","definer":true,"arguments":"","source_md5":"542ad4cb5f16cdef72cc666c4520c97b","volatility":"s"}'::jsonb),
 ('function','public.protect_cost_tree()','{"owner":"postgres","config":["search_path=\"\""],"result":"trigger","definer":true,"arguments":"","source_md5":"98f64b300581b00a7cc39bae34aa93f2","volatility":"v"}'::jsonb),
 ('function','public.protect_unit_tree()','{"owner":"postgres","config":["search_path=\"\""],"result":"trigger","definer":true,"arguments":"","source_md5":"c40c6d08855b42355fbaa10417d6273a","volatility":"v"}'::jsonb),
 ('function','public.record_audit()','{"owner":"postgres","config":["search_path=\"\""],"result":"trigger","definer":true,"arguments":"","source_md5":"fee924fb5e6315db63d5696c1bece7d6","volatility":"v"}'::jsonb),
 ('function','public.visible_person(uuid, text)','{"owner":"postgres","config":["search_path=\"\""],"result":"boolean","definer":true,"arguments":"target uuid, required text","source_md5":"681447c73e4be9b16ecdf06fcce57321","volatility":"s"}'::jsonb),
 ('index','public.audit_created','{"ready":true,"valid":true,"definition":"CREATE INDEX audit_created ON public.audit_logs USING btree (created_at DESC)"}'::jsonb),
 ('index','public.audit_logs_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)"}'::jsonb),
 ('index','public.cost_centers_code_key','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX cost_centers_code_key ON public.cost_centers USING btree (code)"}'::jsonb),
 ('index','public.cost_centers_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX cost_centers_pkey ON public.cost_centers USING btree (id)"}'::jsonb),
 ('index','public.cost_external_identity','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX cost_external_identity ON public.cost_centers USING btree (source_system, external_id) WHERE (external_id IS NOT NULL)"}'::jsonb),
 ('index','public.cost_parent','{"ready":true,"valid":true,"definition":"CREATE INDEX cost_parent ON public.cost_centers USING btree (parent_id)"}'::jsonb),
 ('index','public.current_reporting_line','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX current_reporting_line ON public.reporting_lines USING btree (user_id) WHERE (valid_until IS NULL)"}'::jsonb),
 ('index','public.current_unit_responsible','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX current_unit_responsible ON public.unit_responsibilities USING btree (unit_id) WHERE (valid_until IS NULL)"}'::jsonb),
 ('index','public.current_user_position','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX current_user_position ON public.user_positions USING btree (user_id) WHERE (valid_until IS NULL)"}'::jsonb),
 ('index','public.delegations_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX delegations_pkey ON public.delegations USING btree (id)"}'::jsonb),
 ('index','public.external_identity_mappings_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX external_identity_mappings_pkey ON public.external_identity_mappings USING btree (id)"}'::jsonb),
 ('index','public.external_identity_mappings_source_code_entity_type_external_key','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX external_identity_mappings_source_code_entity_type_external_key ON public.external_identity_mappings USING btree (source_code, entity_type, external_id)"}'::jsonb),
 ('index','public.external_identity_mappings_source_code_entity_type_internal_key','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX external_identity_mappings_source_code_entity_type_internal_key ON public.external_identity_mappings USING btree (source_code, entity_type, internal_id)"}'::jsonb),
 ('index','public.import_batches_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX import_batches_pkey ON public.import_batches USING btree (id)"}'::jsonb),
 ('index','public.integration_sources_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX integration_sources_pkey ON public.integration_sources USING btree (code)"}'::jsonb),
 ('index','public.one_company','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX one_company ON public.organizational_units USING btree (kind) WHERE (kind = ''company''::text)"}'::jsonb),
 ('index','public.organizational_units_code_key','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX organizational_units_code_key ON public.organizational_units USING btree (code)"}'::jsonb),
 ('index','public.organizational_units_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX organizational_units_pkey ON public.organizational_units USING btree (id)"}'::jsonb),
 ('index','public.permissions_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (code)"}'::jsonb),
 ('index','public.positions_code_key','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX positions_code_key ON public.positions USING btree (code)"}'::jsonb),
 ('index','public.positions_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX positions_pkey ON public.positions USING btree (id)"}'::jsonb),
 ('index','public.positions_unit','{"ready":true,"valid":true,"definition":"CREATE INDEX positions_unit ON public.user_positions USING btree (unit_id, user_id)"}'::jsonb),
 ('index','public.profiles_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"}'::jsonb),
 ('index','public.reporting_lines_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX reporting_lines_pkey ON public.reporting_lines USING btree (id)"}'::jsonb),
 ('index','public.role_assignments_user','{"ready":true,"valid":true,"definition":"CREATE INDEX role_assignments_user ON public.user_role_assignments USING btree (user_id, scope_unit_id)"}'::jsonb),
 ('index','public.role_permissions_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (role_code, permission_code)"}'::jsonb),
 ('index','public.roles_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (code)"}'::jsonb),
 ('index','public.unit_responsibilities_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX unit_responsibilities_pkey ON public.unit_responsibilities USING btree (id)"}'::jsonb),
 ('index','public.units_parent','{"ready":true,"valid":true,"definition":"CREATE INDEX units_parent ON public.organizational_units USING btree (parent_id)"}'::jsonb),
 ('index','public.user_positions_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX user_positions_pkey ON public.user_positions USING btree (id)"}'::jsonb),
 ('index','public.user_role_assignments_pkey','{"ready":true,"valid":true,"definition":"CREATE UNIQUE INDEX user_role_assignments_pkey ON public.user_role_assignments USING btree (id)"}'::jsonb),
 ('policy','public.audit_logs.audit_read','{"check":null,"roles":["authenticated"],"using":"has_permission(''audit.read''::text, unit_id)","command":"r","permissive":true}'::jsonb),
 ('policy','public.cost_centers.cost_read','{"check":null,"roles":["authenticated"],"using":"has_permission(''cost_centers.read''::text, unit_id)","command":"r","permissive":true}'::jsonb),
 ('policy','public.delegations.delegation_read','{"check":null,"roles":["authenticated"],"using":"(is_active_user() AND ((from_user_id = auth.uid()) OR (to_user_id = auth.uid()) OR has_permission(''access.manage''::text, scope_unit_id)))","command":"r","permissive":true}'::jsonb),
 ('policy','public.organizational_units.unit_read','{"check":null,"roles":["authenticated"],"using":"(has_permission(''org.read''::text, id) OR has_permission(''org.manage''::text, id) OR (is_active_user() AND (EXISTS ( SELECT 1\n   FROM user_positions p\n  WHERE ((p.user_id = auth.uid()) AND (p.unit_id = organizational_units.id) AND (p.valid_until IS NULL))))))","command":"r","permissive":true}'::jsonb),
 ('policy','public.permissions.permission_catalog_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'::jsonb),
 ('policy','public.positions.position_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'::jsonb),
 ('policy','public.profiles.profile_read','{"check":null,"roles":["authenticated"],"using":"((id = auth.uid()) OR visible_person(id, ''users.read''::text))","command":"r","permissive":true}'::jsonb),
 ('policy','public.reporting_lines.reporting_read','{"check":null,"roles":["authenticated"],"using":"(((user_id = auth.uid()) AND is_active_user()) OR has_permission(''org.read''::text, unit_id))","command":"r","permissive":true}'::jsonb),
 ('policy','public.role_permissions.role_permission_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'::jsonb),
 ('policy','public.roles.role_catalog_read','{"check":null,"roles":["authenticated"],"using":"is_active_user()","command":"r","permissive":true}'::jsonb),
 ('policy','public.unit_responsibilities.responsible_read','{"check":null,"roles":["authenticated"],"using":"has_permission(''org.read''::text, unit_id)","command":"r","permissive":true}'::jsonb),
 ('policy','public.user_positions.membership_read','{"check":null,"roles":["authenticated"],"using":"(((user_id = auth.uid()) AND is_active_user()) OR has_permission(''org.read''::text, unit_id) OR has_permission(''users.read''::text, unit_id))","command":"r","permissive":true}'::jsonb),
 ('policy','public.user_role_assignments.grants_read','{"check":null,"roles":["authenticated"],"using":"(((user_id = auth.uid()) AND is_active_user()) OR has_permission(''access.manage''::text, scope_unit_id))","command":"r","permissive":true}'::jsonb),
 ('table','public.audit_logs','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.cost_centers','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.delegations','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.external_identity_mappings','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.import_batches','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.integration_sources','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.organizational_units','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.permissions','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.positions','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.profiles','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.reporting_lines','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.role_permissions','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.roles','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.unit_responsibilities','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.user_positions','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('table','public.user_role_assignments','{"rls":true,"kind":"r","owner":"postgres","force_rls":false}'::jsonb),
 ('trigger','auth.users.auth_user_profile','{"enabled":"O","definition":"CREATE TRIGGER auth_user_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_auth_user()"}'::jsonb),
 ('trigger','public.cost_centers.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON cost_centers FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.cost_centers.cost_tree','{"enabled":"O","definition":"CREATE TRIGGER cost_tree BEFORE INSERT OR UPDATE ON cost_centers FOR EACH ROW EXECUTE FUNCTION protect_cost_tree()"}'::jsonb),
 ('trigger','public.delegations.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON delegations FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.external_identity_mappings.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON external_identity_mappings FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.import_batches.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON import_batches FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.integration_sources.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON integration_sources FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.organizational_units.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON organizational_units FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.organizational_units.unit_tree','{"enabled":"O","definition":"CREATE TRIGGER unit_tree BEFORE INSERT OR UPDATE ON organizational_units FOR EACH ROW EXECUTE FUNCTION protect_unit_tree()"}'::jsonb),
 ('trigger','public.positions.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.profiles.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.reporting_lines.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON reporting_lines FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.role_permissions.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.roles.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.unit_responsibilities.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON unit_responsibilities FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.user_positions.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON user_positions FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb),
 ('trigger','public.user_role_assignments.audit_changes','{"enabled":"O","definition":"CREATE TRIGGER audit_changes AFTER INSERT OR DELETE OR UPDATE ON user_role_assignments FOR EACH ROW EXECUTE FUNCTION record_audit()"}'::jsonb)
), observed_catalog AS (

WITH relations AS (
 SELECT c.*,n.nspname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
), records AS (
 SELECT 'table'::text AS kind, 'public.'||c.relname AS object,
 jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,
   'force_rls',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner)) AS detail
 FROM relations c
 UNION ALL
 SELECT 'column','public.'||c.relname||'.'||a.attname,
 jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,
   'generated',a.attgenerated,'identity',a.attidentity,
   'default_md5',md5(pg_get_expr(d.adbin,d.adrelid)))
 FROM relations c JOIN pg_attribute a ON a.attrelid=c.oid
 LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 WHERE a.attnum>0 AND NOT a.attisdropped
 UNION ALL
 SELECT 'constraint','public.'||c.relname||'.'||k.conname,
 jsonb_build_object('type',k.contype,'validated',k.convalidated,
   'definition',pg_get_constraintdef(k.oid,true))
 FROM relations c JOIN pg_constraint k ON k.conrelid=c.oid
 UNION ALL
 SELECT 'index','public.'||ic.relname,
 jsonb_build_object('definition',pg_get_indexdef(i.indexrelid),
   'valid',i.indisvalid,'ready',i.indisready)
 FROM relations c JOIN pg_index i ON i.indrelid=c.oid
 JOIN pg_class ic ON ic.oid=i.indexrelid
 UNION ALL
 SELECT 'policy','public.'||c.relname||'.'||p.polname,
 jsonb_build_object('command',p.polcmd,'permissive',p.polpermissive,
   'roles',(SELECT jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_get_userbyid(r) END
     ORDER BY r) FROM unnest(p.polroles) r),
   'using',pg_get_expr(p.polqual,p.polrelid),
   'check',pg_get_expr(p.polwithcheck,p.polrelid))
 FROM relations c JOIN pg_policy p ON p.polrelid=c.oid
 UNION ALL
 SELECT 'function',n.nspname||'.'||p.proname||'('||oidvectortypes(p.proargtypes)||')',
 jsonb_build_object('owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,
   'volatility',p.provolatile,'config',p.proconfig,'source_md5',md5(p.prosrc),
   'arguments',pg_get_function_arguments(p.oid),'result',pg_get_function_result(p.oid))
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind IN ('f','p')
 UNION ALL
 SELECT 'trigger',n.nspname||'.'||c.relname||'.'||t.tgname,
 jsonb_build_object('enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true))
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE NOT t.tgisinternal AND (n.nspname='public' OR
   (n.nspname='auth' AND c.relname='users'))
)
SELECT kind,object,detail FROM records ORDER BY kind,object
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
 'source_md5',md5(p.prosrc),
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
