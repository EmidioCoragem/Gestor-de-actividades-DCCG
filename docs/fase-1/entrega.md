# Relatório da Fase 1

## Lote 1 — build e testes locais — 9 de Novembro de 2026

O [relatório técnico do Lote 1](etapa-c/lote-1-build-testes-locais.md) documenta a reprodução da saída vazia de TypeScript e a limitação de comunicação com processos filhos no sandbox Cloud. A comparação autorizada fora do sandbox devolveu JSON válido, refutando a hipótese de cache de compilação. Não foi necessária alteração funcional, de dependências ou de configuração de segurança. Foi corrigido apenas o encerramento da fixture Auth, com uma linha `gracefulShutdown` na configuração Playwright, após prova de pastas temporárias órfãs e revisão de Segurança. A primeira execução Auth mobile teve 18/19 aprovações; a causa da falha de hidratação continua indeterminada e não é declarada corrigida por essa linha. Comandos, resultados separados e limites constam do relatório, sem extrapolar para homologação real Supabase. Os Lotes 2–4 e a Fase 2 não foram iniciados.

## Progresso consolidado — 9 de Novembro de 2026

**Registo exclusivamente documental aprovado pelo responsável**, reutilizando a revisão dos cinco agentes e as evidências anteriores. Sem nova auditoria, testes funcionais, SQL, migração, bootstrap, exportação, transferência ou alteração de infra-estrutura. Branch `fase-1-autenticacao-permissoes`, sem merge na main e sem início da Fase 2.

| Área | Estado | Alcance e pendência |
|---|---|---|
| Cenários A — empresarial e B — departamental | Planeamento aprovado e registado | Código único, âmbito configurável e segurança equivalente; configuração A/B não implementada |
| Funcionalidades e identidade visual | Requisitos originais preservados | Sem remoção de módulos ou alterações funcionais/visuais; fases futuras mantidas |
| Google Drive | Opção definitiva aprovada no planeamento | Dados reais exigem autorização da conta/destino; pasta pessoal declarada apenas para fictícios cifrados |
| Fundação da Fase 1 | Código existente; migração original já aplicada uma vez | Não repetir a original; homologação integral Auth/SMTP/PostgREST ainda pendente |
| Inventário remoto de leitura | Encerrado e aceite com ressalvas | Não repetir sem motivo; db_pre_request efectivo indeterminado, sem impedimento SQL isoladamente demonstrado |
| Incremental AT/AF | Preparada no código; não instalada remotamente | Aplicação única, pós-verificação e homologação activa sob autorização própria; bootstrap não executado |
| Clientes PostgreSQL e age no Codespaces | Instalação/versões confirmadas por saídas do operador | Clientes 17.11 e age 1.1.1; não demonstram exportação ou restauro nem o estado do ambiente Cloud |
| Ensaio criptográfico local | APTO no âmbito fictício observado | Conteúdo/SHA-256 coincidentes, adulteração recusada, modos 0700/0600 e limpeza concluída; chave descartável |
| Recuperação PostgreSQL | Planeada; ainda não demonstrada | Complemento Auth/papéis, exportação privada, servidor isolado, restauro e reconciliação pendentes |
| Custódia e cópias independentes | Estratégia preparada; não operacionalmente demonstrada | Sem chave empresarial definitiva ou envio de dados reais; mecanismo de custódia ainda por decidir |
| Produção A ou B | Não homologada nem autorizada para entrada em serviço | Responsáveis, alojamento, isolamento, capacidade/custos, RPO/RTO e retenção por aprovar |

As confirmações Codespaces/Supabase provêm dos resultados e declarações apresentados pelo responsável na preparação supervisionada, não de acesso remoto nesta tarefa. A ausência de confirmação de BitLocker/cifra de disco no Windows corporativo limita a decisão de custódia definitiva; não autoriza contornar políticas. A pasta privada permanente e a chave definitiva não foram criadas por esta actualização; o ensaio removido usou apenas área temporária e dados fictícios.

