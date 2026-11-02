# Modelo, segurança e matriz de acesso

## Prontidão vigente da Etapa B

O responsável concluiu e guardou privadamente baseline-fase1-painel.txt. Estão
confirmados signup público e acessos anónimos desactivados, confirmação de email
activa, mínimo de 12 caracteres para palavras-passe, Site URL http://localhost:3000,
nenhuma Redirect URL adicional, SMTP personalizado desactivado e 2 emails/hora.
Foram registados fornecedores, sessões, parâmetros de tokens, limites e notificações.
Não se solicitou o ficheiro privado nem valores de credenciais/tokens reais.

A baseline real foi analisada sem colisões efectivas identificadas. O registo
privado do painel está concluído por confirmação do responsável. Localhost e
SMTP/limites não bloqueiam execução ou compensação SQL; devem ser considerados
na homologação futura dos fluxos de autenticação. Não se alteram agora essas opções.

**NÃO APTO ainda para solicitar autorização da Etapa B:** os resultados repetidos
continuam a ser apenas a segunda grelha de propriedade. Faltam as nove linhas
objecto/estado de supabase/inspection/fase1-operator-checks.sql e o resultado de
supabase/inspection/fase1-drop-trigger-permission.sql. A pertença ao papel
supabase_privileged_role não substitui estas verificações. A ausência destes
resultados é lacuna de evidência, não prova de um bloqueio efectivo do projecto.

Mantidos a migração original e SHA-256
56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58,
o procedimento compensatório e as dependências. Nenhuma execução remota,
criação de contas, alteração Auth, publicação ou merge na main. As secções abaixo
incluem histórico de verificações e pendências já encerradas; este resumo e a
[análise actualizada](analise-baseline-real.md) prevalecem para o estado vigente.

## Entidades e integridade

profiles referencia auth.users por UUID e guarda nome, e-mail e estado activo/inactivo/suspenso. Uma conta criada ou já existente na aplicação da migração começa inactiva, sem concessões. A activação não atribui um perfil automaticamente.

organizational_units guarda tipo, código, designação, pai e estado. Empresa única na raiz, índices de pai, prevenção de ciclos e auditoria de alterações. positions representa cargo, que não concede acesso. user_positions guarda cada período de associação; unit_responsibilities e reporting_lines guardam responsáveis e chefias com vigência. As chaves externas preservam identidades e impedem remoção destrutiva de referências.

roles, permissions, role_permissions e user_role_assignments separam perfil, capacidade e âmbito (unidade e descendentes, ou global explicitamente concedido), com início/fim e actor concedente. delegations é preparada, mas não consultada para conceder capacidades nesta versão.

cost_centers tem UUID interno, código textual único, nome, descrição, pai independente de unidades, estado, responsável, unidade associada, origem/identificador externo, vigência date, timestamps e última sincronização. O histórico de alterações está em audit_logs. Não converter códigos para números: 000A-01 é distinto de A-01.

integration_sources define fontes e autoridade. external_identity_mappings usa chaves externas específicas de centro de custo, unidade ou trabalhador, exactamente uma por linha, e unicidade por fonte/tipo/identificador. import_batches é apenas fundação de lotes/relatórios, sem fluxo de escrita autenticada nesta fase.

## Capacidades iniciais

| Perfil | Capacidades iniciais | Âmbito |
| --- | --- | --- |
| Técnico | activities.read, notifications.read, org.read | Unidade concedida; actividades futuras exigem verificação de participação |
| Gestor | org.read, users.read, activities.read/create/assign/validate, planning.read, notifications.read | Unidade e descendentes autorizados |
| Director / Director Executivo | org.read, users.read, activities.read/create/assign/validate, closing.read, reports.read, kpis.read | Áreas explicitamente concedidas |
| Administrador técnico | users.read, users.manage | Concessão explícita; não inclui actividades, documentos ou validações |
| Responsável de acessos | access.manage, users.read, org.read, audit.read | Concessão explícita; sem poderes funcionais automáticos |

org.manage e activities.cross_assign não são concedidas implicitamente por nível. Criar perfis específicos e concedê-los por decisão autorizada. Os papéis são configuráveis; capabilities futuras só serão usadas nos módulos respectivos. A permissão de navegação activities.read não substitui a futura política por executor/actividade partilhada prevista na v1.4.

## Regras aplicadas

