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

O `package-lock.json` está incluído e foi sincronizado pelo npm. Usar Node 24 e npm 10 ou 11 (referência: npm 11.9.0). Se `npm ci` falhar, guardar o erro e verificar as versões; não usar `npm install` para ocultar a incompatibilidade. Não editar o lockfile manualmente. Não é necessário instalar software no computador pessoal.

A aplicação escuta a porta 3000. Utilizar o encaminhamento de portas ou a pré-visualização **se o serviço Cloud utilizado disponibilizar esse recurso**. No GitHub Codespaces, abrir a porta 3000 no separador Ports com visibilidade Private. A interface de onboarding deste ambiente não disponibiliza pré-visualização web; não existe aqui um endereço público para abrir a aplicação. Pedidos HTTP locais servem apenas para validação interna. Não publicar em produção para contornar esta limitação.

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
- [Entrega e verificações iniciais](docs/entrega-fase-0.md)
- [Revisão final e actualização do Codespaces](docs/revisao-final-fase-0.md)
- [Confirmação da instalação remota e comparação do lockfile](docs/confirmacao-instalacao-remota.md)
- [Instruções para agentes](AGENTS.md)

Rever o diff antes de integrar. Não iniciar a Fase 1 nem publicar sem aprovação explícita do responsável.
