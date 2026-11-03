# Validação pós-migração da Fase 1

Registo de 3 de Novembro de 2026 (Africa/Luanda). Projecto novo exclusivamente de
desenvolvimento; plano Free; sem dados reais da empresa. A hora exacta da execução
não foi fornecida e não é presumida.

## Execução confirmada pelo responsável

O responsável confirmou ter autorizado e executado **uma única vez** o ficheiro
original `supabase/migrations/202610300001_fase1.sql`. O SQL Editor devolveu
`Success. No rows returned`. A migração termina com COMMIT e não produz uma grelha
de dados de aplicação; a mensagem é compatível com a sua execução.

Validação posterior reportada:

| Medida | Resultado |
| --- | --- |
| tabelas_criadas | 16 |
| tabelas_com_rls | 16 |
| politicas_rls | 13 |
| trigger_perfis | 1 |

Estado: **migração executada e estrutura principal validada por confirmação do
operador**. Não se declara ainda auditado o conjunto de definições, privilégios,
relações ou fluxos reais. A migração não será reaplicada. SHA-256 preservado:

```text
56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58
```

O assistente não executou consultas no Supabase nesta revisão: não existe um
conector SQL autorizado disponível na sessão. Não foi pedida connection string,
password de base de dados ou chave service_role. Não se reutilizaram referências
do projecto anterior. O responsável executará a consulta de leitura abaixo no
projecto já confirmado e enviará apenas a exportação de catálogo/ACLs.

## Uma consulta de leitura para a inspecção detalhada

Ficheiro: [fase1-post-migration.sql](../../supabase/inspection/fase1-post-migration.sql).
Copiar o ficheiro integral, não a migração, para uma consulta nova no SQL Editor.
Executar como postgres, sem editar configurações ou criar contas. A transacção
é REPEATABLE READ READ ONLY, só usa catálogos e funções de introspecção PostgreSQL
e termina com ROLLBACK. **Não chama admin_mutation, audit_invitation ou outras RPCs
da aplicação, nem escreve dados ou reaplica DDL.**

Se o editor limitar o resultado, seleccionar pelo menos 1000 linhas ou «sem limite».
Exportar a grelha completa com OK, REVER, BLOQUEIO e INFO. A coluna total_linhas
mostra quantas linhas o resultado integral contém; o CSV deve conter esse número
de linhas de dados, além do cabeçalho. Se houver erro, enviar a mensagem sem
segredos; não executar GRANT, ALTER, DROP ou a migração para o ultrapassar.

A referência embutida foi obtida **apenas em PostgreSQL PGlite local em memória**,
a partir do original com hash fixo. 338 objectos de catálogo compõem a referência:
tabelas, colunas/defaults, constraints/chaves externas, índices, políticas,
funções e triggers. O gerador reproduzível está em scripts/generate-fase1-postflight.mjs.
O gerador não usa variáveis Supabase, credenciais ou rede; não serve para executar
a migração no projecto remoto.

| Inspecção | Critério |
| --- | --- |
| 16 tabelas e RLS | Presença, tipo, proprietário, RLS activa; FORCE RLS=false corresponde ao desenho original, sem dispensar RLS para os papéis API |
| 13 políticas | Nomes, comandos SELECT, papéis, USING e WITH CHECK iguais à referência; política de escrita adicional é BLOQUEIO |
| Relações e integridade | Constraints incluindo FK para auth.users(id), unicidade, checks, índices válidos e prontos |
| 17 triggers da referência | auth_user_profile, unit_tree, cost_tree e 14 audit_changes; nomes, eventos, função e activação |
| 12 funções | Assinaturas/parâmetros/defaults, retorno, proprietário, SECURITY DEFINER, search_path vazio e MD5 do corpo |
| Tabelas/colunas | Privilégios efectivos de anon/authenticated, incluindo herança; ausência de escrita/REFERENCES/TRIGGER/MAINTAIN/TRUNCATE e de leitura anónima |
| PUBLIC | Ausência de concessões de tabela e execução das funções da aplicação |
| RPC | Somente as 7 funções previstas executáveis por authenticated; nenhuma por anon/PUBLIC; auxiliares não expostas |
| Outros objectos de public | Definições adicionais ou divergências assinaladas para revisão |
| Catálogos iniciais | 6 roles, 17 permissions e 35 role_permissions, com contagem/MD5 de conteúdos; desvios exigem rever concessões, sem reaplicar seeds |
| Contagens de uso | Apenas números de contas/perfis/atribuições/unidades/custos/auditoria; sem nomes, emails ou UUIDs |
| service_role | Inventariado como papel administrativo com bypassrls; não usar essa identidade para provar isolamento |