- Perfil activo, vigência e âmbito são verificados por funções PostgreSQL SECURITY DEFINER com search_path vazio e objectos qualificados, sem execução por anon/PUBLIC.
- SELECT é concedido a authenticated apenas com políticas RLS. Não há INSERT/UPDATE/DELETE directo para contas normais nas tabelas administrativas. Mutação autorizada e auditada via admin_mutation, sem SQL dinâmico a partir de campos do utilizador.
- is_active_user, has_permission e my_permissions recusam contas suspensas e concessões expiradas; unidade inactiva invalida os âmbitos baseados nela. my_permissions é uma união apenas para apresentação de módulos; não substitui has_permission na operação nem RLS na consulta.
- Não é permitido conceder/revogar os próprios papéis nem alterar as capacidades de um papel actualmente atribuído ao próprio actor. Nem o estado ou associação primária próprios podem ser alterados pelas operações administrativas.
- Reparenting pode alterar o alcance das concessões. Exige org.manage e access.manage globais, por actor sem concessões próprias limitadas à árvore, impedindo aumentar o próprio acesso funcional por uma reorganização. Renomear/arquivar continua sujeito ao âmbito autorizado.
- Um responsável de âmbito não pode conceder fora desse âmbito ou conceder âmbito global. Alterar capacidades partilhadas de um papel exige access.manage global.
- Técnicos de sistema não recebem poderes funcionais por ser técnicos. Não há service_role no navegador; o seu único uso aplicacional é a API Auth Admin de convite, após verificação global de users.manage.
- may_validate_activity proíbe autovalidação e exige activities.validate no âmbito; é infraestrutura, não fluxo operacional. O módulo futuro deverá impor esta regra transaccionalmente e distinguir participantes, principais e adicionais.
- audit_logs só recebe linhas por triggers e funções autorizadas. Contém actor obtido por auth.uid, entidade, alteração, antes/depois e instante. Não guarda palavras-passe, tokens ou chaves.
- Convites registam intenção antes da API Auth externa e resultado depois. Não existe transacção distribuída entre PostgreSQL e Auth; se o resultado final não for registado, a UI avisa para reconciliação e não manda repetir automaticamente.
- Logging de argumentos Server Actions é desactivado; pedidos de callback não são impressos nos logs de desenvolvimento do Next. Não partilhar URLs com token_hash ou exportar cabeçalhos de autenticação para diagnóstico.

## Validação externa obrigatória

RLS local não demonstra que Auth/SMTP, cookies do navegador, proxies e PostgREST estejam correctamente configurados no projecto real. Antes de considerar a Fase 1 operacional, executar os cenários de homologação no projecto Supabase de desenvolvimento descritos em supabase.md. Não usar informação empresarial confidencial nesta validação.

## Revisão pré-migração — 2 de Novembro de 2026

Base verificada: branch fase-1-autenticacao-permissoes, commit cd748b7cc3b5976c7fc06a5b30a3f5e08831b53b. O checkout local estava limpo na branch work, no commit inicial; a branch correcta foi obtida e seleccionada antes das alterações. Não houve merge, push, criação de contas nem execução remota. Os resultados remotos abaixo foram fornecidos pelo responsável; esta revisão não se ligou ao Supabase.

### Compatibilidade de auth.users.email

O responsável reportou auth.users.email como character varying(255), 0 contas Auth, 0 nomes incompatíveis e 0 contas anónimas. Reportou ainda ausência de colisões nas 16 tabelas e nas funções previstas de public.

A comparação anterior exigia text literalmente. Essa exigência produziu um falso bloqueio: varchar(255) é compatível com a migração. A coluna de destino public.profiles.email é text (linha 6), sem limite de 255 caracteres. PostgreSQL aceita a conversão de varchar para text na atribuição; coalesce e left também aceitam as expressões usadas. O comprimento máximo 160 aplica-se apenas a full_name, explicitamente truncado por left.

As instruções exactas relevantes do ficheiro original são:

```sql
-- Linha 145: função public.handle_auth_user(), executada pelo trigger.
insert into public.profiles(id,email,full_name) values(new.id,coalesce(new.email,''),left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),new.email,'Utilizador'),160));

-- Linhas 151–153: preenchimento inicial de contas existentes.
insert into public.profiles(id,email,full_name)
 select id,coalesce(email,''),left(coalesce(nullif(trim(raw_user_meta_data->>'full_name'),''),email,'Utilizador'),160) from auth.users
 on conflict(id) do nothing;
```

