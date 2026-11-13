# Lote 2 — Consulta administrativa fiel

Data: 13 de Novembro de 2026 (Africa/Luanda). Branch: `fase-1-autenticacao-permissoes`. Base: `a8064a7bdfeda4a7cb12d16ef4f5b143f9d3852b`.

## Âmbito e coordenação

Consolidação do trabalho existente dos cinco agentes, após interrupção da coordenação. Desenvolvimento e Interface/UX implementaram as páginas e componentes; Base de Dados e Segurança reviram contratos e fronteiras de acesso; Testes preparou regressões. As revisões concluídas foram reutilizadas, sem nova auditoria integral. O coordenador conferiu o checkout e os ajustes finais. Este relatório descreve o checkout Cloud, não uma alteração executada no Codespaces.

Nenhuma operação remota, migração, bootstrap AT/AF, alteração de dependências, infra-estrutura, segredos ou stashes. Sem push, merge, Lote 3/4 ou Fase 2.

## Alterações presentes

- **Administração:** histórico tabular com pessoa, estado da conta, cargo, unidade, início, fim e vigência. Suporte a relações PostgREST em objecto ou array; designações indisponíveis usam mensagens neutras, sem apresentar UUID como nome. Estado da conta e vigência são conceitos separados.
- **Estrutura organizacional:** chefias e responsáveis apresentam pessoas, unidades, datas e vigência autorizadas, em vez de apenas contagens. Leitura dos campos existentes `unit_id`, `valid_from` e `valid_until`; inclui história encerrada e programada visível sob RLS, sem nova migração.
- **Hierarquia e permissões:** âmbitos e capacidades distinguem ausência válida de erro. Unidades inactivas podem identificar atribuições históricas; opções de novas atribuições continuam limitadas às activas. Só `scope_unit_id === null` representa Global; referência ausente nunca se converte em poder global.
- **Estados independentes:** lista vazia, recusa explícita e indisponibilidade técnica são distintos. Uma falha não elimina resultados válidos de outra secção nem expõe mensagens internas do backend. Lista vazia filtrada por RLS não permite inferir recusa.
- **Formulários dependentes:** campo e botão bloqueados quando as opções indispensáveis não foram carregadas; motivo associado ao formulário, estado pendente e mensagens acessíveis. O selector de unidade superior distingue raiz organizacional de âmbito global.
- **Carregamento:** três rotas com anúncio genérico acessível, sem antecipar dados pessoais ou contagens. Identidade visual e CSS existentes preservados.

As guardas `requireModule`, o cliente Supabase com sessão, as Server Actions, os controlos CSRF, RLS e a segregação AT/AF não foram alterados. Não foi acrescentado cliente privilegiado, RPC, concessão ou via alternativa. A ampliação da apresentação do histórico continua sujeita às políticas existentes.

## Ajustes mínimos na consolidação

A verificação dirigida inicial teve 67/69 aprovações: corrigido o estado HTTP não finito (`NaN`), que deve ser indisponível e não vazio, e alinhada uma expectativa com a mensagem neutra «Designação da unidade indisponível». O ESLint posterior identificou três construções de propriedades React nos novos testes; ajustadas sem alterar asserções ou desactivar regras.

## Verificações finais

As execuções sem saída final recuperável da sessão interrompida não contam como aprovação. Por esse motivo foram executados os checks finais abaixo, com variáveis Supabase removidas do ambiente dos processos de teste. Foi reutilizada a solução validada no Lote 1: processos locais fora do sandbox Cloud, sem alterar a aplicação ou a infra-estrutura.

- `npm run lint`: **APROVADO**, exit 0 após os ajustes de estilo dos testes (primeira execução: três erros, agora corrigidos).
- `npm test -- --maxWorkers=1`: **385/385 testes aprovados, 27/27 ficheiros**, exit 0; duração 99,08 s. Inclui os 69 testes novos deste lote.
- `npm run typecheck`: **APROVADO**, exit 0, numa cópia temporária completa sem `.env`, `.git` ou artefactos prévios.
- `node tests/run-app-isolated.mjs offline`: **APROVADO**, exit 0. Build Next.js 16.4.3 Webpack compilado em 18,3 s, incluindo verificação TypeScript; **63/63 testes Playwright aprovados** em 1,3 min, desktop/tablet/mobile. Inclui os 54 casos offline anteriores e nove casos novos. Cópia temporária, aplicação apenas em loopback e sem configuração Supabase.

O processo agregador terminou com exit 1 por conservar a primeira falha de lint; os restantes checks tiveram exit 0 e a execução separada final de `npm run lint` teve exit 0. Não se tratou de uma segunda falha de build ou de Playwright. O único aviso do browser runner foi a precedência de `FORCE_COLOR` sobre `NO_COLOR`, sem efeito funcional. As cópias temporárias do runner foram removidas no encerramento normal.

Os testes novos cobrem classificação de erros, vigência, SSR das páginas com respostas fictícias, referências ausentes, falhas independentes, guardas antes de criar cliente, bloqueio de formulários e apresentação/acesso por teclado em três formatos. Os testes browser dos componentes reais não equivalem a E2E administrativo autenticado com PostgREST real.

## Limitações e pendências preservadas

- A intermitência de hidratação Auth mobile do Lote 1 continua **indeterminada**. A revalidação anterior bem-sucedida não demonstrou a causa nem a correcção. A suite Auth não foi repetida neste lote, que não altera os seus formulários, sessões ou guardas.
- Homologação real de Auth/SMTP/PostgREST, permissões e RLS continua pendente de autorização própria. Testes locais não comprovam políticas instaladas no Supabase.
- Limites de linhas/paginação das consultas permanecem os anteriores; estas páginas não demonstram inventário completo para volumes superiores ao limite da API.
- Referências não devolvidas pela consulta mantêm designação indisponível, sem diagnosticar a causa por suposição.
- O selector preserva atribuições em vigor e programadas. A semântica SQL preexistente de encerramento de atribuições futuras não foi alterada nem homologada por este lote.
- O organograma interactivo e a demonstração administrativa autenticada mais ampla não foram implementados neste âmbito.

O próximo lote exige nova autorização; não há avanço automático.

## Resultado e ficheiros

**APTO para o âmbito local do Lote 2**, com as limitações acima. Sem conflitos ou erros de whitespace. Foram consolidados 14 ficheiros de implementação/testes e dois documentos.

- Páginas e carregamento: `src/app/(private)/administracao/{page,loading}.tsx`, `estrutura-organizacional/{page,loading}.tsx` e `hierarquia-permissoes/{page,loading}.tsx`.
- Componentes: `src/components/admin/{fields,mutation-form,read-state}.tsx`.
- Classificação/vigência: `src/modules/access/read-state.ts`.
- Regressões: `tests/unit/admin-{read-state,read-components,pages-read-state}.test.ts` e `tests/e2e/admin-read-components.spec.ts`.
- Documentação: este relatório e `docs/fase-1/entrega.md`.

A validação não aprova a entrada em produção nem encerra a homologação da Fase 1. Não existem testes finais deste lote bloqueados; a homologação remota não foi executada por estar fora da autorização. A intermitência Auth mobile permanece pendente.
