# Implementação local da segregação AT/AF — 5 de Novembro de 2026

**Actualização posterior:** a pendência Origin: null deste commit foi analisada e corrigida localmente em [correccao-pkce-csrf-hidratacao.md](correccao-pkce-csrf-hidratacao.md). Os estados e resultados abaixo conservam o registo histórico de 1675de9; consultar a actualização para os checks posteriores. Nenhuma autorização remota decorre dessa correcção.

**APLICAÇÃO REMOTA NÃO AUTORIZADA. BOOTSTRAP BLOQUEADO.**

**Estado para recomendar instalação/homologação: NÃO APTO**, devido à pendência da suite Auth fictícia abaixo. A implementação AT/AF e os respectivos testes locais estão concluídos; não se declara aprovação integral dos checks de regressão. O responsável autorizou código, nova migração incremental, testes locais, documentação e commit exclusivamente na branch fase-1-autenticacao-permissoes. Não autorizou aplicar SQL no Supabase, criar/activar contas, conceder papéis reais, executar bootstrap, alterar Auth/SMTP, publicar ou fazer merge na main.

Esta implementação sucede à [auditoria](revisao-segregacao-at-af.md). O relatório de auditoria conserva os resultados e limitações da fase de proposta; para código e testes actuais prevalece este documento. O [logout AT permanece APTO no seu âmbito](relatorio-homologacao-at.md); não é homologação real de AT/AF activos.

## Alterações implementadas

| Camada | Protecção |
|---|---|
| [Migração incremental](../../../supabase/migrations/202611050001_at_af_segregation.sql) | Transacção única, lock_timeout de 5 segundos e locks de tabelas antes do inventário; nenhuma reparação ou atribuição automática |
| Preflight | Catálogo canónico; users.manage exclusivo; ausência de técnico limitado, delegação administrativa ou intervalos incompatíveis; ownership; SHA-256 dos corpos das 12 funções originais antes de reutilizar o legado; ACLs perigosas directas, herdadas ou assumíveis por SET ROLE |
| RPC | public.admin_mutation mantém assinatura; barra technical_admin e cópia/alteração de users.manage; protege definições de sistema; revogação identifica o papel na concessão armazenada. Legado movido para schema privado sem execução por API |
| Escrita directa | Triggers BEFORE/ENABLE ALWAYS em catálogo, capacidades, concessões, delegações e perfis, verificando OLD e NEW. RLS de leitura mantido; API continua sem DML ordinário nessas tabelas |
| Intervalos / auto-elevação | Técnico global incompatível com qualquer outra concessão sobreposta, incluindo futura; auto-alteração de concessões e de capacidades próprias futuras recusada; users.manage/access.manage não delegáveis |
| Concorrência | Actualização efectiva da linha privada write_epoch serializa mutações; snapshots obsoletos não conseguem confirmar poderes incompatíveis |
| Auditoria | Append-only face a API, INSERT directo forjado recusado, triggers por instrução recusam TRUNCATE, incluindo CASCADE. API sem TRIGGER/CREATE/SET de replicação nem pertença ao dono; manutenção regista proveniência e referências |
| [Server Action](../../../src/modules/access/actions.ts) / [guarda server-only](../../../src/modules/access/mutation-policy.ts) | Após requireViewer e validação, recusa papéis/capacidades reservados, auto-concessão e alterações próprias futuras; consulta a concessão real para revogar. Erro, leitura ausente ou ilegível na revogação falha fechado. Usa apenas cliente da sessão, nunca Auth Admin como alternativa |

A Server Action é defesa complementar. As suas consultas estão sujeitas ao RLS do actor; uma concessão técnica fora da sua visibilidade ou uma corrida pode não ser detectada na consulta prévia. A RPC/triggers voltam a decidir atomicamente. Não se concede leitura privilegiada ao servidor para contornar esse limite. A leitura complementar sobre titulares técnicos é conservadora e pode recusar uma transição temporal que o banco permitiria; tal transição deve seguir manutenção revista.

