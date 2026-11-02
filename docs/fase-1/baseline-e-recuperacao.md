# Baseline e recuperação da primeira migração — Supabase Free

Data: 2 de Novembro de 2026. Exclusivamente desenvolvimento, sem dados reais.
Estado remoto: não consultado nem alterado nesta preparação. Não executar agora a
migração nem o ficheiro de recuperação. A Etapa B e uma eventual recuperação
remota exigem autorizações expressas separadas.

## Solução sem contratação

A [documentação de backups](https://supabase.com/docs/guides/platform/backups) e a
[FAQ do plano gratuito](https://supabase.com/kb/faqs/platform/free-plan-backups)
recomendam exportações lógicas manuais no Free. Não se depende de backups pagos,
PITR ou da funcionalidade paga de clonagem/restauro para outro projecto.

Neste caso ainda não há dados da aplicação nem contas Auth, segundo o responsável.
A solução proposta é uma **baseline limitada ao efeito desta migração**:

1. Código e migração original guardados no GitHub, com SHA-256 fixo.
2. Inventário prévio exportado pelo SQL Editor, sem linhas de utilizadores,
   palavras-passe, tokens, chaves, definições completas de funções ou valores de
   configuração potencialmente secretos.
3. Registo manual das configurações não secretas do painel.
4. Operação compensatória que remove apenas os objectos introduzidos pela Fase 1,
   na mesma base de dados, imediatamente após a migração e antes de qualquer uso.

O inventário sozinho não é um dump restaurável e os seus hashes não reconstroem
definições SQL. A recuperabilidade limitada resulta da combinação do inventário,
do estado anterior sem objectos homónimos e da operação inversa ensaiada. Não se
promete reconstruir toda a infraestrutura gerida, alterações arbitrárias ou dados
preexistentes a partir deste inventário.

Se forem encontrados objectos personalizados com dados ou alterações fora do
âmbito, parar e rever o plano. Para backup geral, a alternativa gratuita é um dump
lógico com ferramentas PostgreSQL/Supabase CLI, guardado privadamente e restaurado
em ensaio. Essa operação precisa de autenticação do operador no seu computador;
não se devem fornecer credenciais ao chat, GitHub ou logs. Não foi executada aqui.

## Passos mínimos no painel — antes de pedir autorização da Etapa B

1. Abra o Supabase e seleccione o projecto novo de desenvolvimento. Em Settings /
   General, confirme o nome e a referência do projecto. Registe-os num ficheiro
   privado `baseline-fase1-painel.txt`, com a data e indicação de plano Free. Não
   copie API keys, JWT secrets, palavras-passe ou connection strings.
2. Abra SQL Editor, crie uma consulta nova e cole **somente** o conteúdo de
   [fase1-baseline.sql](../../supabase/inspection/fase1-baseline.sql). Clique Run.
   Esta consulta é READ ONLY e não executa a migração. Exporte todas as 15 linhas
   da grelha pelo comando Export/CSV e guarde `baseline-fase1-antes.csv` numa pasta
   privada com uma segunda cópia fora do computador. Não publicar este resultado
   no repositório público. Se a interface não permitir exportação, copie as duas
   colunas completas, sem truncar o JSON, para um ficheiro privado.
3. Confirme a linha `01_contagens`: auth_users, storage_buckets e storage_objects
   devem ser 0 para este procedimento simplificado. Se não forem, pare. As linhas
   restantes serão comparadas com a inspecção de conflitos: não deve existir
   nenhum dos 16 nomes de tabelas, 12 funções ou auth_user_profile da migração.
   Objectos de extensões Supabase podem existir; objectos personalizados exigem
   revisão. Não apague nada para obter zeros.
4. Em Authentication, apenas consulte e registe no ficheiro privado: registo
   público desactivado, acesso anónimo desactivado, fornecedores habilitados,
   confirmações de e-mail, política de palavra-passe e opções de segurança,
   Site URL, Redirect URLs, personalizações dos modelos de convite/recuperação e
   se há SMTP personalizado. Não altere essas opções nesta etapa. Não copie o
   segredo SMTP, chaves de fornecedores ou links contendo tokens. Se usar
   capturas de ecrã, não inclua campos ou páginas de segredos.
5. Consulte Storage e Edge Functions para confirmar ausência de ficheiros e
   funções personalizadas; registe quaisquer configurações de Realtime, API e
   extensões que tenha alterado. Guarde também o resultado da consulta final de
   conflitos. Envie apenas o inventário sem segredos e a confirmação do registo
   manual para revisão. Guardar/partilhar estas evidências não autoriza migrar.

Não é necessário criar outro projecto, contratar recursos, exportar auth.users
ou fornecer credenciais para estes passos. Se alguma área do painel não tiver
sido usada, registe «não configurado»; não invente valores nem altere definições.

## O que cada forma de recuperação cobre

| Componente | Recuperação proposta |
| --- | --- |
| 16 tabelas novas, índices, constraints, políticas, triggers da aplicação e 12 funções | SQL compensatório, limitado ao estado imediatamente após a migração sem uso |
| Trigger auth_user_profile em auth.users | Removido explicitamente pelo SQL compensatório; a tabela auth.users não é eliminada nem alterada estruturalmente |
| Objectos anteriores, ACLs predefinidas, extensões e event triggers geridos | Preservados; comparar com o inventário, não os recriar por SQL artesanal |
| Dados novos, contas Auth, catálogos alterados ou trabalho posterior | Fora do procedimento simplificado; a recuperação deve recusar ou parar para revisão/backup específico |
| Auth: signup, anónimos, fornecedores, URLs, SMTP, templates, políticas de segurança | Registo e eventual reaplicação manual no painel; não recuperados pela operação SQL |
| Chaves, JWT secrets, passwords, segredos SMTP e OAuth | Não recolhidos; gerir no painel/meios seguros do operador se uma recriação os exigir |
| Ficheiros Storage | Não recuperados por SQL de metadados; se existirem, exigem cópia separada |
| Perda do projecto ou avaria da infraestrutura gerida | Pode exigir recriação/suporte; este ensaio PostgreSQL não restaura serviços Supabase |

Recriar um projecto é alternativa de contingência, não requisito desta migração.
Verificar primeiro a quota de projectos gratuitos; não apagar o original para
libertar uma vaga sem plano e autorização próprios. Um novo projecto não mantém
a referência/URLs/chaves antigas e exige reaplicar manualmente as configurações
Auth e actualizar o ambiente seguro da aplicação. Não recuperar nem reutilizar
credenciais de um projecto anterior. A
[documentação de restauro](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
explica as diferenças entre a base de dados e os serviços do projecto.

## Recuperação após COMMIT — apenas se vier a ser autorizada

Este procedimento não é executar ROLLBACK depois do COMMIT. É uma **nova
transacção compensatória**, destrutiva para os objectos novos da Fase 1.

1. Parar o servidor da aplicação e quaisquer tarefas que escrevam no projecto.
   Não criar contas, fazer bootstrap ou iniciar homologação antes de decidir se
   a migração é aceite. Confirmar que a base alvo é a mesma da baseline guardada.
2. Guardar uma inspecção do estado com falha para diagnóstico. Comparar os objectos
   actuais com a baseline e com a migração; não pode haver alterações posteriores
   nem objectos adicionais dependentes. Dependências em SQL dinâmico não são todas
   detectadas pelo PostgreSQL: esta revisão humana é necessária.
3. Obter autorização expressa **para a recuperação**. Um operador técnico deve
   rever [fase1-empty-baseline.sql](../../supabase/recovery/fase1-empty-baseline.sql).
   Só nessa ocasião, na mesma sessão do SQL Editor, preceder o ficheiro integral
   com `SET gestor.phase1_recovery='authorized';`. O sinalizador é protecção contra
   execução acidental, não substitui permissões ou autorização humana.
4. Executar o bloco completo uma única vez. A transacção bloqueia escritas
   concorrentes nas tabelas abrangidas e em auth.users. Recusa contas Auth, Storage, dados
   de utilização e alterações aos catálogos iniciais. Remove só os objectos
   enumerados, com RESTRICT e sem CASCADE. Se houver erro, não forçar: executar
   ROLLBACK se a sessão continuar em transacção e investigar. Não eliminar dados,
   desactivar RLS/triggers ou trocar RESTRICT por CASCADE para ultrapassar guardas.
5. Voltar a executar a consulta de baseline. Comparar as linhas 01 a 14 com a
   exportação anterior; a linha 00 tem um instante novo e não tem de ser igual.
   A mesma referência do projecto e o registo manual de Auth também têm de
   corresponder. Diferenças inesperadas exigem investigação; não declarar sucesso
   apenas porque o SQL terminou. Guardar a evidência e manter a aplicação parada
   até nova decisão. Não reaplicar a migração automaticamente.

Os hashes MD5 no inventário/catálogos são comparadores de alterações, não
assinaturas de autenticidade. A integridade da migração continua fixada por
SHA-256 `56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58`.

## Ensaio e estado de prontidão

O ensaio usa PostgreSQL real isolado via PGlite, já presente nas dependências.
Não tem clientes Supabase nem ligações remotas. Auth/Storage são tabelas mínimas
de teste; não se simula o serviço Auth, Storage de ficheiros ou event triggers
geridos pelo Supabase. Um objecto anterior com dados e uma view servem de
testemunho de preservação.

Os sete casos em tests/unit/migration-recovery.test.ts verificam: migração com
COMMIT, recuperação numa segunda transacção, igualdade do inventário anterior,
preservação dos dados testemunho e reaplicação local; recusas sem confirmação,
com conta Auth, conteúdo Storage, dados de utilização, catálogo alterado e dependência adicional.
No caso de dependência, a falha ocorre depois de várias instruções DROP e o
ROLLBACK tem de preservar a totalidade do estado anterior à tentativa.

Execução local final: npm run lint e npm run typecheck aprovados; npm test com
**57 testes aprovados em 7 ficheiros**, incluindo os sete casos de recuperação.
Nenhuma dependência foi instalada/actualizada para este ensaio e não houve
diferenças em package.json/package-lock.json ou na migração original. As primeiras
tentativas detectaram uma ambiguidade de sintaxe no novo SQL e a dependência
cruzada das políticas RLS; ambas foram corrigidas no ficheiro de recuperação,
sem alterar a migração. O resultado de 57 aprovados refere-se aos ficheiros finais.

Actualização: a baseline real foi recebida e revista, sem conflito impeditivo
identificado nos objectos/dados inventariados. A análise vigente está em
[analise-baseline-real.md](analise-baseline-real.md), incluindo o hash do CSV.
**NÃO APTO ainda para solicitar execução remota:** faltam as confirmações do
registo privado completo do painel e a revisão dos privilégios
efectivos do operador, que o inventário não exporta. São passos gratuitos de
leitura/documentação; não é necessário repetir todo o inventário se o projecto
não mudou. APTIDÃO para a primeira migração não equivale a homologação de Auth ou
prontidão de produção. Não foi contratado nenhum recurso pago.

Identidade do projecto, cópia privada adicional e quatro estados Auth foram
confirmados pelo responsável após a análise do CSV. O
[guia passo a passo](guia-registo-painel.md) e o
[modelo](modelo-registo-painel.txt) orientam a recolha restante sem alterar o painel.
