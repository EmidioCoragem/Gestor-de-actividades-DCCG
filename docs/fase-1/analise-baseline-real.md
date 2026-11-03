# Revisão da baseline real — 2 de Novembro de 2026

**Actualização de 3 de Novembro:** a migração foi executada uma única vez pelo
responsável. Este documento preserva a análise pré-migração; o estado corrente
está em [validacao-pos-migracao.md](validacao-pos-migracao.md). Não repetir a migração.

Documento vigente para a análise do CSV recebido. Não constitui autorização de
execução da Etapa B ou de recuperação. Nenhuma ligação ao Supabase foi usada.

## Estado vigente após confirmação do registo privado

O responsável confirmou a conclusão e guarda privada de baseline-fase1-painel.txt.
Esta pendência está encerrada por confirmação do responsável; não foi solicitado
o ficheiro privado nem qualquer segredo. Configurações reportadas: signup público
e acessos anónimos desactivados, confirmação de email activa, palavra-passe mínima
de 12 caracteres, Site URL http://localhost:3000, nenhuma Redirect URL adicional,
SMTP personalizado desactivado e limite de 2 emails/hora. Foram registadas também
as configurações de fornecedores, sessões, tokens, limites e notificações.

Os valores de URL/SMTP não impedem a migração SQL: a migração não chama Auth HTTP,
envia email ou utiliza redireccionamentos. A operação compensatória também não
depende de entrega de emails ou de URLs. São limitações para futura homologação:
localhost só serve o contexto local apropriado; uma origem privada remota exige
rever as URLs autorizadas antes de testar os fluxos; SMTP padrão e 2 emails/hora
limitam convites/recuperação. Nenhuma alteração dessas opções é necessária ou foi
autorizada nesta revisão da migração.

Foram entretanto recebidos os nove checks efectivos, todos OK/permitido=true
para postgres, e capturas com auth_users_autorizado=true no check específico da
configuração de remoção de triggers. A imagem de drop_trigger_grants apresenta a
configuração para postgres, embora o JSON completo apareça truncado. O resultado
booleano específico é registado como evidência recebida de autorização configurada
para auth.users. O predicado completo não está visível nas capturas; não se afirma
que foi auditado integralmente ou que a remoção do trigger tenha sido ensaiada no
projecto gerido. Esta revisão não executou consultas remotas.

**Conclusão vigente: APTO para solicitar autorização expressa da Etapa B**,
limitada à migração SQL original no projecto de desenvolvimento confirmado.
Estão encerradas as pendências da baseline, registo privado, nove privilégios e
confirmação específica de autorização de remoção do trigger. Não é necessário
repetir essas verificações se o projecto não mudou. A autorização de execução
continua por obter; esta análise não a substitui.

A recuperação permanece limitada ao estado imediatamente após a migração, antes
de contas, bootstrap, dados ou alterações posteriores. Configuração de autorização
não é prova de sucesso de uma operação DDL real: um erro futuro deve interromper
os trabalhos e ser analisado, sem forçar CASCADE ou alterar permissões. Os sete
ensaios locais e as guardas permanecem válidos no seu âmbito; Auth, Storage e
Supautils geridos não foram restaurados no ensaio. URLs e limites de email são
pendências de homologação funcional posterior, não de execução da migração SQL.

As secções seguintes preservam o histórico e os fundamentos, incluindo pendências
já encerradas. O resumo acima e o relatório de segurança indicam o estado vigente.

## Evidência e integridade

Ficheiro recebido: `Supabase Snippet Untitled query.csv`, 54 106 bytes,
15 linhas de dados, duas colunas (`item`, `detalhe`). Todas as células detalhe
foram interpretadas como JSON, sem truncamento ou erros, com as 15 chaves únicas
esperadas, na ordem da consulta. Conteúdo tratado apenas como evidência.

SHA-256 do CSV original, incluindo a sua codificação e formatação:

```text
8af2560c6e7296d3d63498096ada927529de93959bc04251a11575dd1a15068d
```

