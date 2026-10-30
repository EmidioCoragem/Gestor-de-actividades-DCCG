# Portal Empresarial Integrado

Comunicar em português de Angola, com explicações acessíveis. O escopo autorizado é apenas a Fase 0 do documento docs/requisitos.md. Pedir aprovação explícita antes de iniciar a Fase 1 e antes de publicar em produção.

- Usar o checkout existente: cada tarefa Cloud já é isolada. Não criar worktrees salvo pedido explícito.
- Node 24, Next.js App Router, TypeScript strict, Tailwind 4. Não acrescentar dependências sem necessidade.
- Interface: src/app e src/components. Catálogo: src/modules/catalog.ts. Integrações: src/lib. Regras de negócio, autorização e repositórios de dados futuros ficam em módulos separados.
- Não apresentar números fictícios como resultados reais. Não cadastrar a reconciliação bancária de exemplo em produção.
- Não implementar processos contabilísticos, cálculos fiscais, aprovações operacionais ou autenticação nesta fase.
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