Nenhuma destas instruções exige que o tipo de origem seja text. Não existe instrução incompatível com varchar(255), nem ALTER TABLE auth.users. Não é necessário acrescentar casts nem alterar a migração ou o esquema interno Auth. Corrigiu-se a inspecção em supabase/inspection/fase1-auth-compatibility.sql: aceita os tipos PostgreSQL text e varchar para email, mantém uuid para id e jsonb para raw_user_meta_data. É uma consulta independente READ ONLY, sem alteração remota, e não substitui a grelha completa de conflitos.

O limite de 254 caracteres da função audit_invitation (linha 287) valida um argumento de convite; não altera a coluna Auth nem é chamado pelo preenchimento inicial ou pelo trigger. Não é a causa do bloqueio reportado.

### Seis privilégios predefinidos fornecidos

| Criador / esquema | Tipo | Concessões reportadas | Classificação para esta migração |
| --- | --- | --- | --- |
| postgres/public | r, tabelas | postgres, anon, authenticated e service_role: arwdDxtm | Configuração habitual, mitigada pelas revogações explícitas |
| supabase_admin/public | r, tabelas | postgres, anon, authenticated e service_role: arwdDxtm | Igual; só se aplica ao criador efectivo dos objectos |
| postgres/public | S, sequências | postgres, anon, authenticated e service_role: rwU | Sem efeito directo: a migração não cria sequências |
| supabase_admin/public | S, sequências | postgres, anon, authenticated e service_role: rwU | Sem efeito directo, pela mesma razão |
| postgres/public | f, funções | postgres, anon, authenticated e service_role: X | Configuração habitual, mitigada pelas revogações explícitas |
| supabase_admin/public | f, funções | postgres, anon, authenticated e service_role: X | Igual; depende do criador efectivo |

PUBLIC não é o esquema public: nas ACLs, PUBLIC aparece como beneficiário vazio antes do sinal '='. Não há essa entrada nas seis linhas recebidas. Os privilégios predefinidos do criador aplicam-se a novos objectos; não são, por si, prova dos privilégios efectivos finais.

Nas linhas 190–201, a migração activa RLS nas 16 tabelas, revoga ALL de anon e authenticated e concede apenas SELECT a authenticated. Isto remove inclusive TRUNCATE e TRIGGER recebidos directamente através das ACLs predefinidas. As políticas filtram as leituras; não existem políticas de escrita directa. As tabelas de integração/lotes não têm política de leitura, mantendo recusa por defeito.

Nas linhas 291–298, as 12 funções recebem REVOKE ALL de PUBLIC, anon e authenticated. Só sete funções recebem EXECUTE para authenticated; auxiliares e funções de trigger não são expostas a esse papel. As concessões de service_role e do proprietário permanecem, como esperado para papéis administrativos de confiança. service_role não pode ser entregue ao browser. Não é necessário alterar os privilégios predefinidos do projecto para aplicar esta migração.

Risco efectivo distinto, demonstrado apenas em PostgreSQL local: uma concessão predefinida de tabelas a PUBLIC sobreviveria ao REVOKE dirigido a anon/authenticated e poderia preservar TRUNCATE, que RLS não protege. Essa concessão não consta das linhas fornecidas. Concessões por outros papéis herdados também exigiriam análise se fossem identificadas; não foram reportadas nestas ACLs. Os seis avisos recebidos não demonstram esse risco.

### Seis event triggers fornecidos

| Event trigger | Evento / filtro reportado | Análise |
| --- | --- | --- |
| issue_graphql_placeholder | sql_drop / DROP EXTENSION | Infraestrutura habitual GraphQL; a migração não elimina extensões |
| issue_pg_cron_access | ddl_command_end / CREATE EXTENSION | Infraestrutura habitual pg_cron; a migração não cria extensões |
| issue_pg_graphql_access | ddl_command_end / CREATE EXTENSION | Infraestrutura habitual pg_graphql; a migração não cria extensões |
| issue_pg_net_access | ddl_command_end / CREATE EXTENSION | Infraestrutura habitual pg_net; a migração não cria extensões |
| pgrst_ddl_watch | ddl_command_end | Infraestrutura habitual PostgREST; acompanha alterações DDL e actualização do cache do esquema |
| pgrst_drop_watch | sql_drop | Infraestrutura habitual PostgREST; acompanha remoções; a migração não contém DROP |

