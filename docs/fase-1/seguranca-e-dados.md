# Modelo, segurança e matriz de acesso

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
