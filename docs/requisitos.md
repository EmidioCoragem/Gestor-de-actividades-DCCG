# PORTAL EMPRESARIAL INTEGRADO
## PROMPT MESTRE PARA O CODEX CLOUD — VERSÃO 1.4

### 1. MISSÃO

Actua como arquitecto de software sénior, analista funcional, especialista em sistemas empresariais, contabilidade e controlo de gestão, segurança informática e desenvolvimento full-stack.

Desenvolve um Portal Empresarial Integrado, acessível pela internet, para uma única empresa com vários departamentos.

O sistema deverá gerir actividades, fecho mensal contabilístico, indicadores de performance, centros de custo, hierarquia organizacional, planeamento, cronogramas, relatórios e permissões.

O utilizador responsável pelo projecto é iniciante em programação. Comunica em português de Angola, explica as decisões técnicas de forma simples e solicita aprovação antes de avançar entre fases.

### 2. AMBIENTE DE DESENVOLVIMENTO

O desenvolvimento será realizado inteiramente online através do Codex Cloud, com código guardado num repositório privado GitHub chamado `portal-empresarial`.

Não pressupor a instalação local de VS Code, Node.js ou Git.

Tecnologias propostas:

- Next.js com App Router.
- TypeScript strict.
- Tailwind CSS.
- Supabase Auth.
- PostgreSQL.
- Supabase Storage.
- Zod.
- Vitest.
- Playwright.

Adoptar uma arquitectura modular, com separação entre interface, regras de negócio, autorização e acesso aos dados.

Utilizar versões estáveis e compatíveis.

Não inventar credenciais nem expor segredos.

### 3. ESTRUTURA ORGANIZACIONAL

O portal deverá suportar:

- Empresa única com vários departamentos.
- Direcções, departamentos, subdepartamentos e equipas.
- Técnicos, gestores, directores e directores executivos.
- Hierarquias configuráveis.
- Histórico de cargos e chefias.
- Delegações temporárias.
- Utilizadores associados a unidades organizacionais.
- Administração técnica separada das responsabilidades funcionais.

### 4. PERMISSÕES E SEGURANÇA

Regras aprovadas:

1. Apenas gestores e superiores podem criar actividades.
2. Apenas gestores e superiores podem atribuir actividades.
3. Uma actividade pode ter vários executores, mas apenas um executor principal.
4. São permitidas atribuições interdepartamentais por gestores autorizados.
5. Todas as actividades exigem validação pelo gestor responsável.
6. Um executor não pode validar a sua própria execução.
7. Técnicos visualizam as actividades que lhes foram atribuídas.
8. Gestores e directores visualizam as actividades dentro do seu âmbito hierárquico.
9. Participantes interdepartamentais acedem apenas às actividades partilhadas que lhes dizem respeito.
10. Gestores autorizados podem alterar prazos, mediante justificação obrigatória e histórico.
11. O administrador técnico não recebe automaticamente acesso a documentos confidenciais ou poderes de aprovação funcional.

Implementar autorização no servidor e políticas RLS na base de dados.

Não confiar apenas na ocultação de menus para garantir segurança.

### 5. GESTÃO DE ACTIVIDADES

Cada actividade deverá possuir:

- Código único.
- Título e descrição.
- Departamento responsável.
- Centro de custo, quando aplicável.
- Criador.
- Gestor validador.
- Executor principal.
- Executores adicionais.
- Prioridade e criticidade.
- Data de início prevista.
- Prazo original e prazo actual.
- Tempo de execução estimado.
- Registos de tempo efectivo.
- Estado operacional.
- Documentos de suporte.
- Comentários.
- Histórico de alterações.

Estados:

- Rascunho.
- Atribuída.
- Em execução.
- Aguarda validação.
- Concluída.
- Suspensa.
- Cancelada.

O atraso será uma condição calculada separadamente do estado.

A conclusão exige aprovação do gestor validador.

A rejeição exige justificação e devolve a actividade para correcção.

Preservar histórico de submissões, validações, alterações de prazo, atribuições e reaberturas.

### 6. FECHO MENSAL — DIRECÇÃO DE CONTABILIDADE E CONTROLO DE GESTÃO

Criar um módulo específico para gerir o fecho mensal contabilístico e de controlo de gestão.

O módulo deverá permitir que gestores autorizados criem e configurem directamente no portal:

- Modelos de fecho mensal.
- Actividades padronizadas.
- Responsáveis e executores.
- Gestores validadores.
- Prazos.
- Prioridades.
- Actividades críticas.
- Dependências.
- Marcos de fecho.
- Documentos obrigatórios.
- Regras de alertas.

Cada modelo poderá gerar ciclos mensais de fecho.

Distinguir o período contabilístico do período de execução.

Preservar versões dos modelos, histórico dos ciclos e alterações autorizadas.