Todos foram reportados com activacao O, isto é, habilitados no modo origin. Os valores de tags dos dois watchers PostgREST não chegaram em JSON válido; não se presumiu um filtro específico. Os nomes, eventos e funções reportados correspondem à infraestrutura padrão. Não se inspeccionaram as definições internas dessas funções no projecto remoto. A migração também contém NOTIFY pgrst, 'reload schema' (linha 299), compatível com a actualização do cache; os watchers não são colisões com os triggers de linha da aplicação.

Não se identificou motivo para desactivar, remover ou modificar qualquer destes seis event triggers.

### Integridade e decisão

A migração permaneceu byte a byte igual ao commit base, sem correcção SQL necessária. SHA-256 de supabase/migrations/202610300001_fase1.sql:

```text
56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58
```

Com base nos resultados fornecidos, o único BLOQUEIO era um falso positivo de tipagem e os 12 avisos são compatíveis com a infraestrutura e com as revogações da migração. Não há conflito real identificado nestes resultados que impeça propor a execução no projecto exclusivamente de desenvolvimento, após autorização expressa do responsável. Esta conclusão não autoriza execução remota nem equivale a homologação de produção. Se o estado remoto mudar, repetir a inspecção antes da execução.

Continuam pendentes, após a migração autorizada: bootstrap controlado, testes Auth/SMTP/cookies, verificação efectiva de privilégios e RLS via PostgREST com contas e âmbitos distintos e restantes cenários de homologação. Preservados os contratos de Centros de Custo, SAP e Primavera e a identidade azul-escuro; não se iniciou a Fase 2.

### Verificação local da análise anterior

- Node 24.19.0 / npm 11.9.0; npm ci concluído pelo lockfile existente, sem alteração de dependências. Aviso de descontinuação do ESLint permanece.
- npm run lint: aprovado.
- npm run typecheck: aprovado.
- npm test: 50 testes aprovados em 6 ficheiros. Inclui os 46 existentes e 4 novos casos em tests/unit/migration-preflight.test.ts.
- Os novos casos executam a migração integral sem alterações em PostgreSQL PGlite isolado com email text e varchar(255), verificam a consulta de tipos corrigida, preenchimento de conta existente e trigger de nova conta com e-mail de 255 caracteres, fallback para e-mail nulo, nome truncado a 160, estado inactivo e ausência de papéis. Também verificam a revogação dos defaults directos e demonstram separadamente o risco hipotético de PUBLIC, ausente nas ACLs recebidas. Contas e dados destes testes existem apenas na memória do PostgreSQL local.
- npm run build (Turbopack): não aprovado nesta revisão; falhou por Operation not permitted ao abrir uma porta interna, inclusive na tentativa com permissões adicionais. A alternativa npm run build -- --webpack também falhou, com Could not parse output from TypeScript's --showConfig. Nenhum destes resultados é apresentado como compilação aprovada.
- npm run test:e2e com Chromium local: não executou os cenários porque o webServer não conseguiu iniciar (exit code 1). Não se contam testes de navegador como aprovados nesta revisão.
- Compilação e ensaio de navegador foram tentados com URL/chaves Supabase vazias; não se testou nem contactou o projecto remoto. As limitações do ambiente não invalidam o resultado dos testes SQL locais, mas deixam a verificação completa da aplicação pendente.
- git diff --check: aprovado. O hash da migração manteve-se inalterado. Na conclusão desta análise, as alterações ainda eram locais, sem commit ou push.

### Preparação para guardar a revisão — 2 de Novembro de 2026

O responsável autorizou guardar documentação, inspecção SQL e testes por commit/push exclusivamente na branch fase-1-autenticacao-permissoes. A Etapa B, a migração remota, alterações Auth, criação de contas remotas e merge na main continuam sem autorização.

