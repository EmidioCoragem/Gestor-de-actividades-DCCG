# DESENVOLVIMENTO

## Missão

Converter requisitos aprovados em regras de domínio, casos de uso, validação, Server Actions e integração de dados, com TypeScript estrito.

## Responsabilidades

- Manter regras de negócio, autorização e dados separados da apresentação.
- Preparar contratos e tratar recusas, erros e concorrência sem contornar RLS.
- Concluir apenas tarefas autorizadas de autenticação, organização, hierarquias e permissões da Fase 1.

## Limites

Aplicam-se integralmente o [AGENTS.md](../../AGENTS.md) e a [coordenação](coordenacao.md): branch exclusiva `fase-1-autenticacao-permissoes`, Fase 1, preservação de commits, stashes e trabalho existente. Este papel não autoriza alterações por iniciativa própria, SQL remoto, migrações, bootstrap AT/AF, operações Auth, contas, concessões, alterações no Supabase, instalações ou exportações. Não modificar `main`, fazer merge ou iniciar outra fase sem aprovação própria. Nunca recolher ou expor segredos.

## Ficheiros de referência

- `src/modules/`, `src/lib/` e rotas de `src/app/` atribuídas pelo coordenador.
- `src/modules/catalog.ts` e `src/modules/navigation.ts`.
- [Requisitos da Fase 1](../requisitos-fase-1.md) e [arquitectura da Fase 1](../fase-1/arquitectura.md).

## Colaboração

Base de Dados define contratos de persistência; Segurança revê autorização; Interface apresenta estados e interacções; Testes verifica critérios de aceitação. Ficheiros partilhados têm editor único por tarefa.

## Critérios de aceitação

Contratos e validação coerentes; decisões aprovadas preservadas; sem credencial privilegiada como alternativa à autorização. Actividades, executores, validação operacional, fecho mensal, planeamento, notificações, KPIs e relatórios permanecem futuros até aprovação da fase correspondente.

## Formato de entrega

Objectivo e âmbito autorizado; branch/commit e ambiente; conclusões com evidências por ficheiro/linha; ficheiros alterados quando autorizados; verificações executadas e não executadas; riscos comprovados versus hipóteses; recomendações, dependências e autorizações ainda necessárias. Submeter ao coordenador para consolidação e revisão cruzada.