O papel technical_admin continua exactamente users.read + users.manage, global, sem domínio funcional. access_admin continua exactamente access.manage/users.read/org.read/audit.read. O indicador technical=true não distingue estes domínios e não foi usado como substituto dessa política. Novas capacidades técnicas exigirão revisão explícita da lista reservada e dos testes; não devem ser introduzidas como permissões funcionais configuráveis.

## Preservação e manutenção técnica

A migração original 202610300001_fase1.sql permanece byte a byte inalterada, SHA-256:

`56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58`

A migração incremental tem SHA-256 `fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5`.

O rascunho de supabase/proposals foi substituído por um aviso que remete para a migração incremental, evitando dois instaladores activos. Nenhuma migração foi aplicada remotamente. Contas e papéis criados pelos testes são exclusivamente fictícios, em memória ou em contentor descartável.

A migração cria gestor_security_operator NOLOGIN NOINHERIT, **sem conceder membros**. A função privada maintain_technical_admin exige SET ROLE explícito, session_user SQL elegível, pertença à manutenção, ausência de contexto JWT e referências válidas de mudança e aprovação. Só permite grant/revoke/activate/deactivate/suspend técnicos; não altera o catálogo nem concede funções empresariais. Atribuir papel não activa perfil implicitamente. A revogação cancela também concessões futuras sem intervalos inválidos.

Procedimento futuro, ainda por autorizar: confirmar operador SQL nominal e aprovação independente; conceder pertença temporária a esse operador, nunca a authenticator/anon/authenticated/service_role; executar apenas o lote exacto aprovado; reconciliar antes/depois e auditoria; retirar pertença SQL no fim do período aprovado. Não forjar auth.uid para preencher actor_id. Manutenção regista actor nulo e session_user verdadeiro, com referências; o registo privado identifica os responsáveis reais.

Referências de aprovação não são assinaturas nem prova criptográfica: a conferência humana independente do lote continua obrigatória. A função não substitui um sistema externo de dupla aprovação. A gestão de contas Auth por painel privilegiado também permanece sob controlo do fornecedor/operador, fora das RPCs funcionais.

## Verificações efectivas

Resultados efectivamente concluídos (Node 24; estado remoto não homologado):

| Check | Resultado | Limite da evidência |
|---|---|---|
| Lint / TypeScript | APROVADOS, exit 0 | Código e testes locais |
| PostgreSQL 17.11 nativo | 16 verificações APROVADAS, exit 0 | Seis corridas em duas sessões e nove recusas de contorno, mais reconciliação da auditoria; base descartável, sem rede/portas |
| Build Webpack | APROVADO, exit 0 | Compilação de produção numa cópia sem configuração remota |
| Playwright offline | 54 APROVADOS, exit 0 | Computador/tablet/telemóvel contra servidor de produção loopback, sem Supabase configurado |
| Build Turbopack na cópia | BLOQUEADO, exit 1 | A raiz isolada não resolve next/package.json pelo symlink de node_modules; não é apresentado como aprovado |
| Suite unitária final | 302 APROVADOS / 23 ficheiros, exit 0 | npm test -- --maxWorkers=1; inclui 73 cenários SQL e 23 cenários da Server Action |
| Playwright Auth fictício | 38 APROVADOS / 1 FALHOU, exit 1 | Cenário desktop de confirmação diferente/PKCE: Next recusou Origin: null; suite completa concluiu em 6,6 minutos |