- Confirmada a branch local correcta e a sincronização com origin/fase-1-autenticacao-permissoes em cd748b7 antes do novo commit: 0 commits à frente e 0 atrás.
- Verificados name, version, dependencies, devDependencies e engines de package.json contra a raiz de package-lock.json (lockfileVersion 3): coincidem.
- Repetido npm ci com Node 24.19.0 / npm 11.9.0: aprovado, 418 pacotes. O SHA-256 de package-lock.json manteve-se igual antes/depois e não houve diferenças em package.json/package-lock.json.
- npm ls --depth=0 terminou com sucesso. @emnapi/runtime e @img/sharp-wasm32 aparecem como extraneous na árvore desta plataforma, mas ambos constam do lockfile como optional; não se regenerou o lockfile para ocultar essa apresentação.
- Repetidos npm run lint e npm run typecheck: aprovados.
- Repetido npm test: 50 testes aprovados em 6 ficheiros, incluindo os quatro casos de pré-migração.
- A migração original mantém o SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58 e nenhuma diferença relativamente ao commit base.
- O workflow existente .github/workflows/fase-0.yml contém instalação limpa, lint, tipos, testes, build e Playwright em computador/tablet/telemóvel. Tem permissões contents: read e não contém deploy ou migração. A validação em runner GitHub Actions será identificada separadamente pelo SHA do commit e URL da execução; não se confunde a existência do workflow com testes aprovados.
- Permanecem válidas as limitações locais de build/navegador descritas acima. Não se alteraram configurações de segurança para contorná-las. As variáveis Supabase dos ensaios de navegador existentes estão vazias por configuração de teste.

O resultado da preparação não autoriza nem executa a Etapa B. A homologação real de Auth/SMTP/cookies e RLS/PostgREST continua pendente, nos termos da secção de decisão.

### Resultado final em GitHub Actions

Código, consulta e testes guardados e enviados para fase-1-autenticacao-permissoes no commit 8b2ade6ad65cb33a2cb39f1fac7b0fbe4dbfdb06. A execução manual do workflow existente terminou com success, sem alteração do workflow, de permissões ou de configurações de segurança:

