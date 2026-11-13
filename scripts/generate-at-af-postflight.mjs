// Gerador textual: nao inicia PostgreSQL/PGlite nem executa qualquer SQL.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const EXPECTED_HASHES = Object.freeze({
  original: "56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58",
  incremental: "fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5",
  baselineChecker: "2071f820ddccb899f7150d4593543a5bebf3a8d91e457db167972db184003c5b",
});
const sha = (value) => createHash("sha256").update(value).digest("hex");
// Nao depender de standard_conforming_strings ao serializar JSON com escapes.
const quote = (value) => String(value).split("\\").map((part) => "'" + part.replaceAll("'", "''") + "'").join("||pg_catalog.chr(92)||");
const values = (rows) => rows.map((row) => " (" + row.map((value) =>
  value === null ? "NULL" : typeof value === "boolean" || typeof value === "number" ? String(value) : quote(value),
).join(",") + ")").join(",\n");

// Guard lexical conservador, nao um parser PostgreSQL nem uma sandbox SQL.
// Rejeita instrucoes extra, funcoes nao aprovadas e CTEs modificadoras.
export function assertSelectOnly(sql) {
  const tokens = [];
  let index = 0;
  while (index < sql.length) {
    if (/\s/.test(sql[index])) { index++; continue; }
    if (sql.startsWith("--", index)) {
      const end = sql.indexOf("\n", index + 2);
      index = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (sql.startsWith("/*", index)) {
      index += 2;
      let depth = 1;
      while (index < sql.length && depth) {
        if (sql.startsWith("/*", index)) { depth++; index += 2; }
        else if (sql.startsWith("*/", index)) { depth--; index += 2; }
        else index++;
      }
      if (depth) throw new Error("Comentario SQL incompleto.");
      continue;
    }
    if (sql[index] === "'") {
      index++;
      let closed = false;
      while (index < sql.length) {
        if (sql[index] === "\\") throw new Error("Escape SQL nao permitido no artefacto.");
        if (sql[index] === "'") {
          if (sql[index + 1] === "'") { index += 2; continue; }
          index++; closed = true; break;
        }
        index++;
      }
      if (!closed) throw new Error("Literal SQL incompleto.");
      tokens.push("literal");
      continue;
    }
    if (sql[index] === '"' || sql[index] === "$" || sql[index] === "\\")
      throw new Error("Identificador, dollar quote ou metacomando nao permitido.");
    const word = /^[A-Za-z_][A-Za-z_0-9]*/.exec(sql.slice(index));
    if (word) { tokens.push(word[0].toLowerCase()); index += word[0].length; }
    else { tokens.push(sql[index]); index++; }
  }
  if (tokens[0] !== "with" || tokens.at(-1) !== ";" || tokens.filter((token) => token === ";").length !== 1)
    throw new Error("Exigir uma unica instrucao WITH ... SELECT.");
  const forbidden = new Set(["insert", "update", "delete", "merge", "create", "alter", "drop", "do", "call", "copy", "set", "reset", "notify", "listen", "unlisten", "truncate", "grant", "revoke", "vacuum", "analyze", "refresh", "reindex", "cluster", "begin", "commit", "rollback", "lock", "into", "execute", "prepare", "explain", "for", "discard", "load"]);
  const builtins = new Set(["count", "bool_and", "bool_or", "array_agg", "jsonb_agg", "jsonb_build_object", "to_jsonb", "encode", "sha256", "convert_to", "replace", "chr", "pg_get_expr", "pg_get_function_arguments", "pg_get_function_result", "pg_get_userbyid", "oidvectortypes", "to_regclass", "to_regtype", "has_table_privilege", "has_column_privilege", "has_function_privilege", "has_schema_privilege", "has_parameter_privilege", "pg_has_role", "aclexplode", "acldefault", "unnest", "current_setting", "tstzrange"]);
  const syntax = new Set(["as", "in", "exists", "not", "filter", "coalesce", "nullif", "values", "select", "where", "and", "or", "on", "when", "then", "else", "from", "join"]);
  const castTypes = new Set(["text", "jsonb", "bigint", "int8", "regclass", "uuid"]);
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (forbidden.has(token)) throw new Error("Instrucao SQL nao permitida: " + token);
    if (token === ":" && tokens[i + 1] === ":") {
      const qualified = tokens[i + 2] === "pg_catalog" && tokens[i + 3] === ".";
      const type = tokens[i + (qualified ? 4 : 2)];
      if (!castTypes.has(type) || (!qualified && tokens[i + 3] === "."))
        throw new Error("Cast SQL nao aprovado.");
    }
    if (/^[a-z_]/.test(token) && tokens[i + 1] === "(") {
      if (token === "literal") continue;
      if (tokens[i - 1] === ".") {
        if (tokens[i - 2] !== "pg_catalog" || !builtins.has(token))
          throw new Error("Funcao SQL nao aprovada: " + token);
      } else if (!syntax.has(token) && !(depth === 0 && ["with", ","].includes(tokens[i - 1])) &&
        !(token === "v" && tokens[i - 1] === "as" && tokens[i + 2] === "privilege_name" && tokens[i + 3] === ")")) {
        throw new Error("Chamada SQL nao qualificada: " + token);
      }
    }
    if (token === "(") depth++;
    if (token === ")") depth--;
    if (depth < 0) throw new Error("Parenteses SQL invalidos.");
  }
  if (depth !== 0) throw new Error("Parenteses SQL incompletos.");
  return true;
}

