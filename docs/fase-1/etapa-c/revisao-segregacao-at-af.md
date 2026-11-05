# Revisão de segurança da segregação AT/AF — 5 de Novembro de 2026

**Registo histórico da auditoria/proposta.** A implementação local foi entretanto autorizada e está descrita em [implementacao-segregacao-at-af.md](implementacao-segregacao-at-af.md). O rascunho SQL foi substituído pela nova migração incremental; os estados de proposta e limitações abaixo referem-se à revisão inicial. Nenhuma instalação remota está autorizada.

**Diagnóstico: NÃO APTO para bootstrap com as regras actuais.** Esta revisão autoriza apenas auditoria, proposta, documentação e testes locais. Nenhuma correcção foi instalada no Supabase ou no servidor do Codespaces. O ensaio de logout [AUTH-02-AT-LOGOUT-01 continua APTO](relatorio-homologacao-at.md); não demonstra segregação de administradores activos.

Base revista: checkout 4f0d7d4, branch fase-1-autenticacao-permissoes. O [protótipo SQL](../../../supabase/proposals/20261105_at_af_segregation.sql) fica deliberadamente fora de supabase/migrations. Os [testes locais](../../../tests/unit/at-af-segregation.test.ts) executam a migração original e o protótipo apenas em bases PGlite em memória, com contas @example.invalid e contextos JWT fictícios. Não contactam Auth, PostgREST nem a base remota. Não modificam código de produção em src.

## Superfície auditada e diagnóstico

| Caminho | Regra actual / evidência no repositório | Conclusão |
|---|---|---|
| Concessão por RPC | public.admin_mutation, grant_role, exige access.manage no âmbito e alvo diferente do actor; aceita technical_admin | Crítico: AF ou gestor limitado pode conceder poder técnico a terceiro; o âmbito limitado também é vulnerável |
| Revogação por RPC | revoke_role obtém utilizador/âmbito da concessão armazenada, mas não distingue o papel técnico | AF consegue retirar a concessão técnica de AT; falsificar outros campos do payload não deve mudar o alvo real |
| Capacidades do catálogo | role_permission permite qualquer permission_code noutro papel; protege apenas papéis actualmente detidos pelo actor | Crítico: alterar technical_admin, copiar users.manage para papel funcional ou editar papel próprio com vigência futura |
| Acumulação | Não existe exclusão temporal technical_admin versus outros papéis | Conceder papel funcional a AT ou técnico a AF reúne os dois poderes; bloquear só o nome do papel numa interface é insuficiente |
| Escrita REST directa | ACLs retiram DML a anon/authenticated; RLS fornece SELECT condicionado. RPC é SECURITY DEFINER | REST ordinário não tem escrita directa autorizada, mas a RPC atravessa essa barreira legitimamente e precisa de regras próprias |
| Escrita privilegiada / novo mecanismo | Não há invariantes de segregação por trigger; ACLs reais de service_role e pertenças SQL dependem do ambiente | BYPASSRLS, DML privilegiado ou futura RPC podem contornar RLS; TRUNCATE não passa por triggers por linha; TRIGGER/DDL permitem neutralizar guardas |
| Delegações | has_permission e my_permissions consultam apenas concessões + role_permissions; não consultam delegations | Hoje não conferem poderes efectivos. Falta proibição explícita de delegação administrativa; risco latente se futuramente passarem a conferir poderes |
| Estado da conta técnica | user_status exige users.manage, impede actuar sobre si, mas permite actuar sobre outro AT | Proteger também suspensão/desactivação/eliminação de conta técnica contra actores normais; não basta proteger a linha de concessão |
| Auditoria | Triggers registam alterações e audit_invitation valida users.manage; não há protecção append-only face a DML privilegiado | Preservar proveniência e impedir adulteração por papéis de API; DB owner continua uma fronteira de confiança |
| Server Action / validação | src/modules/access/actions.ts usa requireViewer + validação e RPC com cliente da sessão; validation.ts aceita códigos genéricos | Não há uma segunda recusa de papéis/capacidades reservados no servidor da aplicação |
| Convites / metadados | inviteUser exige users.manage global; chave administrativa só no servidor, utilizada em Auth Admin. handle_auth_user cria perfil inactive e não concede papéis por metadados | Não foi encontrado caminho de concessão por metadados ou convite. A chave de serviço deve continuar fora da administração funcional e do navegador |
| Outros helpers/RPCs | is_active_user, in_unit_scope, has_permission, visible_person, my_permissions, may_validate_activity; audit_invitation e triggers de árvores/perfis/auditoria | Sem herança lógica de papéis nem RPC adicional de concessão no código revisto; ACLs explícitas de EXECUTE, search_path vazio. Inventário remoto não foi repetido nesta tarefa |

