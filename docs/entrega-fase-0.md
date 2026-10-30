# Entrega para revisão — Fase 0

## Alterações

- Configuração de Next.js App Router, React, TypeScript strict, Tailwind, ESLint e Node 24, com package-lock.json para instalação repetível.
- Onze páginas, navegação lateral, cabeçalho e menu móvel; layout empresarial verde e neutro, indicadores sem dados e estados ainda não implementados.
- Catálogo partilhado de módulos, componentes comuns e fábricas Supabase isoladas, sem credenciais ou chamadas activas.
- Requisitos originais, arquitectura, matriz de permissões, proposta relacional, README e AGENTS.md.
- Vitest para configuração Supabase e Playwright para navegação desktop/móvel e páginas inexistentes.

## Verificações efectivamente realizadas

- `npm install`: concluído usando proxy existente e autorização de execução; o primeiro ensaio dentro da sandbox falhou por restrição de rede.
- `npm ci --cache /workspace/.npm-cache --offline`: concluído, confirmando o lockfile e a disponibilidade das dependências em cache.
- ESLint e TypeScript: aprovados; o erro inicial de nomenclatura no teste foi corrigido.
- Vitest: 5 testes aprovados.
- `npm run build`: compilação aprovada com todas as rotas. O primeiro ensaio dentro da sandbox foi bloqueado pela criação de uma porta interna do Turbopack; a execução autorizada passou.
- Servidor de compilação iniciado; GET `/`, `/actividades` e `/fecho-mensal`: HTTP 200 com conteúdo esperado.
- Playwright contra o servidor de compilação: 24 testes aprovados, incluindo desktop e emulação móvel em Chromium do sistema.
- Playwright com arranque automático de `npm run dev`: 24 testes aprovados no ensaio final. Um ensaio anterior teve 22 aprovados e 2 interrupções móveis durante o ajuste/reinício da configuração; a repetição completa passou. A origem local 127.0.0.1 foi autorizada explicitamente para HMR.
- `git diff --check`: aprovado. Leitura GitHub confirmada com `git ls-remote`.

## Limitações e configurações

Não há autenticação, base de dados, RLS, gravação de actividades, cálculos contabilísticos, notificações funcionais ou utilizadores reais. A integração Supabase é apenas estrutura e necessita de implementação e configuração na Fase 1. Não utilizar esta versão para dados confidenciais.

O download de Chromium pelo Playwright foi recusado com HTTP 403 pela política de rede. Foi utilizado `/usr/bin/chromium`, já instalado, sem contornar a política. Não é preciso acrescentar domínios para o fluxo validado. O npm assinala ESLint 9 como descontinuado; permanece compatível com a configuração Next seleccionada e passa a verificação. Actualizar a ferramenta numa manutenção futura, após verificar compatibilidade.

No ambiente de onboarding não há pré-visualização web pública suportada. O README descreve a porta 3000 e a utilização de encaminhamento apenas onde o serviço Cloud disponibilizar esse recurso. A validação local não equivale a publicação na internet.

`install_script` e `start_skill` foram guardados no rascunho do ambiente; não constituem publicação nem prova de restauração numa nova tarefa. Rever e guardar as definições do ambiente e publicar o ambiente de desenvolvimento quando pretendido. Isso é distinto de publicar a aplicação em produção.

## Revisão no GitHub

Título sugerido: `feat: preparar fundação e interface do Portal Empresarial (Fase 0)`.

Descrição: O repositório continha apenas um README. Esta alteração acrescenta a base Next.js, onze páginas com estados sem dados, navegação responsiva, estrutura Supabase, documentação e testes. Não implementa autenticação ou processos operacionais. Validado por compilação, lint, tipos, 5 testes unitários e 24 testes de interface no servidor de compilação.

As alterações estão no checkout para revisão; não foi executado push, merge, renomeação do repositório ou publicação. Não foi criado um PR remoto.

A Fase 1 está pendente de aprovação explícita do responsável, conforme secções 18 e 19 dos requisitos.