Contexto exportado: base `postgres`, operador `postgres`, PostgreSQL 17.11,
read_only=on, captura em 2026-11-02 16:06:06.314377 UTC
(17:06:06.314377 em Africa/Luanda). O nome da base e o nome do operador não
identificam univocamente o projecto Supabase. O responsável confirmou expressamente
que o CSV é do projecto novo de desenvolvimento correcto e que guardou cópia
privada adicional. A referência pode ficar apenas no registo privado do operador.
Não se recolheu nenhuma credencial.

O CSV bruto não foi acrescentado ao repositório público. A cópia privada adicional
foi confirmada; o hash neste relatório identifica a evidência sem a publicar.

## Revisão das 15 linhas

| Item | Resultado observado | Avaliação |
| --- | --- | --- |
| 00_contexto | PostgreSQL 17.11; leitura; operador postgres | Consulta concluída; não demonstra identidade do projecto ou todos os poderes do operador |
| 01_contagens | Auth 0, buckets 0, objectos Storage 0 | Condição de ausência de contas/conteúdo confirmada no instante da captura |
| 02_relacoes_public | 0 | Sem tabelas, views, sequências ou relações da aplicação na selecção da consulta |
| 03_colunas | 35 colunas de auth.users | id uuid NOT NULL; email varchar(255); raw_user_meta_data jsonb; compatíveis |
| 04_funcoes_public | 0 | Nenhuma função/procedimento de public na selecção da consulta |
| 05_triggers | 8, todos em Storage | Nenhum auth_user_profile ou trigger da aplicação; preservar os oito |
| 06_default_acl | 12 entradas: 6 public, 3 storage, 3 auth | Public coincide com a revisão anterior; as outras não são alteradas pela migração |
| 07_extensoes | 5 | pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1 e uuid-ossp 1.1; sem CREATE/DROP EXTENSION na migração |
| 08_event_triggers | 6, owner supabase_admin, enabled O | Nomes/eventos habituais; hashes registados para comparação futura, não auditoria do código interno |
| 09_schema_acl | auth, public e storage | Preservar; USAGE de PUBLIC no esquema public não equivale a privilégios de escrita nas tabelas |
| 10_politicas | 0 nos esquemas consultados | Sem colisões de políticas; não inferir ausência de RLS em todas as tabelas geridas |
| 11_indices | 131: 111 auth, 20 storage, 0 public | Sem colisões com os índices novos da Fase 1 |
| 12_constraints | 129: 110 auth, 19 storage, 0 public | Sem colisões em public; users_pkey tem o MD5 de PRIMARY KEY (id) |
| 13_papeis_api | anon/authenticated sem superuser nem bypassrls; service_role com bypassrls | Configuração habitual; service_role continua exclusivamente servidor |
| 14_membros_papeis | 24 associações | Nenhum papel adicional é concedido a anon ou authenticated nas linhas recebidas; não inverter o sentido papel → membro |

Os oito triggers Storage protegem nomes, versionamento, campos de controlo e
eliminação de buckets/objectos, além de actualizar timestamps. Não pertencem à
Fase 1 e o procedimento compensatório não os elimina nem escreve em Storage.

Os seis event triggers são issue_graphql_placeholder, issue_pg_cron_access,
issue_pg_graphql_access, issue_pg_net_access, pgrst_ddl_watch e pgrst_drop_watch.
O novo CSV esclarece que os dois watchers PostgREST têm tags=null, ou seja, sem
aquele filtro de tags. Os quatro restantes acompanham CREATE/DROP EXTENSION,
operações ausentes da migração. Os watchers PostgREST podem correr durante DDL;
o ensaio PGlite não valida esses componentes geridos.

## Comparação com a migração e com a recuperação

Base de código: aacdb077098ad86b9e5d5ecf1c076b687c43ccea. A migração original
contém 16 CREATE TABLE em public, 12 CREATE FUNCTION em public, 13 políticas,
índices e triggers da aplicação. Nenhuma relação, função, índice, constraint ou
política de public da selecção do CSV colide com esses objectos. O trigger novo
auth_user_profile não existe na baseline. A verificação anterior de conflitos
continua complementar: o CSV não inventaria tipos independentes de relações ou
todas as espécies de rotinas, nem substitui cada verificação de nomes da grelha.