Referências principais: [migração original](../../../supabase/migrations/202610300001_fase1.sql), secções de catálogo/helpers, RLS/ACLs e admin_mutation; [Server Actions](../../../src/modules/access/actions.ts) e [validação](../../../src/modules/access/validation.ts). A auditoria cobre os mecanismos existentes no repositório, não funções/ACLs eventualmente acrescentadas fora dele no Supabase.

Os seis cenários de reprodução local da baseline verificam o efeito persistido dentro da transacção de ensaio: concessão técnica global, concessão técnica limitada, revogação técnica, alteração de capacidades técnicas, clonagem de users.manage e alteração de papel próprio futuro. Cada transacção é depois revertida. Isto demonstra uma falha de autorização no código, **não uma exploração remota nem uma atribuição real**.

Controles úteis já existentes devem ser preservados: estado active, âmbito, alvo diferente do actor, recusa de modificação do papel próprio corrente, auditoria transaccional, protecção de árvores e RLS de leitura. O campo roles.technical não é uma política suficiente: tanto technical_admin como access_admin têm technical=true no catálogo original, embora pertençam a domínios de administração diferentes.

## Política proposta para aprovação

1. technical_admin é reservado, global e contém exactamente users.read + users.manage. Atribuição, revogação, alteração de alvo/âmbito/vigência e eliminação da concessão não pertencem a access.manage, nem ao próprio AT através da aplicação.
2. users.manage não pode ser copiado para qualquer outro papel. As definições de technical_admin e access_admin e os códigos administrativos users.manage/access.manage ficam congelados; alterações exigem migração de segurança revista, não uma RPC funcional.
3. Uma concessão técnica não pode sobrepor-se no tempo a qualquer outra concessão da mesma conta, incluindo outra concessão técnica. Inclui perfis inactive e concessões futuras. Encerrar um domínio e iniciar outro sem sobreposição pode ser permitido por procedimento aprovado; não é uma proibição vitalícia.
4. AF conserva access_admin + c_org_admin, sem users.manage ou papéis de negócio. c_org_admin contém apenas org.read/org.manage. A gestão funcional de terceiros continua permitida; não se altera a matriz do [plano AT/AF](bootstrap-at-af.md).
5. Alterações às próprias concessões são recusadas em OLD e NEW. Alterações às capacidades de qualquer papel próprio não expirado, inclusive futuro, são recusadas. Permissões administrativas users.manage e access.manage são não delegáveis.
6. Suspender, desactivar ou eliminar perfil com concessão técnica não expirada, inclusive futura, exige manutenção privilegiada. AT mantém gestão autorizada de contas funcionais, sem receber access.manage.
7. Operador de manutenção é uma identidade SQL externa às sessões AT/AF, sem chave service_role como substituto. Aprovação humana, titularidade de contas distintas e controlo de credenciais continuam a ser exigências operacionais: SQL não prova que duas contas pertencem a pessoas diferentes nem impede conluio entre titulares.

## Protecção proposta no servidor e na base de dados

**Base de dados — protótipo local executável:** nova camada public.admin_mutation conserva a assinatura da API, valida actor activo e rejeita operações técnicas. revoke_role deriva o papel da linha armazenada. O corpo legado fica num schema privado, sem EXECUTE/USAGE para API, em vez de ficar um segundo ponto de entrada público desprotegido.