O encerramento formal do ciclo exigirá cumprimento das actividades obrigatórias e respectivas validações, salvo excepções formalmente autorizadas.

Não exigir a importação prévia de um calendário Excel. As actividades deverão poder ser criadas e mantidas directamente na interface.

### 7. CALENDÁRIO E PRAZOS — ANGOLA

Regra aprovada:

O calendário de trabalho padrão será de segunda a sexta-feira, excluindo feriados e excepções aprovadas.

Permitir calendários específicos por departamento ou equipa.

Suportar três modalidades:

A. Dias úteis — D+N.

B. Dias corridos — D+N.

C. Datas fixas — data absoluta ou dia determinado do mês.

No fecho mensal, D representa, por defeito, o último dia do período contabilístico.

Utilizar o fuso horário Africa/Luanda.

Guardar instantes em UTC e preservar datas contabilísticas locais.

Permitir feriados nacionais angolanos, feriados móveis, dispensas, tolerâncias de ponto e encerramentos internos, sujeitos a aprovação.

Distinguir prazos internos de prazos legais ou fiscais.

Não presumir automaticamente o adiamento de obrigações fiscais sem validação da legislação aplicável.

### 8. EXEMPLO DE ACTIVIDADE DE FECHO

Utilizar apenas como exemplo de especificação e cenário de teste:

- Actividade: Reconciliação bancária.
- Modalidade de prazo: Dias úteis.
- Deslocamento: D+3.
- Actividade crítica: Sim.
- Calendário: Segunda a sexta-feira, excluindo feriados e excepções aprovadas.

Não assumir que esta actividade já está cadastrada no portal.

Não a inserir como dado real de produção.

### 9. DEPENDÊNCIAS E BLOQUEIOS

Permitir:

- Múltiplas predecessoras.
- Actividades paralelas.
- Dependências obrigatórias e informativas.
- Identificação de bloqueios.
- Prevenção de dependências circulares.
- Registo das causas de atraso.
- Excepções autorizadas e auditadas.
- Recalculo de previsões sem alterar automaticamente prazos aprovados.

### 10. CENTROS DE CUSTO E ORGANOGRAMA

Criar um módulo para:

- Cadastrar centros de custo.
- Definir códigos e designações.
- Criar estruturas hierárquicas.
- Associar centros de custo a departamentos.
- Identificar administrativos responsáveis.
- Identificar gestores, directores e directores executivos.
- Preservar histórico de responsabilidades.
- Gerar organogramas interactivos.
- Exportar listagens para Excel e organogramas para PDF.

A hierarquia dos centros de custo deverá ser independente da hierarquia organizacional, embora possam existir associações entre ambas.

### 11. PLANEAMENTO E CRONOGRAMA

Implementar progressivamente:

- Planeamento diário, semanal, mensal e anual.
- Planos departamentais.
- Calendário de actividades.
- Actividades recorrentes.
- Marcos de execução.
- Dependências.
- Cronogramas de Gantt.
- Comparação entre planeado e realizado.
- Identificação de atrasos.
- Reprogramações auditadas.

### 12. INDICADORES DE PERFORMANCE — KPIs

Criar uma arquitectura configurável para medir:

1. Taxa de conclusão de actividades.
2. Cumprimento de prazos.
3. Actividades em atraso.
4. Desvio entre esforço previsto e realizado.
5. Taxa de retrabalho.
6. Tempo médio de validação.
7. Carga de trabalho.
8. Cumprimento dos marcos de fecho.
9. Duração do fecho mensal.
10. Actividades críticas atrasadas.
11. Performance por equipa.
12. Performance por departamento.
13. Evolução mensal dos resultados.

Cada indicador deverá possuir definição, fórmula, unidade, meta, periodicidade, âmbito, fonte de dados e regras de inclusão e exclusão.

Preservar versões das fórmulas e resultados históricos.

Evitar contagens duplicadas de actividades com múltiplos executores.

Separar performance operacional colectiva de avaliações individuais.

Não criar rankings individuais automáticos sem critérios formalmente aprovados.

### 13. DASHBOARDS E RELATÓRIOS

Criar dashboards específicos para:

- Técnicos: actividades atribuídas, prioridades e prazos.
- Gestores: equipa, atrasos, distribuição de trabalho e validações.
- Directores: indicadores departamentais, riscos e fecho mensal.
- Directores executivos: indicadores consolidados das áreas autorizadas.
- DCCG: acompanhamento detalhado do fecho mensal e respectivos KPIs.

Prever filtros por período, departamento, centro de custo, gestor, executor, prioridade, estado e ciclo de fecho.

Permitir exportação futura para Excel e PDF, respeitando permissões.

### 14. NOTIFICAÇÕES E ALERTAS

Prever alertas para:

