# Portal Empresarial Integrado

Fundação técnica (Fase 0) no repositório `Gestor-de-actividades-DCCG`. O nome `portal-empresarial` identifica a aplicação; nenhum repositório foi criado ou renomeado.

## O que está incluído

Next.js App Router, TypeScript strict, Tailwind CSS, ESLint, navegação responsiva e onze páginas: Dashboard, Actividades, Fecho Mensal, KPIs, Centros de Custo, Estrutura Organizacional, Hierarquia e Permissões, Planeamento e Cronograma, Relatórios, Notificações e Administração.

São páginas iniciais sem dados, autenticação ou operações reais. Supabase Auth, PostgreSQL e Storage só têm a estrutura de integração preparada. Não utilizar informação confidencial nem publicar esta versão como sistema operacional.

## Trabalhar inteiramente na nuvem

No terminal do ambiente Cloud, com Node 24:

```sh
cd /workspace/Gestor-de-actividades-DCCG
npm ci
npm run dev
```

Se ainda não existir `package-lock.json`, executar `npm install` uma vez e incluir o lockfile na revisão. Não editar o lockfile manualmente. Não é necessário instalar software no computador pessoal.

A aplicação escuta a porta 3000. Utilizar o encaminhamento de portas ou a pré-visualização **se o serviço Cloud utilizado disponibilizar esse recurso**. A interface de onboarding deste ambiente não disponibiliza pré-visualização web; não existe aqui um endereço público para abrir a aplicação. Pedidos HTTP locais servem apenas para validação interna. Não publicar em produção para contornar esta limitação.

## Verificação

```sh
npm run lint
npm run typecheck
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Nesta imagem Cloud usa-se o Chromium já instalado. Noutros ambientes, instalar o navegador com `npx playwright install chromium` (requer acesso ao CDN oficial) e omitir a variável de caminho.

O Playwright inicia o servidor de desenvolvimento e verifica navegação, estados não implementados e dimensão móvel/computador. O Vitest verifica configuração ausente, parcial, insegura e completa do Supabase. Testes de permissões reais serão adicionados juntamente com a implementação da Fase 1. `npm run start` serve a compilação após `npm run build`.

## Configuração futura

A Fase 0 funciona sem `.env.local`. Para integração futura, copiar `.env.example` para `.env.local` e configurar apenas a URL e a chave pública do projecto Supabase, através das definições seguras do ambiente. Nunca incluir `service_role` em variáveis públicas. Autenticação, políticas RLS, buckets privados, renovação de sessão, migrações e autorização ainda serão implementados.

## Documentação e revisão

- [Requisitos completos](docs/requisitos.md)
- [Arquitectura](docs/arquitectura.md)
- [Permissões](docs/permissoes.md)
- [Modelo de dados](docs/modelo-de-dados.md)
- [Entrega e verificações](docs/entrega-fase-0.md)
- [Instruções para agentes](AGENTS.md)

Rever o diff antes de integrar. Não iniciar a Fase 1 nem publicar sem aprovação explícita do responsável.