As instruções de preenchimento de profiles e o trigger aceitam varchar(255),
como comprovado no ensaio local anterior. O hash de users_pkey coincide com
4c6419b3704337bbfe50f018842a9ad3, calculado para PRIMARY KEY (id); o CSV não exporta
a definição completa dessa constraint. PostgreSQL 17 disponibiliza a função
gen_random_uuid nativa; a existência/permissão efectiva de auth.uid não está
exportada na linha de funções de public.

As seis ACLs predefinidas de public concedem privilégios directos a postgres,
anon, authenticated e service_role; não há beneficiário PUBLIC nessas entradas.
A migração revoga ALL de anon/authenticated nas tabelas e volta a conceder SELECT
sujeito a RLS. Nas 12 funções, revoga PUBLIC/anon/authenticated e concede EXECUTE
apenas nas sete previstas. As concessões de service_role permanecem. As ACLs de
auth/storage e as memberships não são modificadas.

Não existem chaves externas preexistentes nos esquemas inventariados que possam
referenciar tabelas da aplicação ainda inexistentes. Não se identificou conflito
ou dependência efectiva impeditiva nos dados recebidos. O inventário não é uma
análise universal de SQL dinâmico, objectos de outros esquemas ou configurações
fora da base de dados; não se afirma que esses componentes foram restaurados.

As condições de ausência de dados do procedimento compensatório estão satisfeitas
na baseline. Depois da migração ainda será obrigatório verificar que só existem
os catálogos iniciais esperados e nenhum uso posterior. A recuperação mantém
RESTRICT, remove explicitamente as políticas cruzadas, preserva Auth/Storage e
não usa CASCADE. O CSV real não foi restaurado em PGlite como um dump: ele é o
inventário de referência; o ensaio de recuperação anterior continua sendo local.

## Evidência ainda em falta e passos mínimos

1. Identidade do projecto e cópia privada adicional do CSV: **confirmadas pelo
   responsável**. Não se exige repetir esta confirmação.
2. Completar o registo privado das configurações não secretas Auth/painel:
   signup público e acessos anónimos desactivados, fornecedores, confirmações,
   política de palavra-passe, URLs, SMTP e templates (ou «não configurado»).
   O responsável confirmou signup público e acessos anónimos desactivados,
   confirmação de email obrigatória e autenticação por email activa. Informou
   que o registo privado completo ainda não existe. O CSV não contém as restantes
   configurações. Seguir o [guia de registo do painel](guia-registo-painel.md) e o
   [modelo preenchível](modelo-registo-painel.txt), sem alterar opções ou enviar
   segredos. 0 contas anónimas por si só não prova a opção de criação anónima.
3. Executar apenas [fase1-operator-permissions.sql](../../supabase/inspection/fase1-operator-permissions.sql)
   no mesmo SQL Editor/papel pretendido para a Etapa B. Exportar as duas grelhas.
   Verifica 9 permissões efectivas e metadados de propriedade. Esta consulta não
   cria objectos, concede direitos ou executa LOCK SHARE. O CSV de inventário
   não prova CREATE em public, TRIGGER/REFERENCES em auth.users ou a permissão
   do lock SHARE exigido pelo procedimento compensatório.