- Nova atribuição.
- Alteração de prazo.
- Prazo próximo.
- Prazo ultrapassado.
- Actividade crítica em risco.
- Actividade bloqueada.
- Submissão para validação.
- Aprovação ou rejeição.
- Validação pendente.
- Abertura de ciclo mensal.
- Fecho em risco.
- Encerramento formal do ciclo.

Os alertas deverão ser configuráveis, com escalonamento hierárquico, prevenção de duplicados e histórico.

### 15. MODELO DE DADOS

Propor um modelo relacional PostgreSQL normalizado, contemplando:

Organização:
- profiles
- departments
- positions
- user_positions
- reporting_lines
- roles
- permissions
- role_permissions
- user_role_assignments
- delegations

Actividades:
- activities
- activity_assignments
- activity_time_entries
- activity_attachments
- activity_submissions
- activity_validations
- activity_events

Fecho mensal:
- closing_templates
- closing_template_tasks
- closing_cycles
- closing_cycle_tasks
- closing_milestones
- closing_exceptions
- closing_task_dependencies
- closing_task_blockers

Calendário:
- business_calendars
- calendar_exceptions
- closing_deadline_rules
- closing_deadline_changes

Centros de custo:
- cost_centers
- cost_center_responsibilities

Indicadores:
- kpi_definitions
- kpi_targets
- kpi_results
- kpi_snapshots

Planeamento e notificações:
- plans
- plan_activities
- activity_dependencies
- notifications
- notification_outbox
- audit_logs

Estas entidades são propostas iniciais. Poderão ser refinadas para melhorar a normalização, integridade, desempenho e segurança.

Não duplicar a lógica de actividades entre módulos.

### 16. REQUISITOS NÃO FUNCIONAIS

O portal deverá ser:

- Acessível pela internet.
- Responsivo para computador, tablet e telemóvel.
- Desenvolvido em português de Angola.
- Seguro e auditável.
- Preparado para evolução modular.
- Adequado a informação empresarial confidencial.
- Compatível com cópias de segurança e recuperação.
- Sujeito a testes de permissões e segurança.
- Preparado para futura publicação num serviço de alojamento adequado.

Não publicar em produção sem aprovação.

### 17. PLANO DE IMPLEMENTAÇÃO

Fase 0 — Fundação técnica, documentação, estrutura e interface inicial.

Fase 1 — Autenticação, utilizadores, departamentos, hierarquia e permissões.

Fase 2 — Gestão de actividades, executores, prazos, tempos e anexos.

Fase 3 — Validações, notificações internas e dashboard operacional. Marco do MVP básico.

Fase 4 — Fecho mensal, modelos, ciclos, calendário misto, dependências e bloqueios.

Fase 5 — Centros de custo e organograma.

Fase 6 — Planeamento avançado e Gantt.

Fase 7 — KPIs, metas, dashboards avançados e relatórios.

Fase 8 — Homologação, segurança, optimização e preparação para publicação.

Implementar testes e segurança continuamente.

### 18. EXECUTAR AGORA — APENAS FASE 0

Inspecciona o repositório GitHub existente.

Se ainda não houver aplicação, inicializa Next.js com TypeScript, Tailwind CSS e ESLint.

Prepara:

1. Estrutura modular do projecto.
2. Layout empresarial profissional e responsivo.
3. Navegação lateral e cabeçalho.
4. Página inicial de Dashboard.
5. Página de Gestão de Actividades.
6. Página de Fecho Mensal.
7. Página de KPIs.
8. Página de Centros de Custo.
9. Página de Estrutura Organizacional.
10. Página de Hierarquia e Permissões.
11. Página de Planeamento e Cronograma.
12. Página de Relatórios.
13. Página de Notificações.
14. Página de Administração.
15. Estrutura de integração com Supabase, sem credenciais reais.
16. Documentação de requisitos, arquitectura, permissões e modelo de dados.
17. Ficheiro AGENTS.md.
18. Configuração inicial de testes.

As páginas deverão identificar claramente funcionalidades ainda não implementadas.

Não utilizar indicadores fictícios como se fossem dados reais.

Não implementar ainda processos contabilísticos, cálculos fiscais, aprovações operacionais ou funcionalidades de produção.

Não executar operações destrutivas.

Não avançar para a Fase 1.

### 19. ENTREGA E VALIDAÇÃO

No final:

- Resume os ficheiros criados.
- Explica a arquitectura.
- Apresenta as verificações e os testes efectivamente executados.
- Identifica erros e limitações.
- Explica como visualizar a aplicação no ambiente Cloud.
- Identifica configurações ainda necessárias.
- Prepara as alterações para revisão no GitHub.
- Solicita aprovação antes de avançar.

Se o ambiente não permitir executar ou visualizar a aplicação, explica a limitação sem declarar sucesso indevidamente.

Aguarda a minha autorização para iniciar a fase seguinte.