import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Inputs = { original: string; incremental: string; baselineChecker: string };
type PostflightGenerator = {
  buildAtAfPostflight: (inputs: Inputs) => string;
  buildAtAfPreBaseline: (inputs: Inputs) => string;
  assertSelectOnly: (sql: string) => void;
};

// Só manipula texto. Não importa PGlite, não abre ligações e nunca executa SQL.
const inputs: Inputs = {
  original: readFileSync("supabase/migrations/202610300001_fase1.sql", "utf8"),
  incremental: readFileSync("supabase/migrations/202611050001_at_af_segregation.sql", "utf8"),
  baselineChecker: readFileSync("supabase/inspection/fase1-post-migration.sql", "utf8"),
};
const generatorUrl = new URL("../../scripts/generate-at-af-postflight.mjs", import.meta.url);
const generator = await import(generatorUrl.href) as PostflightGenerator;

const artifacts = [
  { name: "pós-instalação", build: generator.buildAtAfPostflight, path: "supabase/inspection/at-af-post-migration.sql" },
  { name: "baseline prévia", build: generator.buildAtAfPreBaseline, path: "supabase/inspection/at-af-pre-baseline.sql" },
];

describe("Pós-verificador AT/AF: referência reprodutível, sem executar SQL", () => {
  it.each(artifacts)("o artefacto $name é exactamente o produzido pelas fontes aprovadas", ({ build, path }) => {
    const generated = build(inputs);
    expect(generated).toBe(readFileSync(path, "utf8"));
    expect(generated.length).toBeGreaterThan(1_000);
    expect(() => generator.assertSelectOnly(generated)).not.toThrow();
  });

  it.each(["original", "incremental", "baselineChecker"] as const)("não aceita drift na fonte %s nem actualiza a referência silenciosamente", source => {
    const changed = { ...inputs, [source]: inputs[source] + "\n-- SYNTHETIC_HASH_DRIFT\n" };
    for (const artifact of artifacts) expect(() => artifact.build(changed)).toThrow();
  });

  it("a geração é determinística e não altera os textos fornecidos", () => {
    const frozen = Object.freeze({ ...inputs });
    const before = JSON.stringify(frozen);
    for (const artifact of artifacts) expect(artifact.build(frozen)).toBe(artifact.build(inputs));
    expect(JSON.stringify(frozen)).toBe(before);
  });
});

describe("Validador estático fechado: texto de SQL nunca é executado", () => {
  it("distingue palavras perigosas em texto/comentários de instruções executáveis", () => {
    const sql = `-- DROP TABLE public.roles; apenas comentário
WITH example AS (SELECT 'DELETE FROM public.roles; SELECT public.admin_mutation(''x'',''{}'');' AS value)
SELECT value FROM example; /* UPDATE public.roles SET name='x'; */`;
    expect(() => generator.assertSelectOnly(sql)).not.toThrow();
  });

  it.each([
    ["DML em CTE", "WITH changed AS (DELETE FROM public.roles RETURNING *) SELECT * FROM changed;"],
    ["INSERT em CTE", "WITH changed AS (INSERT INTO public.roles(code,name) VALUES('x','x') RETURNING *) SELECT * FROM changed;"],
    ["DDL", "CREATE TABLE public.unapproved(id integer);"],
    ["SELECT INTO", "WITH x AS (SELECT 1 AS value) SELECT value INTO TEMP TABLE unapproved FROM x;"],
    ["segunda instrução", "WITH x AS (SELECT 1) SELECT * FROM x; DROP TABLE public.roles;"],
    ["alteração de sessão", "WITH x AS (SELECT 1) SELECT pg_catalog.set_config('role','postgres',false) FROM x;"],
    ["notificação", "WITH x AS (SELECT 1) SELECT pg_catalog.pg_notify('topic','payload') FROM x;"],
    ["função citada", 'WITH x AS (SELECT 1) SELECT "pg_catalog"."pg_notify"(\'topic\',\'payload\') FROM x;'],
    ["RPC da aplicação", "WITH x AS (SELECT 1) SELECT public.admin_mutation('grant_role','{}') FROM x;"],
    ["RPC citada", 'WITH x AS (SELECT 1) SELECT "public"."admin_mutation"(\'grant_role\',\'{}\') FROM x;'],
    ["função desconhecida", "WITH x AS (SELECT 1) SELECT pg_catalog.dblink_exec('connection','DELETE FROM roles') FROM x;"],
    ["ficheiro do servidor", "WITH x AS (SELECT 1) SELECT pg_catalog.pg_read_file('/unapproved') FROM x;"],
    ["lock consultivo", "WITH x AS (SELECT 1) SELECT pg_catalog.pg_advisory_lock(1) FROM x;"],
    ["lock de linhas", "WITH x AS (SELECT 1) SELECT * FROM public.profiles FOR UPDATE;"],
    ["tipo da aplicação", "WITH x AS (SELECT 'value'::public.unapproved_type AS value) SELECT value FROM x;"],
    ["tipo citado", 'WITH x AS (SELECT \'value\'::"public"."unapproved_type" AS value) SELECT value FROM x;'],
    ["CAST para tipo da aplicação", "WITH x AS (SELECT 1) SELECT CAST('value' AS public.unapproved_type) FROM x;"],
    ["operador da aplicação", "WITH x AS (SELECT 1) SELECT 1 OPERATOR(public.unapproved_operator) 2 FROM x;"],
    ["metacomando", "WITH x AS (SELECT 1) SELECT * FROM x;\n\\gexec"],
    ["COPY externo", "COPY (SELECT 1) TO PROGRAM 'unapproved';"],
    ["SQL incompleto", "WITH x AS (SELECT 'unterminated) SELECT * FROM x;"],
  ])("recusa %s em vez de o classificar como leitura", (_name, sql) => {
    expect(() => generator.assertSelectOnly(sql)).toThrow();
  });
});