Triggers BEFORE INSERT/UPDATE/DELETE verificam OLD e NEW em roles, permissions, role_permissions, user_role_assignments, delegations e profiles, cobrindo RPCs e escritores privilegiados com DML acidentalmente concedido. São ENABLE ALWAYS. TRUNCATE é recusado por triggers de instrução próprios, incluindo audit_logs. ACLs retiram escrita, TRUNCATE e TRIGGER aos papéis de API nas tabelas protegidas; SELECT continua condicionado pelo RLS existente para authenticated. A instalação recusa proprietários API ou privilégios TRIGGER herdados incompatíveis. Não se introduzem políticas RLS permissivas nem se altera o cálculo actual das delegações.

A auditoria passa a append-only para a API: UPDATE/DELETE/TRUNCATE recusados e INSERT apenas pelo proprietário através dos escritores SECURITY DEFINER autorizados. O trigger de INSERT é SECURITY INVOKER de propósito; torná-lo definer faria uma escrita directa parecer proveniente do proprietário.

Uma linha privada write_epoch é efectivamente actualizada para serializar mutações de segurança. O lock consultivo legado isolado não garante visibilidade de concorrentes sob snapshots REPEATABLE READ. Esta proposta pretende provocar erro de serialização para um snapshot obsoleto; **a prova com duas ligações PostgreSQL nativas ainda é obrigatória**. Não há repetição automática de uma operação de manutenção ambígua.

**Servidor da aplicação — especificação, não implementada nesta tarefa:** acrescentar guarda antes de db.rpc para technical_admin e users.manage, com mensagens sanitizadas, e resolver o alvo de revoke_role no servidor sem confiar em campos ocultos do formulário. Não utilizar o cliente administrativo para contornar a RPC. A UI pode esconder opções reservadas, mas a recusa final e atómica é da base; a consulta prévia da aplicação não substitui o trigger e não elimina corridas. Testes futuros devem chamar directamente a Server Action e a RPC, sem depender do menu.

## Manutenção privilegiada, autorização e auditoria

O protótipo cria gestor_security_operator NOLOGIN NOINHERIT, sem atribuir membros. Só uma futura autorização específica permitirá concedê-lo a um operador SQL nominal. Nunca a authenticator, anon, authenticated, service_role ou a um papel exposto ao PostgREST. O schema privado não deve ser acrescentado aos schemas de API.

A única função de manutenção concedida a esse papel permite grant/revoke/activate/deactivate/suspend sobre AT, sem alterar o catálogo e sem atribuir papéis funcionais. Requer SET ROLE explícito, session_user elegível com pertença ao papel, ausência de contexto JWT e duas referências de mudança/aprovação. A atribuição não activa automaticamente o perfil. A revogação encerra também concessões futuras sem produzir intervalos inválidos. Não se atribui auth.uid fictício para preencher a auditoria.

O registo especial conserva operação, alvo, âmbito global, session_user e referências; os triggers normais conservam antes/depois. Estas referências **não são prova criptográfica de aprovação**: o operador autorizado pode escrever uma referência inventada. A aprovação e a correspondência com o lote exacto têm de existir num registo privado independente, confirmado por outro responsável antes da execução. O protótipo não implementa um sistema electrónico de dupla aprovação.

Proprietário/superutilizador da base, quem possa alterar funções/triggers/ACLs, assumir o proprietário ou controlar credenciais da infra-estrutura permanecem confiáveis. Nenhum trigger impede esse administrador de se conceder poderes por DDL. Exigir inventário dessas pertenças, revogar CREATE/TRIGGER e poderes de desactivar guardas das identidades API; ENABLE ALWAYS não protege contra DROP/DISABLE pelo dono. A proposta protege chamadas da aplicação/API e DML sem propriedade, não promete contenção de um DBA malicioso.

## Migração incremental futura — não aplicada

A migração original já aplicada permanece intacta, SHA-256:

`56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58`

Não copiar agora o rascunho para supabase/migrations, não executar reset/push/reaplicação. Depois da revisão e de autorização separada:

1. Inventário remoto exclusivamente de leitura: definições/hashes de funções, tabelas, políticas, triggers, proprietários, ACLs directas/herdadas/default privileges, pertenças/SET ROLE, schemas expostos e poderes de DDL/session_replication_role. Conferir drift relativamente à migração original. Verificar que o operador de migração pode criar o papel/schema/guardas no Supabase sem ampliar privilégios de API.
2. Listar concessões correntes/futuras/históricas, capacidades clonadas, âmbitos técnicos e delegações administrativas. O protótipo aborta atomicamente com SQLSTATE 23514 se encontrar catálogo técnico divergente, users.manage clonado, técnico limitado, delegação administrativa ou sobreposição técnica/funcional; não faz saneamento automático. Inclui histórico: qualquer excepção exige decisão explícita, sem apagar evidência para fazer passar o preflight.
3. Completar testes de concorrência/ACLs de PostgreSQL e rever a guarda na Server Action. Converter a proposta revista numa **nova** migração com identificador próprio. Revalidar que não existe um caminho legado exposto e que a instalação é única; o rascunho actual não é idempotente.
4. Preparar transacção DDL com pré-condições, prévia de alterações, validação final e ROLLBACK antes do COMMIT se qualquer verificação falhar. A mudança proposta afecta tabelas de autorização e ACLs, não Auth/SMTP, contas ou dados de negócio. NOTIFY PostgREST é parte de uma futura instalação aprovada, não foi enviado remotamente.
5. Autorizar separadamente a instalação incremental, a concessão temporária do papel SQL ao operador e cada lote de bootstrap. Concessão SQL ao operador não é uma atribuição de technical_admin a uma conta Auth. Revogar a pertença SQL no final do período autorizado, com evidência.
6. Depois do COMMIT, verificar definição/ACLs/RLS e resultados sanitizados; só depois preparar o bootstrap. A reversão de DDL após COMMIT exigiria nova migração e autorização: remover as guardas restauraria a vulnerabilidade. Preferir correcção progressiva, sem apagar histórico/auditoria.

Riscos: bloqueios de DDL e contenção da linha de serialização, incompatibilidade com escritores existentes não inventariados, restrições ao ciclo de vida de AT, dependência das capacidades administrativas permitidas pelo Supabase e caches de funções/PostgREST. A identidade SQL de manutenção é sensível e deve ter duração/acesso mínimos. O protótipo não trata administração Auth externa ao SQL (por exemplo eliminar uma conta pelo painel privilegiado); esse canal exige controlo e auditoria do fornecedor.

## Plano e resultados de testes

Executar sem credenciais remotas, na branch indicada. A suite SQL usa apenas PGlite; não inicia o portal nem testa a sessão AT real.

```bash
npx --no-install vitest run tests/unit/at-af-segregation.test.ts
npm run lint
npm run typecheck
npm test
```

A fixture usa SET SESSION AUTHORIZATION authenticator antes de SET LOCAL ROLE authenticated/anon/service_role. Assim a operação de ataque não conserva session_user=postgres. Só a leitura de efeitos após a operação regressa ao proprietário fictício. Todos os ataques são revertidos; os testes negativos comparam as tabelas antes/depois. ACLs DML/TRUNCATE são deliberadamente concedidas ao service_role fictício depois da proposta para provar que os triggers também bloqueiam esse cenário; não se concede TRIGGER.

Cobertura preparada: seis reproduções da baseline; recusa de concessão/revogação técnica por access.manage global/limitado; payload de revogação falsificado; alteração/cópia de capacidades, papéis próprios correntes/futuros, auto-concessão e mistura de domínios; actor inactivo/colaborador/anónimo; API sem acesso a legado/manutenção; falsas referências de aprovação; operador com JWT; DML BYPASSRLS, TRUNCATE e adulteração de auditoria; preflight contaminado sem instalação parcial. Controlos positivos verificam concessão/revogação funcional a terceiro, edição de papel funcional alheio, gestão de conta funcional por AT e manutenção técnica autorizada/auditada. RLS de perfil inactive e ausência de poderes implícitos por delegação são preservados.

