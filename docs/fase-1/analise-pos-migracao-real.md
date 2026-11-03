# Auditoria do CSV pós-migração — 3 de Novembro de 2026

**Resultado: catálogo/ACLs aceites no âmbito inspeccionado, sem divergência efectiva
inexplicada. A Fase 1 continua em homologação funcional.** Não autoriza criar
utilizadores, alterar Auth/SMTP, publicar, fazer merge ou executar recuperação.

## Evidência recebida

Ficheiro `Supabase Snippet Untitled query (1).csv`, 157 170 bytes, 635 linhas de
dados e cinco colunas esperadas. Todas as células detalhe foram interpretadas
como JSON. Todas as linhas indicam total_linhas=635, sem duplicação de pares
categoria/objecto: a exportação está completa. O CSV bruto não foi publicado.

SHA-256 do ficheiro original:

```text
7cd7d33683d6a7ed4c9ea2ee693bf1dce4eecfcee5e7d5abb09ac746392c44bc
```

Captura: 3 de Novembro de 2026, 11:37:50.196239 UTC (12:37:50.196239 Africa/Luanda),
operador postgres, PostgreSQL 17.11, read_only=on. A análise não executou consultas
ou alterações no Supabase. A origem do projecto de desenvolvimento está confirmada
pelo responsável nas evidências anteriores.

Resultado bruto preservado: 544 OK, 76 BLOQUEIO, 12 REVER e 3 INFO. Não se
reescreveu o CSV nem se apresentam os rótulos brutos como ausência de alertas.

## Resolução dos 76 BLOQUEIO — diferença PostgreSQL 17/18

Todos os 76 correspondem exclusivamente a entradas contype=n de NOT NULL
esperadas em pg_constraint, ausentes no servidor remoto. O PGlite usado para a
referência é PostgreSQL 18.6; o Supabase exportado é PostgreSQL 17.11.
PostgreSQL 17 representa NOT NULL de colunas em pg_attribute.attnotnull; PostgreSQL
18 passou a representá-lo também no catálogo de constraints. Fontes oficiais:
[pg_constraint 17](https://www.postgresql.org/docs/17/catalog-pg-constraint.html) e
[pg_constraint 18](https://www.postgresql.org/docs/18/catalog-pg-constraint.html).

Para cada uma das 76 entradas foi identificada a coluna correspondente no CSV:
actual.not_null=true e metadados completos de coluna iguais à referência.
**Nenhuma das 76 obrigatoriedades está em falta nas evidências recebidas.**
As restantes 73 constraints (PK, FK, UNIQUE e CHECK) coincidem exactamente.

A comparação original do inspector era excessivamente literal e produziu estes
falsos positivos. Corrigiu-se apenas o inspector: não comparar entradas n de
constraints de tabela, mantendo a verificação NOT NULL de todas as 100 colunas
em attnotnull. A referência portável passa de 338 para 262 objectos; nenhuma
integridade de coluna deixa de ser verificada. Um teste de regressão remove
NOT NULL de full_name em memória e comprova que o inspector continua a detectar
a divergência. Não se fez ALTER TABLE no Supabase.

## Resolução dos 12 REVER — finais de linha CRLF

Os 12 diferem unicamente em source_md5. Proprietário, parâmetros/defaults,
retorno, SECURITY DEFINER, search_path e volatilidade coincidem exactamente.

Para cada função, extraiu-se o corpo do original com SHA-256 fixo e calcularam-se:

- MD5 do corpo original LF: coincide com esperado.source_md5 do CSV.
- MD5 do mesmo corpo substituindo cada LF por CRLF: coincide exactamente com
  actual.source_md5 do CSV, nas 12 funções.

O original destas funções não tem literais de string multilinha; a diferença
identificada corresponde aos finais de linha. Não se descartaram outros bytes,
espaços, comentários ou código para obter correspondência. O MD5 é comparador,
não assinatura criptográfica de autenticidade ou prova de comportamento completo.

O inspector corrigido compara source_md5_lf, normalizando somente CRLF→LF, e
mantém source_md5_raw na secção RPC para rastreabilidade. O teste de regressão
recria as 12 funções com CRLF apenas no PGlite e confirma ausência de falsos
alertas. O teste de função alterada para retornar true continua a detectar a
alteração real. Nenhuma função remota foi substituída ou alterada.

## Restantes resultados efectivamente comprovados pelo CSV

| Evidência | Resultado |
| --- | --- |
| 16 tabelas | Definições/proprietário correspondentes; RLS activa nas 16 |
| 100 colunas | Tipos, NOT NULL, geração/identidade e defaults correspondentes |
| 73 constraints portáveis | Definições e validação correspondentes, incluindo chaves externas |
| 31 índices | Definições, validade e prontidão correspondentes |
| 13 políticas | Definições, papéis e expressões correspondentes; apenas SELECT |
| 17 triggers | 14 de auditoria, 2 de árvores e 1 auth_user_profile, correspondentes e activos |
| 32 checks de privilégios de tabela | anon sem leitura/escrita; authenticated SELECT, sem DML/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN |
| 200 checks de privilégios de coluna | Sem DML/REFERENCES indevidos, incluindo concessões por coluna |
| 16 checks PUBLIC de tabela | Sem concessões a PUBLIC |
| 12 checks RPC | anon/PUBLIC sem EXECUTE; authenticated apenas nas sete previstas; cinco auxiliares/trigger não expostas |
| Papéis anon/authenticated | Sem superuser, bypassrls ou CREATE em public |
| Catálogos | 6 roles, 17 permissions, 35 role_permissions; contagem e hashes iguais aos iniciais |
| Uso | 0 contas Auth, perfis, atribuições, unidades, centros de custo e auditoria nas contagens exportadas |

Os valores de privilégios foram também conferidos independentemente dos rótulos:
todos os can_* indevidos são false, SELECT corresponde ao papel previsto,
EXECUTE corresponde às sete assinaturas autorizadas e os campos de segurança
das funções coincidem. Cada esperado do catálogo foi comparado com a referência
do commit b8ffd58, não aceite apenas porque constava do CSV. Todas as 88 diferenças
foram justificadas acima; nenhum BLOQUEIO/REVER ficou sem explicação.

Não se identificaram exposições indevidas de catálogo/ACLs nas evidências desta
exportação. Isso não substitui login real e testes PostgREST com identidades e
âmbitos distintos: catálogo correcto não prova a entrega de email, JWTs/cookies,
cache de esquema ou cada comportamento da aplicação.

## Estado e próxima etapa

**Lote 1 — auditoria pós-migração de leitura: concluído e aceite**, com os falsos
positivos de compatibilidade resolvidos. Não é necessário repetir a migração ou
esta exportação para resolver os alertas. A consulta corrigida fica disponível
para verificações futuras; não foi reexecutada no servidor remoto nesta revisão.

**Preparado para propor o lote de contas/bootstrap e homologação**, mediante nova
autorização expressa e os dados de teste aprovados no plano. Nenhuma conta foi
criada agora. A recuperação de baseline vazia continua contingência sujeita às
guardas e autorização própria; deixa de ser adequada após contas/dados de uso.

Validação local final da correcção: lint e TypeScript aprovados; 67 testes em
8 ficheiros aprovados, incluindo regressões de NOT NULL e CRLF. Sem repetição de
build/Playwright, pois não houve alterações à aplicação. A migração original
permanece byte a byte igual, com SHA-256
56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58.
Sem alterações de dependências, Auth/SMTP, triggers remotos, publicação ou main.
