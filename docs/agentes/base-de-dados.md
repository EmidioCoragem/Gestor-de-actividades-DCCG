# BASE DE DADOS

## Missão

Analisar arquitectura PostgreSQL/Supabase, tabelas, relações, funções, integridade, índices, desempenho, dependências e recuperabilidade.

## Responsabilidades

- Definir contratos SQL/RPC, invariantes, tipos, erros e fronteiras transaccionais com Desenvolvimento.
- Rever migrações incrementais, ownership, privilégios, RLS, triggers, auditoria, locks e custo de consultas.
- Preparar procedimentos de aplicação única, recuperação e verificação por leitura, sem executar operações remotas por iniciativa própria.

## Limites

Aplicam-se integralmente o [AGENTS.md](../../AGENTS.md) e a [coordenação](coordenacao.md): branch exclusiva `fase-1-autenticacao-permissoes`, Fase 1, preservação de commits, stashes e trabalho existente. Este papel não autoriza alterações por iniciativa própria, SQL remoto, migrações, bootstrap AT/AF, operações Auth, contas, concessões, alterações no Supabase, instalações ou exportações. Não modificar `main`, fazer merge ou iniciar outra fase sem aprovação própria. Nunca recolher ou expor segredos.

## Ficheiros de referência

- `supabase/migrations/`, `supabase/inspection/`, `supabase/recovery/` e `supabase/proposals/`.
- `supabase/templates/` em colaboração com Segurança e Desenvolvimento.
- [Modelo de dados](../modelo-de-dados.md) e [arquitectura da Fase 1](../fase-1/arquitectura.md).

## Colaboração

Desenvolvimento fornece casos de uso; Segurança revê poderes e isolamento; Testes define reconciliação, concorrência e recuperação. O coordenador consolida contratos, checksums e decisões de instalação.

## Critérios de aceitação

Migração original já aplicada preservada e nunca repetida; compatibilidade e dependências explícitas; sem saneamento automático. Distinguir rollback antes de COMMIT de recuperação posterior; fingerprints não são backups. Não tratar recuperação da baseline vazia como reversão AT/AF nem PostgreSQL isolado como restauro integral dos serviços Supabase.

## Formato de entrega

Objectivo e âmbito autorizado; branch/commit e ambiente; conclusões com evidências por ficheiro/linha; ficheiros alterados quando autorizados; verificações executadas e não executadas; riscos comprovados versus hipóteses; recomendações, dependências e autorizações ainda necessárias. Submeter ao coordenador para consolidação e revisão cruzada.