Resultados efectivos nesta revisão, Node 24, sem credenciais remotas:

| Verificação | Resultado | Alcance |
|---|---|---|
| npm run lint | APROVADO | ESLint |
| npm run typecheck | APROVADO | Tipos de rotas e TypeScript strict |
| npm test | 274 aprovados / 22 ficheiros, exit 0 | Regressão local, incluindo a nova suite |
| Vitest específico at-af-segregation | 68 aprovados, exit 0 | 6 reproduções da vulnerabilidade original, 61 verificações da proposta e 1 preflight contaminado |
| npm run build | BLOQUEADO, exit 1 | Turbopack: abertura de porta interna recusada, EPERM; não aprovado |
| npm run test:e2e | BLOQUEADO antes dos testes, exit 1 | O webServer local não iniciou neste ambiente; nenhum teste de navegador aprovado nesta revisão |

Não há resultado de homologação remota AT/AF. Os seis testes de baseline passarem significa que a vulnerabilidade foi reproduzida como esperado, não que o código instalado esteja seguro. Os resultados positivos da proposta referem-se apenas ao rascunho em memória. Uma repetição de verificação encontrou timeout de 30 segundos no arranque a frio do PGlite; o orçamento do hook foi ajustado para 90 segundos, sem relaxar as asserções de segurança. Só a execução completa concluída é contada como aprovada. Nenhum servidor do Codespaces foi iniciado, terminado ou substituído. Os ficheiros de tipos gerados pelos checks neste checkout local foram repostos ao conteúdo inicial; não integram a proposta.

Pendentes antes de instalação: concorrência com duas sessões nativas READ COMMITTED/REPEATABLE READ/SERIALIZABLE, incluindo grant técnico versus funcional e mudança de estado; tentativa de ALTER/DISABLE TRIGGER/SET ROLE pelas identidades reais; integração PostgREST contra uma base descartável local equivalente; testes da futura guarda Server Action; compatibilidade com ACLs/default privileges reais Supabase e pós-migração por leitura. Não usar Supabase de desenvolvimento para ensaios mutadores sem autorização.

Matriz obrigatória para a validação concorrente em PostgreSQL descartável, com identidades fictícias e sem serviços remotos:

| Ensaio | Resultado exigido |
|---|---|
| A concede técnico; B tenta funcional ao mesmo alvo antes do COMMIT A, READ COMMITTED | B espera e depois recusa 42501; não existem intervalos sobrepostos |
| A concede funcional; B tenta técnico ao mesmo alvo | Mesma recusa, com ordem inversa |
| B fixa snapshot REPEATABLE READ/SERIALIZABLE antes de A confirmar mudança incompatível | B aborta com serialização 40001 ou recusa segura; nunca confirma mistura |
| Revogar concessão técnica versus editar alvo/âmbito/vigência por API | Só a operação de manutenção autorizada pode confirmar; OLD e NEW protegidos |
| API tenta DDL, TRIGGER, TRUNCATE, manutenção privada ou SET ROLE de operador/dono | Recusa sem alterações de dados, guardas ou auditoria |
| Manutenção cancela técnico e, em lote posterior autorizado, inicia função funcional | Apenas intervalos sem sobreposição; referências e proveniência reconciliáveis |

Não executar estas tentativas no projecto real como parte da revisão actual. A existência de duas contas activas distintas sob titulares confirmados, a correspondência entre referências e autorização humana e a homologação da futura Server Action são também condições de aprovação.

**Decisão solicitada:** aprovar ou ajustar a política e o desenho, mantendo o bootstrap bloqueado. A aprovação deste relatório não executa SQL remoto nem autoriza activações, contas, papéis, emails, migrações, publicação ou merge.
