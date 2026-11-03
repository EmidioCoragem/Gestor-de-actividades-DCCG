# Plano para concluir a Fase 1 no Supabase Free

Estado: **lote 1 de catálogo concluído/aceite; lotes funcionais preparados e não executados**. Ver [análise do CSV](analise-pos-migracao-real.md). A migração já foi aplicada
uma vez pelo responsável. O plano não autoriza contas, dados de teste, bootstrap,
mutações RPC, emails ou configurações Auth/SMTP. Cada lote de escrita exige nova
autorização expressa. O custo previsto é zero; não se contrata SMTP, PITR ou compute.

## Lotes e dependências

| Lote | Trabalho | Dependência/autorização |
| --- | --- | --- |
| 1 — concluído | Catálogos, relações, ACLs, funções e triggers | CSV de 635 linhas aceite; falsos positivos do inspector resolvidos |
| 2 | Preparar contas, bootstrap e dados sintéticos mínimos | Nova autorização para identidades e escritas; operador SQL autorizado |
| 3 | Login, sessão, isolamento e mutações administrativas | Contas activadas com concessões explícitas; mutações de teste aprovadas |
| 4 | Convites, recuperação e email | Destinatários de teste autorizados e entrega disponível; qualquer mudança de URLs/templates/SMTP depende de autorização própria |
| 5 | Rever evidências, anomalias, regressões e relatório final | Fecho funcional da Fase 1; não inclui publicar ou integrar main |

## Contas mínimas propostas — nenhuma criada

Cinco identidades controladas pelo responsável, com emails de teste reais que ele
possua e palavras-passe guardadas privadamente. Não usar endereços example.invalid
dos testes locais no Supabase e não enviar passwords/JWTs/chaves no chat ou Git.

| Alias | Concessões propostas | Finalidade |
| --- | --- | --- |
| R | access_admin global + papel configurável com org.read/org.manage globais | Responsável de acessos/estrutura e auditoria; sem concessões funcionais implícitas |
| GA | manager no departamento A | Gestão funcional só em A e descendentes |
| GB | manager no departamento B | Isolamento simétrico de B |
| TA | technician no departamento A | Utilizador de menor privilégio; suspensão/expiração reutilizam esta conta |
| AT | technical_admin global, sem papéis funcionais | Gestão técnica de contas sem leitura de actividades/custos/fecho |

O bootstrap da primeira conta é operação do responsável SQL, não auto-atribuição
pela aplicação. O exemplo existente em supabase.md só pode ser adaptado a UUIDs
reais depois da aprovação. Novas contas devem começar inactivas e sem papéis. A
criação de R não concede permissões automaticamente; activar e atribuir apenas o
que foi aprovado. Não incluir R em manager/director por conveniência.

Organização sintética mínima: uma empresa, departamentos A e B, uma secção A1
filha de A e um cargo. Atribuições/hierarquia e todas as mutações pertencem ao lote
de teste autorizado. Não usar nomes, trabalhadores ou centros de custo reais.

## Matriz de testes a preencher com evidência

Todos começam como PENDENTE no ambiente real. Para cada ID registar data/hora,
alias/papel/âmbito, versão do código, operação, esperado/observado e resultado.
Não guardar cabeçalhos Authorization, JWTs, cookies, links com token_hash, passwords,
chaves ou payloads com dados pessoais no relatório público.

