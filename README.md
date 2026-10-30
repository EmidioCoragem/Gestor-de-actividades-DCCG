# Gestor de Actividades — Gestão Integrada

Fase 1: autenticação, utilizadores, estrutura organizacional e permissões. A interface adopta azul-escuro corporativo, mantendo os módulos e a estrutura do Dashboard aprovados. Repositório GitHub inalterado: EmidioCoragem/Gestor-de-actividades-DCCG; identificador npm portal-empresarial mantido por compatibilidade.

## Estado actual

O código inclui Supabase Auth com sessões verificadas, rotas privadas, convites administrativos, organização e atribuições, políticas RLS e auditoria. **Não há projecto Supabase configurado nesta máquina; os fluxos Auth/SMTP/PostgREST reais ainda não estão homologados.** Sem configuração, / redirecciona para /configuracao e a entrada fica desactivada. Isso é o comportamento de protecção esperado, não uma sessão de demonstração.

Os módulos de actividades, fecho, KPIs, planeamento e relatórios continuam como fundação das fases futuras; não há cálculos ou dados empresariais fictícios. Centros de Custo e SAP/Primavera têm apenas modelo/contratos/documentação, sem importador ou conectores reais. Não foi iniciada a Fase 2.

## Desenvolvimento inteiramente online

Na pasta do repositório no Codespaces, usar Node 24 (referência npm 11.9.0; npm 11.19.1 também verificado na Fase 0):

```sh
npm ci
npm run dev
```

Abrir a porta 3000 em Ports com visibilidade **Private**. O Dev Container mantém encaminhamento explícito e pode arrancar automaticamente ao ligar o editor. Para aplicar alterações ao devcontainer.json existente, executar Codespaces: Rebuild Container uma vez; guardar alterações locais antes de actualizar. O ambiente Codex usa /workspace/Gestor-de-actividades-DCCG; Codespaces usa normalmente /workspaces/Gestor-de-actividades-DCCG.

Para entrar de facto, configurar um projecto Supabase **de desenvolvimento** segundo [este guia](docs/fase-1/supabase.md). Não usar credenciais de produção, não enviar chaves no chat e não colocar service_role no browser. As variáveis estão descritas em .env.example. Não executar npm install para esconder um erro de npm ci; preservar e diagnosticar a mensagem.

## Verificações

```sh
npm run lint
npm run typecheck
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Nesta máquina Chromium está instalado. Noutro ambiente, preparar o navegador oficial do Playwright e omitir a variável de caminho. O npm test inclui um PostgreSQL isolado PGlite para executar a migração e testar RLS/integridade, sem serviços de produção. É dependência apenas de desenvolvimento, não um banco de dados da aplicação.

O Playwright da Fase 1 força configuração Supabase ausente num servidor próprio e verifica bloqueio de todas as rotas privadas, formulários públicos e identidade/responsividade em computador, tablet e telemóvel. Os antigos testes de páginas públicas da Fase 0 foram preservados em tests/phase0 e não são executados: esse comportamento público deixou de ser válido. A homologação autenticada real é separada e ainda pendente.

## Documentação

- [Requisitos originais v1.4](docs/requisitos.md) e [autorização consolidada da Fase 1](docs/requisitos-fase-1.md).
- [Relatório de entrega e resultados](docs/fase-1/entrega.md).
- [Arquitectura da Fase 1](docs/fase-1/arquitectura.md).
- [Modelo, RLS e matriz de permissões](docs/fase-1/seguranca-e-dados.md).
- [Configuração e homologação Supabase](docs/fase-1/supabase.md).
- [Centros de custo, importações e ERP](docs/fase-1/integracoes.md).
- [Pré-visualização privada no Codespaces](docs/previsualizacao-codespaces.md).
- [Instruções para agentes](AGENTS.md).

Os documentos anteriores descrevem entregas históricas da Fase 0. Sem merge automático, sem portas públicas e sem publicação em produção. A Fase 2 só começa após aprovação expressa.
