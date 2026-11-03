// Apenas SQL de catálogo, partilhado pelo gerador e ensaios locais.
// Não lê dados pessoais, não chama funções RPC da aplicação.
export const catalogSql = `
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
 -- NOT NULL de tabelas: attnotnull acima e portavel entre PG17 e PG18.
 WHERE k.contype<>'n'
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
   'volatility',p.provolatile,'config',p.proconfig,
   'source_md5_lf',md5(replace(p.prosrc,chr(13)||chr(10),chr(10))),
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
SELECT kind,object,detail FROM records ORDER BY kind,object`;