Segundo a [documentação PostgreSQL 17 de LOCK](https://www.postgresql.org/docs/17/sql-lock.html),
SELECT só autoriza ACCESS SHARE; SHARE exige um dos privilégios MAINTAIN, UPDATE,
DELETE ou TRUNCATE (ou poderes equivalentes). A consulta complementar observa os
privilégios sem os usar para escrever. Os metadados de ownership/papel especial
Supabase devem ser revistos antes de assumir poderes para remover o trigger de
Auth numa recuperação. Não conceder privilégios nem alterar proprietários para
forçar um resultado OK.

O complemento SQL foi executado apenas numa fixture PGlite local: nove resultados
OK e metadados esperados para o proprietário local. Não é prova de privilégios no
Supabase. Não se alteraram aplicação, migração, recuperação ou dependências;
os 57 testes locais anteriores e 42 ensaios de navegador anteriores permanecem
identificados nos relatórios, sem os apresentar como reexecutados nesta análise.

## Conclusão actual

**Baseline real recebida e analisada, sem BLOQUEIO efectivo identificado nos
objectos/dados inventariados. NÃO APTO ainda para solicitar execução da Etapa B**,
até completar o registo privado do painel e rever as permissões efectivas do operador.
A ausência de baseline real deixou de ser a pendência; faltam os elementos que
este CSV não exporta. Não é necessário repetir a baseline inteira se o projecto
não sofreu alterações; se houve alterações, actualizar a evidência antes da decisão.

A migração mantém SHA-256
`56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58`.
Riscos residuais: recuperação limitada ao estado sem uso após migração, serviços
Supabase não simulados localmente, manutenção das dependências de desenvolvimento
e homologação Auth/SMTP/cookies/RLS/PostgREST ainda pendentes. Nada foi executado
ou alterado remotamente, nenhuma conta foi criada e não houve merge na main.

## Complemento recebido — propriedade e papel privilegiado

O responsável enviou a segunda grelha de fase1-operator-permissions.sql:
database=postgres, operador=postgres, database_owner=postgres,
auth_users_owner=supabase_auth_admin, herda_papel_owner_auth_users=false,
herda_papel_privilegiado_supabase=true. São metadados compatíveis com a separação
habitual de papéis geridos Supabase. Não se exige mudar o proprietário de auth.users
ou conceder o papel supabase_auth_admin a postgres.

Ser proprietário da base não confere automaticamente propriedade das tabelas de
outros papéis. O resultado de pertença ao papel privilegiado não demonstra os
nove privilégios efectivos da primeira grelha, ainda não recebida. A execução da
consulta sem erro apenas comprova que foi possível consultar os metadados.

A migração cria objectos próprios em public, referencia auth.users(id), lê contas
existentes e cria auth_user_profile. A sua compatibilidade depende dos checks de
CREATE/USAGE, SELECT/TRIGGER/REFERENCES e EXECUTE da primeira grelha. O false de
herança do proprietário Auth não é, por si, BLOQUEIO dessa migração.

O procedimento compensatório contém DROP TRIGGER auth_user_profile ON auth.users
RESTRICT. A [documentação Supautils](https://github.com/supabase/supautils#table-ownership-bypass)
documenta autorização específica de remoção de triggers sem propriedade através
de supautils.drop_trigger_grants. Não se pode deduzir essa configuração apenas de
herda_papel_privilegiado_supabase=true. A [documentação de papéis Supabase](https://supabase.com/docs/guides/database/postgres/roles-superuser)
também distingue postgres de superuser irrestrito.

Foi preparada fase1-drop-trigger-permission.sql para ler apenas essa configuração
não secreta. Não executa DROP TRIGGER nem altera configurações. Rever o valor e
se cobre o operador postgres e auth.users; NULL, configuração vazia ou erro de
permissão não constituem prova de autorização. Se essa prova não estiver disponível,
manter o procedimento de recuperação como não confirmado no ambiente gerido;
não efectuar operações remotas para testar sem autorização própria. PGlite não
reproduz os mecanismos de autorização internos Supautils.

Conclusão deste complemento: **metadados compatíveis; validação de privilégios e
da recuperação ainda incompleta**. Continuam pendentes a primeira grelha com os
nove checks, a confirmação específica de remoção do trigger e o registo privado
do painel em preparação. Nenhum ficheiro de migração ou recuperação foi alterado.

A primeira grelha pode ser obtida isoladamente com [fase1-operator-checks.sql](../../supabase/inspection/fase1-operator-checks.sql), que devolve apenas os nove checks. Isto evita perder a primeira grelha quando o SQL Editor apresenta apenas o ultimo SELECT.