OK confirma apenas aquele check. BLOQUEIO indica divergência de segurança ou
objecto obrigatório ausente: suspender preparação de contas e investigar. REVER
exige analisar a diferença, incluindo eventual normalização de definições entre
versões PostgreSQL; não significa autorização para corrigir automaticamente.
INFO não é uma aprovação de segurança. MD5 compara conteúdos, sem autenticar
artefactos; SHA-256 fixa o original de referência. O exame não invoca as funções
para provar seu comportamento nem testa a publicação efectiva pelo PostgREST.
Esta consulta pressupõe que as tabelas criadas reportadas existem: se alguma
estiver ausente, as contagens/catálogos podem falhar; a falha não deve ser forçada
por criação ou reaplicação de objectos. Após bootstrap aprovado, catálogos
personalizados podem produzir REVER legítimo e devem ser revistos como tal.

## Análise estática do original e limites da evidência remota

O original activa RLS nas 16 tabelas, revoga privilégios de anon/authenticated e
concede SELECT a authenticated. Escrita administrativa fica nas RPCs autorizadas.
As funções da aplicação recebem REVOKE de PUBLIC/anon/authenticated e apenas sete
recebem EXECUTE para authenticated:

- is_active_user()
- has_permission(text,uuid)
- visible_person(uuid,text)
- my_permissions()
- may_validate_activity(uuid[],uuid)
- admin_mutation(text,jsonb)
- audit_invitation(text,text,uuid)

in_unit_scope e as quatro funções de trigger não devem ser executáveis directamente
por authenticated. Todas as 12 são SECURITY DEFINER com search_path vazio e
referências qualificadas. admin_mutation exige conta activa e verifica capacidade,
âmbito e protecções contra auto-elevação por operação. audit_invitation exige
users.manage global e valida argumentos; não envia email por si só. my_permissions
serve para apresentação e não substitui autorização por âmbito nas operações.

Delegations é fundação de dados e **não participa na concessão de poderes** em
has_permission/my_permissions. Não há fluxo de delegação efectiva para homologar
como funcionalidade concluída nesta fase. Perfis/permissões são catálogos; o acesso
autenticado a esses catálogos não equivale a acesso a dados de outro departamento.
A política profile_read permite consultar o próprio perfil mesmo inactivo; o
servidor bloqueia rotas privadas e as funções exigem estado activo. Os testes devem
distinguir essa leitura própria de acesso a dados funcionais ou a perfis de terceiros.

**Não há exposição indevida identificada na análise estática das concessões do
original; ainda não está confirmada a ausência de exposição no Supabase remoto.**
Totais 16/16/13/1 não excluem um GRANT por coluna, uma política permissiva diferente,
uma sobrecarga nova ou um corpo de função alterado. A consulta detalhada procura
esses desvios; contas distintas e chamadas PostgREST são a prova comportamental
posterior. Não declarar RPCs seguras apenas por a migração ter terminado.

## Estado e próximos passos

1. Executar/exportar apenas a consulta de leitura detalhada e rever os resultados.
2. Com aprovação separada, preparar as contas e o bootstrap definidos no
   [plano de homologação](plano-homologacao.md). Não criar contas agora.
3. Com aprovação própria para eventuais alterações Auth/URLs/SMTP, preparar o
   ensaio de email. O SMTP padrão e 2 emails/hora não impedem a revisão de SQL;
   não se contrata um serviço nesta fase.
4. Homologar servidor/UI e chamadas directas PostgREST com papéis e âmbitos distintos.
5. Fechar a Fase 1 apenas com evidências remotas dos critérios do plano; sem
   publicação, merge ou Fase 2 automáticos.

A recuperação compensatória continua disponível para decisão separada, apenas
enquanto as guardas de ausência de contas/dados/trabalho posterior se mantiverem.
Não a executar para testar, não reaplicar a migração e não confundir ROLLBACK de
uma consulta de leitura com desfazer o COMMIT já efectuado.

Identidade azul-escuro e contratos de Centros de Custo/SAP/Primavera preservados.
Sem novos utilizadores remotos, alterações Auth/SMTP, publicação ou merge.

## Evidência local desta preparação

- npm run lint e npm run typecheck: aprovados.
- npm test: **65 testes aprovados em 8 ficheiros**. Aos 57 anteriores somam-se
  7 testes do inspector pós-migração e 1 de delegação sem poderes efectivos.
- O inspector passou no estado de referência com defaults directos Supabase
  simulados para anon/authenticated/service_role e RLS. Detectou RLS desactivada,
  concessão a PUBLIC, UPDATE por coluna, RPC administrativa anónima, auxiliar
  indevidamente exposta, política/corpo de função alterados, FK removida e
  capacidade funcional acrescentada ao catálogo inicial do administrador técnico.
- O teste de delegação usa identidades locais sintéticas e comprova que uma
  linha vigente não acrescenta activities.create a has_permission/my_permissions.
- Migração executada em memória apenas para gerar referência/testes, nunca de
  novo no Supabase. Não se criaram utilizadores remotos.
- Sem alterações em package.json/package-lock.json, CSS/interface ou na migração.
  Não foram repetidos build/Playwright: a evidência anterior de build e 42 testes
  de navegador sem Supabase permanece histórica, não homologação autenticada.
- O sucesso dos testes locais não altera a pendência do CSV real pós-migração.