[Execução 41474094806](https://github.com/EmidioCoragem/Gestor-de-actividades-DCCG/actions/runs/41474094806) — Ubuntu 26.04, Node 24.22.2, npm 11.19.1, duração do job 1m50s.

| Verificação no runner | Resultado |
| --- | --- |
| npm ci e ausência de alterações em package.json/package-lock.json | Aprovado; 416 pacotes instalados nesta plataforma |
| npm run lint | Aprovado |
| npm run typecheck | Aprovado |
| npm test | 50 testes aprovados em 6 ficheiros |
| npm run build, Turbopack | Aprovado |
| Chromium / Playwright em computador, tablet e telemóvel | 42 testes aprovados |

O runner resolve as limitações locais de portas sem modificar a segurança do ambiente local. Os testes de navegador verificam bloqueio sem Supabase, formulários, callback inválido, identidade azul-escuro e apresentação responsiva. Não validam autenticação real, contas activas, SMTP, privilégios efectivos ou isolamento entre contas no novo projecto. A execução não contém deploy nem migração.

### Riscos e pendências da preparação

- npm ci no runner reportou 16 vulnerabilidades moderadas. Uma auditoria local explícita posterior (npm 11.9.0) reportou 18 moderadas, 0 altas e 0 críticas. Estes números são resultados de execuções distintas; não foram normalizados nem apresentados como ausência de vulnerabilidades.
- Todos os caminhos afectados da auditoria local completa estão marcados dev=true no lockfile. O aviso de origem identificado é [minimatch: potencial negação de serviço por amplificação de globparts, GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), propagado pela árvore ESLint/typescript-eslint. npm audit --omit=dev --json terminou com 0 vulnerabilidades reportadas. Isto delimita o resultado da auditoria, sem provar ausência absoluta de risco.
- Pendência de manutenção: avaliar uma actualização controlada das ferramentas de desenvolvimento e voltar a testar. Não se executou npm audit fix, não se actualizaram dependências e package-lock.json permaneceu intacto.
- Avisos adicionais: ESLint 9 descontinuado, revisão pendente do postinstall de unrs-resolver segundo npm 11.19.1, avisos de descontinuação das actions v4/Node 20 e de APIs usadas pelas actions. Não se aprovou qualquer script nem se alteraram permissões para os ocultar. A pipeline terminou com sucesso apesar desses avisos.
- A Etapa B não foi executada. Bootstrap e homologação real de Auth/SMTP/cookies e RLS/PostgREST aguardam autorização e execução no projecto de desenvolvimento.

Esta secção final é uma actualização exclusivamente documental posterior ao commit validado acima. O SHA dos ensaios é 8b2ade6; o commit documental que regista estes resultados não altera código, SQL, dependências ou testes. O SHA-256 da migração permanece 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58.

## Prontidão da Etapa B — baseline e recuperação no plano gratuito

Foi preparado o [procedimento de baseline e recuperação](baseline-e-recuperacao.md), com fontes oficiais Supabase, instruções de painel para o operador, distinção entre SQL/serviços/recriação e limites do plano gratuito. Não é necessário contratar recursos pagos para esta preparação.

Ficheiros novos:

- supabase/inspection/fase1-baseline.sql: consulta READ ONLY que produz 15 linhas de contexto, contagens e inventário de relações, colunas, funções, triggers, ACLs, extensões, event triggers, políticas, índices, constraints e papéis. Não recolhe passwords/tokens/chaves nem exporta contas ou definições completas de funções. Os resultados reais devem ficar em armazenamento privado, fora do repositório público.
- supabase/recovery/fase1-empty-baseline.sql: transacção compensatória específica, para autorização separada após COMMIT, removendo só os objectos enumerados da Fase 1. Não é backup integral. Tem confirmação explícita do operador, locks, verificação de contas Auth/Storage/dados e comparação do conteúdo dos catálogos iniciais. Remove explicitamente as políticas com referências cruzadas e usa DROP RESTRICT, sem CASCADE.
- tests/unit/migration-recovery.test.ts: sete casos de PostgreSQL local isolado via PGlite. Verificam recuperação após o COMMIT original, igualdade do inventário anterior, preservação de objectos/dados testemunho, reaplicação local e seis recusas: sem confirmação, conta Auth, Storage, dados de uso, catálogo alterado ou dependência adicional. A falha tardia por dependência é seguida de ROLLBACK e conserva o estado completo.

Evidência local final: lint e TypeScript aprovados; **57 testes aprovados em 7 ficheiros**, incluindo todos os 50 anteriores. PGlite usa tabelas Auth/Storage mínimas de teste; não homologa os serviços geridos Supabase ou o restauro de ficheiros. O build e os 42 testes de navegador aprovados anteriormente referem-se ao commit 8b2ade6 e ao código da aplicação, que esta preparação não altera; não foram repetidos nesta revisão.

A migração mantém o SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58. Não há alterações em package.json/package-lock.json, configurações Auth, serviços pagos ou main. Nenhuma consulta ou escrita foi executada no Supabase remoto nesta preparação.

**Conclusão actual: NÃO APTO ainda para solicitar autorização da Etapa B.** O método gratuito e o ensaio local estão preparados e validados, mas não foi recebida/revista a baseline real exportada do SQL Editor nem o registo das configurações não secretas do painel. Os zeros Auth e a ausência de colisões continuam baseados no resultado anterior fornecido pelo responsável; a existência/ausência actual de Storage e de outros objectos personalizados não foi presumida. Falta apenas executar os passos de leitura/documentação do guia e rever os resultados para decidir se a recuperação limitada é aplicável.

Riscos residuais: o inventário é comprovativo, não reconstitui definições/dados arbitrários; a compensação só serve antes de qualquer uso/alteração posterior; dependências dinâmicas requerem revisão humana; alterações/perda de infraestrutura gerida podem exigir suporte ou recriação com configurações manuais; vulnerabilidades de ferramentas de desenvolvimento e homologação real Auth/RLS/PostgREST continuam pendentes. Não se usará ROLLBACK como promessa de desfazer um COMMIT.

## Actualização vigente — baseline real recebida

Foi recebido e analisado integralmente o CSV de 15 linhas exportado pelo responsável. A [análise detalhada](analise-baseline-real.md) regista contagens, comparação com a migração, dependências, permissões e condições de recuperação. SHA-256 do ficheiro original: 8af2560c6e7296d3d63498096ada927529de93959bc04251a11575dd1a15068d. O CSV bruto fica fora do Git público.

Captura em 2 de Novembro de 2026, 16:06:06 UTC (17:06:06 Africa/Luanda), PostgreSQL 17.11, operador postgres, read_only=on. Confirmados 0 utilizadores Auth, 0 buckets, 0 objectos Storage e ausência de relações/funções/políticas de public nas selecções consultadas. Os 8 triggers são de Storage; não existe auth_user_profile. Os 131 índices e 129 constraints inventariados são de Auth/Storage, sem índices/constraints de public. Foram revistas as 12 ACLs predefinidas, 5 extensões, 6 event triggers, 3 ACLs de esquemas, 3 papéis API e 24 memberships. Não se identificou colisão efectiva com os objectos da Fase 1. O beneficiário PUBLIC tem USAGE no esquema public, o que não é concessão de DML em tabelas.

O estado de ausência de contas/dados satisfaz o âmbito da recuperação compensatória ensaiada. Não se restaurou este CSV em PGlite como dump, nem se validou remotamente a recuperação. A baseline não comprova a identidade do projecto, configurações Auth externas ou todos os privilégios do operador.

Próximos passos mínimos, sem escrita remota: confirmar a identidade/cópia privada da baseline e o registo manual do painel; executar supabase/inspection/fase1-operator-permissions.sql no papel previsto para a Etapa B e enviar as duas grelhas. Este complemento observa CREATE/USAGE, SELECT/TRIGGER/REFERENCES, EXECUTE e a permissão necessária ao lock SHARE da recuperação, além de ownership/papel especial Supabase. Não adquire esse lock nem concede privilégios. Foi validado numa fixture PostgreSQL PGlite local, com 9 checks OK; o resultado local não prova permissões do projecto real.

**Decisão vigente: NÃO APTO ainda para solicitar autorização da Etapa B**, por faltarem as confirmações manuais e a revisão de permissões efectivas. A baseline real já foi recebida e não é mais a pendência. A migração mantém o SHA-256 original 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58. Nenhuma alteração na migração, recuperação, dependências, Supabase ou main. Sem novos testes de aplicação nesta revisão documental/consulta de leitura; mantidas as evidências anteriores, sem recontagem como nova execução.


### Confirmações do responsável após a recepção do CSV

O responsável confirmou expressamente que o ficheiro é do projecto novo de desenvolvimento correcto e que guardou cópia privada adicional. Confirmou também signup público e acessos anónimos desactivados, confirmação de email obrigatória e autenticação por email activa. Informou que ainda não guardou um registo privado completo das restantes configurações e pediu orientação sem alterações.

Foram preparados [guia passo a passo](guia-registo-painel.md) e [modelo preenchível](modelo-registo-painel.txt). O modelo deve ser preenchido e guardado apenas privadamente; não se solicita publicação de credenciais, ficheiros completos de configuração ou screenshots com segredos. O guia permite registar opções não localizadas/indisponíveis no Free sem as activar ou contratar recursos.

Pendências vigentes reduzidas a: completar o registo privado do painel e rever as duas grelhas da consulta de privilégios do operador. Não se pede nova confirmação da identidade/cópia já fornecida, nem nova exportação integral da baseline se não houve alterações. A conclusão global continua NÃO APTO para solicitar a Etapa B até resolver essas duas pendências; o inventário real foi aceite sem BLOQUEIO efectivo identificado no seu âmbito.

### Segunda grelha de permissões recebida

O responsável reportou postgres como operador e proprietário da base, supabase_auth_admin como proprietário de auth.users, ausência de herança desse proprietário e pertença efectiva ao papel supabase_privileged_role. Estes metadados são compatíveis com Supabase e não bloqueiam por si a migração. A primeira grelha com os nove checks ainda não foi recebida; consulta executada sem erro não significa nove checks OK.

Para a recuperação, a remoção explícita do trigger em auth.users exige comprovar a autorização apropriada de uma tabela de outro proprietário. A pertença ao papel privilegiado não prova a configuração específica supautils.drop_trigger_grants documentada pelo Supautils. Preparada supabase/inspection/fase1-drop-trigger-permission.sql, apenas de leitura de uma configuração não secreta, sem alterações ou DROP. A [análise detalhada](analise-baseline-real.md) distingue estes pontos.

Mantém-se NÃO APTO para solicitar a Etapa B enquanto faltarem a primeira grelha, a confirmação de remoção do trigger no procedimento gerido e o registo privado do painel. O responsável está a preparar o registo. Não se alteraram proprietários, roles, configurações, migração, recuperação ou o Supabase.

A primeira grelha pode ser obtida isoladamente com [fase1-operator-checks.sql](../../supabase/inspection/fase1-operator-checks.sql), que devolve apenas os nove checks. Isto evita perder a primeira grelha quando o SQL Editor apresenta apenas o ultimo SELECT.
