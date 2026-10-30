# Modelo relacional proposto — sem migrações nesta fase

Identificadores UUID; chaves externas explícitas; `timestamptz` para instantes UTC e `date` para datas contabilísticas. `created_at`, `created_by` e controlo de versão nas entidades mutáveis. Eventos e auditoria preservados sem actualizações operacionais destrutivas. Datas efectivas de início/fim permitem histórico de cargos, chefias e delegações.

| Domínio | Entidades e relações |
| --- | --- |
| Organização | `profiles` referencia `auth.users`; `departments` representa direcções, departamentos, subdepartamentos e equipas, com tipo e pai. `positions`, `user_positions`, `reporting_lines` mantêm cargos e chefias efectivos. `roles`, `permissions`, `role_permissions`, `user_role_assignments` limitam âmbito e validade; `delegations` indica origem, destino, período e poderes delegados. |
| Actividades | `activities` contém código único, unidade responsável, centro de custo opcional, criador, validador, prioridade, criticidade, início previsto, prazo original/actual, esforço estimado e estado. `activity_assignments` associa executores; `activity_time_entries` regista esforço. `activity_attachments` guarda metadados de Storage; `activity_submissions`, `activity_validations` e `activity_events` preservam cada submissão, decisão e alteração. |
| Fecho | `closing_templates` identifica o modelo; acrescentar `closing_template_versions` imutável e `closing_template_tasks` por versão. `closing_cycles` referencia a versão e distingue período contabilístico e execução. `closing_cycle_tasks` referencia `activities`; `closing_milestones`, `closing_exceptions`, `closing_task_dependencies` e `closing_task_blockers` completam marcos, autorizações e bloqueios. |
| Calendários | `business_calendars` por empresa/unidade/equipa. `calendar_exceptions` com tipo e aprovação; `closing_deadline_rules` distingue dias úteis, corridos e datas fixas, base D, natureza interna/legal e calendário. `closing_deadline_changes` preserva prazo anterior/novo, motivo e autor. |
| Centros de custo | `cost_centers` com código único e pai próprio, independente de departamentos; acrescentar `cost_center_department_links` se a associação for múltipla. `cost_center_responsibilities` com pessoa, função e vigência. |
| KPIs | `kpi_definitions` identifica o indicador; acrescentar `kpi_definition_versions` para fórmula, unidade, periodicidade, fonte, inclusões e exclusões. `kpi_targets`, `kpi_results`, `kpi_snapshots` referenciam a versão, período e âmbito. |
| Planeamento | `plans`, `plan_activities` e `activity_dependencies` relacionam planos, actividades e predecessoras. |
| Notificações | `notifications` por destinatário, `notification_outbox` para entrega idempotente e `audit_logs` para evidência de operações e acessos sensíveis. |

## Integridade a implementar

- Código único de actividade e centro de custo. Unicidade de executor por actividade e índice parcial para **no máximo** um principal; verificação transaccional assegura **exactamente** um antes da atribuição.
- Validador não pode ser executor; verificar também alterações futuras de atribuição e histórico da submissão.
- Estados permitidos: rascunho, atribuída, em execução, aguarda validação, concluída, suspensa, cancelada. Concluir apenas após aprovação. Rejeitar exige motivo e devolve para correcção. Atraso é calculado separadamente.
- Transições, reaberturas, prazos e atribuições geram eventos em transacção. Não apagar submissões anteriores.
- Prevenir ciclos em hierarquias e dependências, incluindo sob concorrência. Dependências obrigatórias/informativas distintas. Recalcular previsões não altera prazos aprovados.
- Encerrar ciclo só com tarefas obrigatórias validadas ou excepções formalmente autorizadas.
- D por defeito é o último dia do período contabilístico. Calendário segunda a sexta, com excepções aprovadas. Nenhuma regra fiscal é inferida automaticamente.
- Agregar KPIs por actividade distinta para evitar duplicações por executor; sem rankings individuais automáticos.
- Índices por âmbito, executor, ciclo, estado e datas; RLS e testes negativos antes de dados reais.