Referências vigentes: [arquitectura e configurações propostas](arquitectura.md#cenários-permanentes--decisão-aprovada), [implantação e responsabilidades](supabase.md#plano-futuro-de-implantação) e [homologação parcial do logout](etapa-c/relatorio-homologacao-at.md). Os relatos seguintes conservam a versão e o âmbito históricos; não representam novas execuções ou homologação integral.

**Caminho crítico:** delimitar dependências Auth/custódia → demonstrar recuperação PostgreSQL → decidir a instalação incremental AT/AF e verificar o estado instalado → concluir homologação da Fase 1. Cada operação exige autorização aplicável; fase seguinte e produção não começam automaticamente. Restauro de ensaio aprovado não autoriza reversão automática após COMMIT.

## Homologação parcial — 5 de Novembro de 2026

**AUTH-02-AT-LOGOUT-01: APTO**, por autorização expressa de registo documental do responsável. No código d0d8b90, o clique pessoal de logout regressou a /entrar; Auth e API gateway registaram HTTP 204; a leitura final confirmou uma conta/email confirmado/perfil inactive, zero papéis e zero sessões Auth. O responsável confirmou uma única visita posterior a /, redireccionada para /entrar sem Dashboard, menus administrativos ou dados empresariais. Ver [evidências, origem e limites do ensaio](etapa-c/relatorio-homologacao-at.md) e [CSV por cenário](etapa-c/evidencias.csv).

Este caso não homologa toda a Fase 1, outros dispositivos, todos os tempos de expiração, perfis activos ou a separação AT/AF. Os relatos iniciais abaixo mantêm valor histórico; para o fecho deste caso prevalece esta actualização. Não foi executado bootstrap nem foram atribuídos papéis ou activados perfis.

O [próximo bloco AT/AF](etapa-c/bootstrap-at-af.md) está apenas planeado e exige autorizações separadas. A revisão estática identificou uma condição prévia de segregação nas concessões/capacidades técnicas a terceiros; o plano impede avançar para o bootstrap sem a resolver. A autorização actual limita-se à documentação, sem código, SQL remoto, criação de AF, emails, migrações, publicação ou merge.

## Revisão de segregação AT/AF — 5 de Novembro de 2026

A [auditoria local e proposta técnica](etapa-c/revisao-segregacao-at-af.md) identifica uma falha crítica nas regras actuais: access.manage permite concessão/revogação de technical_admin a terceiros e clonagem de users.manage. O bootstrap está **NÃO APTO** até correcção e homologação específicas. Preparados apenas documentação, testes em memória e rascunho SQL em supabase/proposals, fora das migrações executáveis. A migração original e o código de produção não foram alterados; nenhuma operação remota foi executada. Os resultados desta revisão e as validações ainda pendentes estão discriminados no relatório. A autorização desta tarefa amplia o âmbito local histórico de documentação para auditoria/proposta/testes, sem autorizar instalação ou bootstrap.

## Correcção local PKCE/CSRF — 5 de Novembro de 2026

A [análise de Origin: null e a correcção de hidratação](etapa-c/correccao-pkce-csrf-hidratacao.md) demonstra que o formulário SSR activo antes do React, com no-referrer, podia efectuar POST nativo com origem nula. Os controlos ficam bloqueados até hidratação, mantendo a recusa de origens inválidas e sem alterar AT/AF. O relatório distingue os cenários aprovados, a execução integral interrompida e a homologação remota ainda não autorizada.

## Implementação local da segregação AT/AF — 5 de Novembro de 2026

Por autorização expressa, foi preparada a [correcção local com migração incremental e guarda na Server Action](etapa-c/implementacao-segregacao-at-af.md), acompanhada de testes adversariais, concorrência PostgreSQL nativa e checks de aplicação isolados. A migração original permanece intacta. Este bloco não altera o estado remoto nem autoriza bootstrap; os resultados efectivamente aprovados, bloqueados e pendentes constam do relatório técnico.

## Recuperação PKCE com SMTP padrão — 4 de Novembro de 2026

Implementado o callback code com exchangeCodeForSession, mantendo token_hash/verifyOtp. As Server Actions/Route Handlers exigem escrita de cookies; a intenção de recuperação é ligada ao verificador e destinatário e a definição de password exige uma autorização curta de uso único ligada à sessão validada. Nenhuma operação remota foi executada. Ver [procedimento vigente, limites e autorização futura](etapa-c/pkce-smtp-padrao.md) e [verificação local desta alteração](etapa-c/verificacao-pkce.md). Os estados efémeros são locais ao processo Node, adequados ao ensaio privado no Codespaces; várias instâncias de produção exigiriam armazenamento partilhado e revisão específica.

## Correcção de confirmação e recuperação — 3 de Novembro de 2026

Preparada a [correcção SSR e o roteiro de recuperação de AT](etapa-c/correccao-confirmacao-e-recuperacao.md): origem canónica APP_ORIGIN, verificação servidor token_hash, modelos de convite/recuperação compatíveis com o painel, cookies Secure no HTTPS e protecções de logs/redireccionamentos. Os [resultados desta alteração](etapa-c/verificacao-correccao-auth.md) distinguem testes locais de homologação real. O responsável confirmou AT com email confirmado, perfil inactive e zero papéis; nenhuma operação Auth remota foi executada pelo assistente. Configurações do painel, recuperação por email e bootstrap continuam a exigir autorização separada.

## Preparação da Etapa C — 3 de Novembro de 2026

O [plano de homologação funcional e de segurança](etapa-c/plano.md) define oito identidades fictícias, bootstrap separado AT/AF, isolamento entre dois departamentos, controlo de auto-elevação, sessões, convites, recuperação, auditoria e limpeza. Os mecanismos PGlite e descritores PostgREST não executam operações remotas. A homologação real continua pendente de autorização expressa para contas, dados, bootstrap, mutações e emails; não houve alterações Supabase, Auth/SMTP, publicação ou merge. O [registo de verificações desta preparação](etapa-c/verificacao-local.md) separa resultados locais de pendências reais.

## Actualização vigente — 3 de Novembro de 2026

O responsável confirmou a execução única e autorizada da migração original no Supabase de desenvolvimento: Success. No rows returned. Validação posterior reportada: 16 tabelas, 16 com RLS, 13 políticas e 1 trigger de perfis. Estrutura principal validada pelo operador; a auditoria de catálogo/ACLs do CSV real foi entretanto aceite, com falsos positivos de NOT NULL/CRLF resolvidos (ver analise-pos-migracao-real.md). A homologação real com contas continua pendente de nova autorização. Não reaplicar a migração.

A migração mantém SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58. Seguir [validacao-pos-migracao.md](validacao-pos-migracao.md) para a única consulta de leitura e [plano-homologacao.md](plano-homologacao.md) para os testes futuros. Nenhuma conta, alteração SMTP/Auth, publicação ou merge foi autorizada nesta preparação. O assistente não executou a migração remota.

As secções seguintes preservam a entrega inicial e respectivos resultados históricos. Para o estado actual, prevalece esta actualização e o relatório de segurança.

## Âmbito e base

Autorização: docs/requisitos-fase-1.md. Base preservada: aed03d0 na fase-0-fundacao. Main foi consultada por Git (058e03a, commit inicial). A consulta ao PR #1 foi recusada pela API; a aprovação da Fase 0 foi fornecida expressamente pelo responsável. Branch desta entrega: fase-1-autenticacao-permissoes. Não houve merge, publicação ou alteração de recursos Supabase/ERP.

O PR incremental deve ter como base fase-0-fundacao enquanto o PR #1 não estiver integrado por decisão humana; assim, a revisão não duplica a Fase 0. O workflow foi adaptado para verificar PRs para main ou para fase-0-fundacao. Não contém deploy.

## Implementado no código

- Identidade azul-escuro corporativa centralizada em tokens, logótipo G, nome e subtítulo mantidos, sem redesenhar o Dashboard.
- Supabase Auth SSR: entrada, recuperação, confirmação de convite/recuperação, definição de palavra-passe, saída e renovação de cookies via proxy. Estado activo obrigatório no servidor, sem registo público na interface.
- Onze rotas originais preservadas em grupo privado; metadados, navegação e identificação autenticada. Configuração ausente gera bloqueio explícito, sem sessão fictícia.
- Administração: convite condicionado a permissão global/chave administrativa servidor, estados, associações com histórico, unidades/cargos/chefias/responsáveis, perfis/capacidades e concessões com âmbito/vigência e revogação.
- Migração PostgreSQL versionada com 16 tabelas, integridade, índices, RLS, mutações transaccionais e auditoria. Sem concessões a novas contas. Proibição de auto-elevação, alterações do próprio papel e autovalidação. Reorganização não pode ser usada para ampliar o próprio acesso.
- Centros de Custo: fundação relacional independente de unidades e contratos de lote/preview, preservando códigos textuais e histórico. Sem importador funcional.
- ERP: contratos desacoplados e descritores SAP/Primavera sem implementação de rede; IDs externos, fonte, autoridade, conflitos e indisponibilidade previstos.

## Verificações

- npm ci em pasta limpa com Node 24/npm 11.9.0: aprovado.
- npm ci em pasta limpa com Node 24.22.2/npm 11.19.1: aprovado, 416 pacotes nesta plataforma.
- Não se alterou nenhuma versão de dependência anteriormente fixada. A única dependência nova é @electric-sql/pglite 0.5.13, apenas desenvolvimento, para executar PostgreSQL real isolado nos testes.
- npm audit: zero vulnerabilidades reportadas no momento da execução.
- ESLint e TypeScript: aprovados.
- Vitest: 46 testes aprovados; inclui 25 testes de PostgreSQL/RLS/integridade, além de permissões/contratos/configuração e navegação.
- Playwright: 42 testes aprovados nos formatos computador, tablet e telemóvel, forçando Supabase ausente: bloqueio das onze rotas privadas, entrada/recuperação, callback inválido, formulário desactivado, identidade azul e ausência de overflow horizontal.
- Build Next.js: aprovado com rotas privadas dinâmicas, páginas públicas e proxy.
- Uma tentativa inicial do Playwright foi impedida por um servidor de desenvolvimento anterior da própria tarefa na porta 3000. Esse servidor foi identificado e encerrado; o ensaio novo executou e passou os 42 testes.
- Os antigos 45 testes públicos da Fase 0 estão preservados em tests/phase0, mas não foram executados nem contados como aprovados nesta entrega. A Fase 1 exige protecção das rotas, pelo que os seus pressupostos públicos deixaram de ser válidos.

## Não validado e pendências da entrega inicial — histórico

Na entrega inicial não havia URL/chave pública Supabase nem chave administrativa configuradas, e nenhuma migração tinha sido aplicada remotamente. Essa situação histórica é actualizada no resumo acima. Os testes PGlite criam auth.users e auth.uid de teste para simular o contexto JWT já validado; verificam o comportamento PostgreSQL e não a emissão de JWT ou os serviços Auth/PostgREST.

Pendentes: configuração de projecto exclusivamente de desenvolvimento, aplicação da migração, desactivação de signup público no fornecedor, SMTP/templates/URLs autorizadas, bootstrap do primeiro responsável e homologação real de login, recuperação/convites, cookies, suspensão, acções administrativas e chamadas directas à API por contas de âmbitos diferentes. Não se declara a Fase 1 operacional nem pronta para produção com base apenas nos testes locais.

Os avisos npm de ESLint 9 descontinuado e postinstall do unrs-resolver permanecem; não se actualizaram pacotes nem se desactivou verificação para ocultá-los. A API GitHub tem sido recusada por 403 neste ambiente; confirmar no resultado final se a criação do Draft PR foi possível. Guardar uma branch por Git não prova que um PR foi criado ou que os checks GitHub foram executados.

Ainda preparados para fases posteriores: delegação temporária (sem concessão de poderes agora), importações Excel/CSV, sincronização/ERP, organograma interactivo e os módulos operacionais. Supabase real e revisão de segurança externa continuam pré-requisitos de homologação. Não iniciar Fase 2, fazer merge ou publicar sem autorização.

## Testar no Codespaces

1. Preservar alterações locais e parar o servidor antigo antes de trocar de branch.
2. git fetch origin; git switch fase-1-autenticacao-permissoes.
3. npm ci; npm run dev. Manter a porta 3000 Private.
4. Sem Supabase, abrir /entrar para a página azul de acesso desactivado e / para observar o bloqueio /configuracao.
5. No projecto de desenvolvimento corrente, a migração já está aplicada: seguir validacao-pos-migracao.md e plano-homologacao.md, sem a reaplicar. Para configuração histórica de outro projecto, consultar supabase.md. Nunca enviar chaves no chat ou no Git.