Tentativas anteriores de Webpack/Playwright em desenvolvimento excederam os limites de tempo sob carga; uma cópia incompleta dos inputs dos testes também impediu inicialmente o typecheck do build de teste. O runner passou a incluir os scripts tipados necessários, a suite offline usa compilação de produção e os limites/limpeza são próprios dos processos de teste. O primeiro cenário Auth fictício também excedeu a espera de 5 segundos, ainda com a Server Action a processar; o orçamento de asserção do config passou a 15 segundos, sem retries automáticos nem alteração dos resultados exigidos. Uma repetição teve 38 aprovações e o último cenário não executado por um limite global de 360 segundos; o runner passou a 600 segundos com margem de limpeza. A execução completa seguinte concluiu todos os cenários e revelou a falha CSRF indicada na tabela. Os resultados finais completos acima substituem essas tentativas incompletas, sem as contar como aprovações. A migração final foi repetida no PostgreSQL descartável após o reforço do preflight e passou as 16 verificações.

Não executados: SQL no projecto remoto, integração com Auth/PostgREST reais, bootstrap ou homologação de AT/AF activos. O motor PostgreSQL e as corridas são reais; as contas/contextos Auth são fictícios. Os seis testes de baseline reproduzem a falha original de propósito; o sucesso desses testes não declara a baseline segura.

Comandos reproduzíveis a partir da branch indicada, com dependências já instaladas:

```bash
# Apenas PGlite em memória e mocks locais; não usar Supabase remoto.
npx --no-install vitest run tests/unit/at-af-segregation.test.ts tests/unit/access-actions-segregation.test.ts
npm run lint
npm run typecheck
npm test -- --maxWorkers=1

# PostgreSQL nativo num contentor Docker LOCAL sem rede e sem portas publicadas.
# Pré-requisito: daemon Docker local e imagem postgres:17-alpine já obtida.
node tests/integration/at-af-native.mjs

# Cópias temporárias sem .env/.git/.next, bindings Supabase removidos.
node tests/run-app-isolated.mjs build
node tests/run-app-isolated.mjs build --webpack
node tests/run-app-isolated.mjs offline
node tests/run-app-isolated.mjs auth
```

O runner de aplicação copia apenas inputs aprovados, reutiliza dependências instaladas e remove bindings Supabase herdados. O Playwright offline compila primeiro com Webpack e utiliza next start na porta 3110/loopback; a suite Auth usa 3100/4343/4344 e credenciais fictícias. ReuseExistingServer=false impede reutilizar servidores anteriores. Os cookies são de contextos Playwright novos; não são importados do navegador real de AT. Nenhum comando usa, reinicia ou termina o servidor principal do Codespaces/porta 3000. O runner limpa apenas cópias e grupos de processos criados pelos seus checks; o limite global Playwright é 600 segundos e o limite exterior inclui margem de teardown.

Os testes PostgreSQL nativos utilizam seis corridas, com ambos os sentidos técnico→funcional e funcional→técnico em READ COMMITTED, REPEATABLE READ e SERIALIZABLE. A sessão B estabelece snapshot e espera efectivamente por lock de A antes do COMMIT; após erro, conferem ausência de mistura e uma única concessão. Outros casos recusam TRUNCATE, adulteração de auditoria, DISABLE TRIGGER, session_replication_role, SET ROLE de manutenção e chamada ao legado. A proveniência dos controlos positivos de manutenção é reconciliada. Auth/PostgREST são simulados; o motor/concorrência PostgreSQL são reais, exclusivamente locais.

O teste nativo usa o socket Docker local explicitamente, sem contexto remoto, e remove o seu contentor/dados efémeros ao terminar. Não instala dependências da aplicação nem altera package-lock.json. A imagem PostgreSQL foi obtida apenas para a infra-estrutura local de ensaio; não contém dados reais.

## Riscos residuais e condições antes de instalar

**Gate adicional de Auth:** a repetição da suite fictícia apresentou uma recusa CSRF por Origin: null no cenário de confirmação diferente/PKCE. O Next recusou a operação; não foi relaxada a comparação de origem nem alterado código Auth para obter passagem. Este cenário precisa de diagnóstico/reprodução estável antes de recomendar instalação ou homologação real. As execuções anteriores tiveram 38 aprovações com uma falha por espera e 38 aprovações com um cenário não executado por limite global; nenhuma representa suite Auth integral aprovada.

