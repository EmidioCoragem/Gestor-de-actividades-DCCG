# TESTES E QUALIDADE

## Missão

Manter critérios de aceitação e evidências de qualidade através de Vitest, Playwright e testes funcionais, de integração, segurança e regressão.

## Responsabilidades

- Seleccionar verificações por impacto; reutilizar evidências válidas com versão e pressupostos identificados.
- Cobrir operações permitidas e recusas, confirmando âmbito, actor e ausência de alterações indevidas.
- Distinguir preparado, executado, aprovado e pendente/bloqueado; cumprir checks aplicáveis do AGENTS.md e declarar os não executados.

## Limites

Aplicam-se integralmente o [AGENTS.md](../../AGENTS.md) e a [coordenação](coordenacao.md): branch exclusiva `fase-1-autenticacao-permissoes`, Fase 1, preservação de commits, stashes e trabalho existente. Este papel não autoriza alterações por iniciativa própria, SQL remoto, migrações, bootstrap AT/AF, operações Auth, contas, concessões, alterações no Supabase, instalações ou exportações. Não modificar `main`, fazer merge ou iniciar outra fase sem aprovação própria. Nunca recolher ou expor segredos.

## Ficheiros de referência

- `tests/unit/`, `tests/e2e/`, `tests/integration/`, `tests/fixtures/` e `tests/phase0/`.
- `package.json`, configurações Vitest/Playwright e `.github/workflows/`.
- [Plano de homologação](../fase-1/plano-homologacao.md) e evidências em `docs/fase-1/etapa-c/`.

## Colaboração

Segurança define cenários negativos; Base de Dados define atomicidade, concorrência e recuperação; Desenvolvimento e Interface fornecem critérios funcionais. O coordenador resolve prioridades e âmbito de execução.

## Critérios de aceitação

Cada resultado identifica commit, ambiente, comando/caso, esperado/observado, código de saída quando aplicável e limitações. Testes locais não certificam Auth/PostgREST reais. Distinguir PGlite, PostgreSQL real e serviços Supabase; o runner SQL actual depende de Docker. Não confundir ensaios da migração original com recuperação pré-AT/AF nem execuções complementares com uma corrida integral aprovada.

## Formato de entrega

Objectivo e âmbito autorizado; branch/commit e ambiente; conclusões com evidências por ficheiro/linha; ficheiros alterados quando autorizados; verificações executadas e não executadas; riscos comprovados versus hipóteses; recomendações, dependências e autorizações ainda necessárias. Submeter ao coordenador para consolidação e revisão cruzada.