function parseFunctions(source, original) {
  const definitions = [];
  const pattern = /create function (public|gestor_security)\.([a-z_]+)\(([\s\S]*?)\) returns ([a-z]+(?:\[\])?)\s+language (sql|plpgsql)([\s\S]*?) as \$\$([\s\S]*?)\$\$;/g;
  for (const match of source.matchAll(pattern)) {
    const [, schema, name, rawArguments, result, language, options, body] = match;
    const args = rawArguments.trim() ? rawArguments.trim().split(/\s*,\s*/).map((arg) => arg.trim()) : [];
    if (args.some((arg) => !/^[a-z_]+ (text|jsonb|uuid(?:\[\])?)(?: default null)?$/.test(arg)))
      throw new Error("Assinatura fora do contrato textual.");
    definitions.push({ schema, name,
      argumentTypes: args.map((arg) => arg.split(" ")[1]).join(", "),
      argumentNames: args.map((arg) => arg.split(" ")[0]),
      defaults: args.filter((arg) => arg.endsWith(" default null")).length,
      result, language, definer: /\bsecurity definer\b/.test(options),
      volatility: /\bstable\b/.test(options) ? "s" : "v",
      sourceHash: sha(body.replaceAll("\r\n", "\n")), original,
    });
  }
  return definitions;
}