- **Credenciais privilegiadas Auth:** a posse de service_role ou controlo do painel Auth permite intervenções externas ao percurso das RPCs. A segregação SQL não substitui a protecção dessas credenciais nem a autorização/auditoria no fornecedor; a chave nunca é entregue a AF ou ao navegador.
- **Proprietário/DBA confiável:** quem pode alterar funções, ownership, triggers ou ACLs consegue remover as guardas. A protecção não contém um DBA malicioso nem substitui a protecção das credenciais de infra-estrutura.
- **Compatibilidade real pendente:** validar PostgreSQL 15+ e direitos do operador no Supabase, função auth.uid real, ownership, default privileges, ACLs/pertenças, schemas expostos, corpos das funções e caches PostgREST. O preflight falha fechado em caso de drift ou poderes herdados incompatíveis; não retirar essa guarda para fazer passar a instalação.
- **Contenção e instalação única:** locks DDL podem causar timeout de 5 segundos; write_epoch serializa também outras mutações de administração/perfis. Medir no ambiente autorizado. A migração não é idempotente; inventário incompatível aborta atomicamente, sem saneamento silencioso.
- **Estado e tempo:** concessões correntes/futuras/históricas incompatíveis impedem instalação. Mudanças de domínio exigem intervalos sem sobreposição e aprovação. Não testar isso com contas reais sem autorização própria.
- **Auditoria:** tentativas recusadas por excepção não produzem uma linha confirmada na mesma transacção; para monitorização de recusas é necessário registo sanitizado de aplicação/fornecedor, sem payload sensível. Registos de operações confirmadas são preservados e auditáveis.
- **Cobertura:** testes locais não certificam o serviço remoto, a identidade/titularidade de pessoas distintas, a configuração real de PostgREST nem uma aprovação humana. A sessão real AT não foi usada nesta implementação.

## Sequência futura de instalação, sem execução nesta tarefa

Rever e aprovar primeiro o inventário e o checksum da migração. Aplicar a guarda da base de dados antes de carregar a nova Server Action: assim uma interface antiga continua sujeita à recusa atómica da RPC. Validar a base por leitura e depois autorizar a actualização/carregamento do código no Codespaces privado, com verificações de versão e porta Private. Só então propor o bootstrap exacto AT/AF. Não tratar a guarda da interface/Server Action isolada como fecho da vulnerabilidade enquanto a migração não estiver instalada.

Se o preflight falhar, ROLLBACK e análise; não editar a original, apagar concessões históricas, relaxar ACLs ou repetir automaticamente. Se houver falha depois de COMMIT, apresentar estado e proposta de correcção sem reverter a protecção por conveniência.

## Operações que continuam a exigir autorização expressa

1. Inventário remoto de leitura e conferência de drift/compatibilidade do projecto de desenvolvimento, com evidências sanitizadas.
2. Aplicação única da migração incremental revista, com lote/checksum exactos, pré-condições e verificação posterior; não reaplicar a original.
3. Actualização/carregamento do código no Codespaces real, incluindo eventual reinício controlado, e verificação de versão/porta Private.
4. Concessão temporária do papel SQL ao operador nominal e cada intervenção técnica concreta com referências aprovadas.
5. Preparação/criação/convite/activação de AF e activação de AT, concessões exactas e bootstrap AT/AF, cada lote com responsáveis distintos e sem acumulação.
6. Homologação real autorizada com contas activas e API/PostgREST, incluindo mutações e eventuais emails explicitamente delimitados.

Publicação, migrações adicionais e merge na main permanecem fora deste âmbito. Uma reversão após COMMIT remoto exigirá migração/decisão próprias; não apagar auditoria nem restaurar o caminho vulnerável automaticamente.
