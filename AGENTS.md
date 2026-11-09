# Gestor de Actividades

Comunicar em português de Angola, com explicações acessíveis. A Fase 1 está autorizada pelo documento docs/requisitos-fase-1.md. Não iniciar a Fase 2, fazer merge ou publicar em produção sem aprovação explícita.

- Usar o checkout existente: cada tarefa Cloud já é isolada. Não criar worktrees salvo pedido explícito.
- Node 24, Next.js App Router, TypeScript strict, Tailwind 4. Não acrescentar dependências sem necessidade.
- Interface: src/app e src/components. Catálogo: src/modules/catalog.ts. Integrações: src/lib. Regras de negócio, autorização e repositórios de dados futuros ficam em módulos separados.
- Não apresentar números fictícios como resultados reais. Não cadastrar a reconciliação bancária de exemplo em produção.
- Implementar apenas autenticação, organização e permissões da Fase 1; sem processos contabilísticos, cálculos fiscais ou aprovações operacionais.
- Nenhum segredo no Git, no browser ou em logs. Apenas URL e chave pública Supabase em NEXT_PUBLIC_*. service_role nunca no cliente.
- Fases futuras: autorização no servidor, RLS deny-by-default, Storage privado e auditoria. Menus não são controlo de segurança.
- Instantes em UTC; datas contabilísticas locais distintas; fuso Africa/Luanda. Não presumir adiamento de prazos legais.
- Verificar npm run lint, npm run typecheck, npm test, npm run build e npm run test:e2e. Reportar testes não executados separadamente dos aprovados.
- Preservar alterações preexistentes; não efectuar reset, remoções destrutivas, push forçado ou publicação sem autorização.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Coordenação da equipa de agentes

- O Codex principal distribui tarefas e consolida decisões de arquitectura e alterações relevantes, seguindo [a coordenação da equipa](docs/agentes/coordenacao.md).
- Papéis: [Segurança](docs/agentes/seguranca.md), [Base de Dados](docs/agentes/base-de-dados.md), [Desenvolvimento](docs/agentes/desenvolvimento.md), [Interface e Experiência do Utilizador](docs/agentes/interface-ux.md) e [Testes e Qualidade](docs/agentes/testes-qualidade.md).
- Trabalhar exclusivamente na branch `fase-1-autenticacao-permissoes`. A equipa permanece na Fase 1 até homologação e aprovação; outra fase exige autorização expressa própria. Preservar commits, stashes e trabalho existente; não modificar `main` nem efectuar merge.
- Atribuir apenas um agente editor por ficheiro em cada tarefa, salvo coordenação explícita. Paralelizar tarefas independentes e efectuar revisão cruzada sem duplicar alterações.
- Papéis documentais não autorizam operações críticas: SQL remoto, migrações, bootstrap AT/AF, operações Auth, contas, concessões, alterações no Supabase, instalações e exportações exigem autorização específica aplicável.
- Preservar decisões aprovadas de arquitectura, segurança, permissões e identidade visual. Propor alterações relevantes antes de implementar. Reutilizar evidências válidas; repetir auditorias/testes apenas por motivo concreto e cumprir os checks aplicáveis à entrega.
- Estas definições não garantem instâncias persistentes ou activação automática. Configuração nativa de subagentes deve ser validada separadamente no cliente Codex utilizado; não criar TOML presumido.
