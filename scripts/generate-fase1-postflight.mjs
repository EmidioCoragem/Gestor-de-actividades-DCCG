// Executa a migração SOMENTE numa instância PGlite em memória para obter referência.
// Não usa variáveis Supabase, credenciais ou rede. Nunca executar migração remota aqui.
import { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { catalogSql } from "./fase1-catalog.mjs";

const root = new URL("../", import.meta.url);
const migration = await readFile(new URL("supabase/migrations/202610300001_fase1.sql", root), "utf8");
const hash = createHash("sha256").update(migration).digest("hex");
if (hash !== "56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58") {
  throw new Error("Migração original alterada: não gerar uma referência diferente silenciosamente.");
}
const db = new PGlite();
let reference;
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email varchar(255),raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  await db.exec(migration);
  reference = (await db.query(catalogSql)).rows;
} finally {
  await db.close();
}
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
const values = reference.map((r) => ` (${quote(r.kind)},${quote(r.object)},${quote(JSON.stringify(r.detail))}::jsonb)`).join(",\n");
const template = await readFile(new URL("scripts/fase1-postflight-template.sql", root), "utf8");
const sql = template.replace("-- EXPECTED_VALUES", () => values)
  .replace("-- CURRENT_CATALOG", () => catalogSql);
const target = new URL("supabase/inspection/fase1-post-migration.sql", root);
await writeFile(target, sql);
console.log(`Gerado ${fileURLToPath(target)}: ${reference.length} objectos de referência, migração ${hash}.`);