| ID | Cenário | Resultado esperado | Dependências |
| --- | --- | --- | --- |
| AUTH-01 | Login correcto e palavra-passe errada | Sessão real no primeiro; erro genérico no segundo, sem revelar existência da conta | Conta autorizada; sem envio de email se já preparada |
| AUTH-02 | Conta nova inactiva/sem papéis | Rotas privadas bloqueadas; sem concessão automática; leitura do próprio perfil pode existir por desenho | Criação autorizada |
| AUTH-03 | Logout, renovação, expiração e refresh | Logout impede navegação; cookies/renovação não ultrapassam estado da conta | Sessões privadas reais |
| AUTH-04 | Suspender TA durante sessão | Próxima operação funcional/RPC recusada; sem acesso a terceiros; conta própria não é teste de isolamento | Escrita autorizada; depois reactivação aprovada |
| AUTH-05 | Signup público e anónimos | Configuração continua desactivada; não chamar signUp para tentar criar identidades nesta etapa | Leitura do painel; testes negativos de endpoint exigem aprovação própria se houver risco de criação |
| RLS-01 | Leitura anon pelas rotas API | Nenhuma tabela da aplicação fornece dados; RPC administrativa recusada | Sem conta; validar respostas sem alterar dados |
| RLS-02 | GA lê A/A1 e tenta B; GB tenta A | Acesso limitado aos âmbitos; catálogos globais permitidos não contam como fuga departamental | Contas/dados distintos |
| RLS-03 | TA tenta INSERT/UPDATE/DELETE directo e enumeração de terceiros | Escrita directa recusada; SELECT devolve só linhas autorizadas (resposta 200 vazia pode ser correcta) | Conta TA; escritas negativas aprovadas |
| RLS-04 | AT tenta dados funcionais | users.manage não concede capacidades de actividades, custos ou fecho; módulos futuros não têm dados funcionais implementados | Conta AT; sem acrescentar papéis para facilitar o teste |
| RPC-01 | anon/inactivo chama admin_mutation/audit_invitation | Recusa; não há alteração ou auditoria funcional falsa | Chamadas mutadoras só no lote aprovado |
| RPC-02 | GA tenta poderes fora de A; actor tenta conceder/revogar próprio papel ou alterar capacidades do próprio papel | Recusa de auto-elevação e do âmbito não autorizado | R e contas/dados de teste |
| RPC-03 | Helper in_unit_scope e funções de trigger por PostgREST | Não executáveis por anon/authenticated; confirmar exposição real, não apenas menus | Contas/API configurada; não usar service_role |
| ORG-01 | Segunda empresa, ciclos e pai inválido | Integridade recusa; transacção não deixa estado parcial | Escritas de teste aprovadas |
| ORG-02 | Transferência de TA A→B por actor autorizado nos dois lados | Associação antiga encerrada, histórico preservado; poderes por role/scope revistos separadamente | Actor de gestão autorizado; transferir cargo não deve conceder papel |
| ORG-03 | Chefia circular e responsável fora da unidade | Recusa; dados anteriores preservados | Dados sintéticos |
| ORG-04 | Reparenting usado por actor com concessões próprias limitadas à árvore | Recusa; não ampliar indirectamente poderes próprios | Contas/âmbitos preparados especificamente |
| PERM-01 | Papel expirado/revogado e unidade inactiva | has_permission recusa na operação seguinte; my_permissions não substitui o check no alvo | Concessões temporárias aprovadas |
| DEL-01 | Linha válida de delegations | Não acrescenta poderes a has_permission/my_permissions nesta versão | Inserção só por operador/lote autorizado; não existe RPC funcional de delegação |
| DEL-02 | Delegação para si, vigência inválida e FK inexistente | Constraints recusam; não há fluxo efectivo a marcar como implementado | Teste SQL autorizado ou cobertura local |
| AUD-01 | Conceder papel, transferir associação e alterar estado | Eventos com actor auth.uid real, entidade, antes/depois e instante; vigência/histórico preservados | Mutações por sessão do actor, não por service_role |
| AUD-02 | TA/GA tentam ler/apagar/inserir auditoria indevida | Sem manipulação directa; leitura por audit.read e âmbito; eventos de âmbito null requerem poderes globais | Contas/API |
| AUD-03 | Bootstrap SQL do operador | Actor SQL sem auth.uid pode ser null; manter registo operacional do operador, sem inventar UUID | Bootstrap aprovado e documentado |
| MAIL-01 | Convite completo | Intenção/resultado auditados, email entregue, link validado, palavra-passe definida e conta inactiva até activação | Criação/convite e envio aprovados |
| MAIL-02 | Recuperação de palavra-passe | Mensagem genérica; link correcto funciona; expirado/alterado recusado; sessão concluída conforme fluxo | Conta e email autorizado; limite de envio |
| UI-01 | Azul-escuro, identificação real e responsividade | Identidade preservada; sem sessão fictícia, dados inventados ou overflow | Sessões reais e código da branch |
| CC-01 | Contratos de Centros de Custo/ERP | Código textual com zeros, preview sem eliminação implícita, IDs externos/fonte preservados; SAP/Primavera continuam contratos sem rede | Cobertura local; sem importar ficheiros empresariais |

Não usar o SQL Editor como postgres ou service_role para provar isolamento entre
contas: ambos podem ter poderes superiores. No lote aprovado usar as sessões de
GA/GB/TA/AT na aplicação e chamadas PostgREST com essas identidades. Não colar JWTs
no chat; o operador pode recolher evidência sanitizada. O SQL Editor serve para
catálogos/bootstrap autorizado e preparação, não para substituir login real.

## Email e plano Free

SMTP personalizado está desactivado, limite reportado 2 emails/hora. Distribuir
MAIL-01/02 por janelas desse limite, sem disparar envios em paralelo. O envio
padrão Supabase também pode restringir destinatários; validar elegibilidade dos
emails antes do lote. Não adicionar membros à organização, mudar SMTP ou relaxar
confirmações/signup para contornar restrições sem autorização separada.

Se o serviço padrão não permitir as identidades necessárias, separar os ensaios
sem email dos ensaios de entrega. O operador decidirá, com autorização própria,
como preparar contas de teste por mecanismo suportado do painel e como viabilizar
entrega. Não presumir que cinco convites serão entregues nem que contas criadas
sem envio validam o fluxo de convite. Nenhum serviço pago é condição para o lote
de leitura ou para os ensaios locais. MAIL-01/02 permanecem pendentes até entrega
real comprovada; mocks não substituem essa evidência.

Site URL ainda é localhost:3000, sem Redirect URLs adicionais. Só testar links
numa origem coerente com as URLs existentes; se a aplicação estiver num Codespace
privado, propor as URLs exactas para aprovação antes de as alterar. Não usar
wildcards globais nem publicar a porta para obter acesso. Os modelos de convite/
recuperação devem ser conferidos com os ficheiros do repositório antes do ensaio,
sem os aplicar ao painel agora. Service role, se vier a ser necessária ao convite
pela UI, fica exclusivamente no servidor e depende de configuração autorizada.

## Critérios de encerramento

- CSV pós-migração detalhado revisto sem BLOQUEIO ou REVER inexplicado.
- AUTH/RLS/RPC/ORG/PERM/AUD com resultados reais registados e problemas resolvidos
  em alterações versionadas/revistas, nunca por afrouxar RLS ou concessões.
- Convite/recuperação com entrega real ou pendências explicitamente impeditivas
  da homologação desses fluxos; não declarar Fase 1 integralmente homologada enquanto faltarem.
- Delegações qualificadas como fundação sem poderes, sem prometer fluxo futuro.
- Identidade azul-escuro, contratos Centros de Custo e SAP/Primavera preservados.
- Relatório identifica contas/dados sintéticos criados e a retenção/limpeza
  autorizada; não apagar contas/histórico automaticamente no fim.
- Nova baseline lógica privada após aceitação. Depois de criar contas/dados, a
  compensação de baseline vazia já não é aplicável e não deve ser forçada.
- Publicação, merge main, Fase 2 e recursos pagos exigem decisões separadas.