export function buildAtAfPostflight({ original, incremental, baselineChecker }) {
  for (const [key, source] of Object.entries({ original, incremental, baselineChecker })) {
    if (typeof source !== "string" || sha(source) !== EXPECTED_HASHES[key])
      throw new Error("Referencia alterada ou ausente: " + key);
  }
  const originalFunctions = parseFunctions(original, true);
  const addedFunctions = parseFunctions(incremental, false);
  if (originalFunctions.length !== 12 || addedFunctions.length !== 8) throw new Error("Inventario de funcoes divergente.");
  const functions = originalFunctions.map((fn) => fn.name === "admin_mutation"
    ? { ...fn, schema: "gestor_security", name: "admin_mutation_legacy", original: false }
    : fn).concat(addedFunctions);
  const reference = [...baselineChecker.matchAll(/\('(table|policy|trigger)','([^']+)','((?:''|[^'])*)'::jsonb\)/g)]
    .map((match) => ({ kind: match[1], name: match[2], detail: JSON.parse(match[3].replaceAll("''", "'")) }));
  const tables = reference.filter((row) => row.kind === "table");
  const policies = reference.filter((row) => row.kind === "policy");
  const oldTriggers = reference.filter((row) => row.kind === "trigger");
  if (tables.length !== 16 || policies.length !== 13 || oldTriggers.length !== 17)
    throw new Error("Referencia de catalogo original divergente.");
  const protectedTables = ["roles", "permissions", "role_permissions", "user_role_assignments", "delegations", "profiles", "audit_logs"];
  const triggers = oldTriggers.map((row) => {
    const [schema, table, name] = row.name.split(".");
    const functionName = /FUNCTION ([a-z_]+)\(\)/.exec(row.detail.definition)?.[1];
    if (!functionName) throw new Error("Referencia de trigger invalida.");
    return [schema, table, name, "public", functionName,
      name === "audit_changes" ? 29 : name === "auth_user_profile" ? 5 : 23, "O", false];
  });
  for (const table of protectedTables) triggers.push(["public", table, "security_no_truncate", "gestor_security", "deny_truncate", 34, "A", true]);
  for (const table of protectedTables.filter((name) => name !== "audit_logs")) triggers.push(["public", table, "segregation_guard", "gestor_security", "enforce_segregation", 31, "A", true]);
  triggers.push(["public", "audit_logs", "audit_integrity", "gestor_security", "protect_audit", 31, "A", true]);
  const functionValues = functions.map((fn) => [fn.schema, fn.name, fn.argumentTypes, JSON.stringify(fn.argumentNames), fn.defaults,
    fn.result, fn.language, fn.definer, fn.volatility, fn.sourceHash, fn.original]);
  const tableValues = tables.map((row) => [row.name.split(".")[1], protectedTables.includes(row.name.split(".")[1]), row.detail.rls, row.detail.force_rls]);
  const policyValues = policies.map((row) => [row.name.split(".")[1], row.name.split(".")[2], JSON.stringify(row.detail)]);
  const sql = `-- GERADO por node scripts/generate-at-af-postflight.mjs. Nao executa SQL ao gerar.
-- Original SHA-256: ${EXPECTED_HASHES.original}
-- Incremental SHA-256: ${EXPECTED_HASHES.incremental}
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
${values(functionValues)}
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
${values(tableValues)}
),
tables_now AS (
 SELECT e.*,c.oid,c.relowner,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.relacl
 FROM expected_tables e
 LEFT JOIN pg_catalog.pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_catalog.pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name
),
expected_policies(table_name,policy_name,detail_text) AS (
 VALUES
${values(policyValues)}
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
${values(triggers)}
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
`;
  assertSelectOnly(sql);
  return sql;
}

export function buildAtAfPreBaseline(sources) {
  // Reutilizar os MESMOS CTEs/formulas; nada e calculado contra uma base aqui.
  const postflight = buildAtAfPostflight(sources);
  const section = (start, end) => {
    const from = postflight.indexOf(start);
    const until = postflight.indexOf(end, from + start.length);
    if (from < 0 || until < 0) throw new Error("Contrato de formulas de baseline divergente.");
    return postflight.slice(from, until);
  };
  const ctes = section("expected_tables(", "expected_policies(") +
    section("policies_now AS (", "expected_triggers(") +
    section("inspection_context AS (", "data_checks AS (");
  const sql = `-- GERADO: captura privada ANTES da instalacao, sob autorizacao separada.
-- Original SHA-256: ${EXPECTED_HASHES.original}
-- Incremental SHA-256: ${EXPECTED_HASHES.incremental}
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
${ctes.slice(0, -2)}
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
`;
  assertSelectOnly(sql);
  return sql;
}

async function main() {
  if (process.argv.slice(2).some((arg) => arg !== "--check") || process.argv.slice(2).length > 1)
    throw new Error("Usar sem argumentos para gerar, ou --check para comparar sem escrita.");
  const root = new URL("../", import.meta.url);
  const [original, incremental, baselineChecker] = await Promise.all([
    readFile(new URL("supabase/migrations/202610300001_fase1.sql", root), "utf8"),
    readFile(new URL("supabase/migrations/202611050001_at_af_segregation.sql", root), "utf8"),
    readFile(new URL("supabase/inspection/fase1-post-migration.sql", root), "utf8"),
  ]);
  const sources = { original, incremental, baselineChecker };
  const outputs = [
    ["supabase/inspection/at-af-post-migration.sql", buildAtAfPostflight(sources)],
    ["supabase/inspection/at-af-pre-baseline.sql", buildAtAfPreBaseline(sources)],
  ];
  if (process.argv.includes("--check")) {
    for (const [path, sql] of outputs) {
      if (await readFile(new URL(path, root), "utf8") !== sql) throw new Error("Checker gerado divergente; rever antes de gerar.");
    }
    console.log("Checker incremental reprodutivel; nenhum ficheiro alterado e nenhum SQL executado.");
    return;
  }
  for (const [path, sql] of outputs) await writeFile(new URL(path, root), sql);
  console.log("Gerados checker incremental e captura de baseline SELECT-only; nenhum SQL foi executado.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
