# Relatório da Fase 1

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
