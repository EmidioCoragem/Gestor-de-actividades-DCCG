# Fase 1 — arquitectura e limites

Branch de origem aprovada: fase-0-fundacao, commit aed03d0. Main foi consultada por Git e mantém o commit inicial 058e03a. Não foi feito merge. A API recusou a consulta ao PR #1; a aprovação funcional é a autorização expressa do documento consolidado recebido do responsável.

## Camadas

- src/app/(private): as onze rotas anteriores, preservando os endereços. O layout verifica identidade real e estado activo antes de apresentar a shell. Cada página sensível repete a verificação de capacidade para não depender apenas do layout.
- src/modules/auth: configuração, sessões verificadas por getUser, entrada, recuperação, actualização de palavra-passe e saída. src/proxy.ts renova os cookies Supabase SSR; não concede permissões. Não há registo público, sessões fictícias ou modo de demonstração que contorne a protecção.
- src/modules/access: validação Zod, autorização servidor, mapa de apresentação, operações administrativas. O browser não define a identidade do actor. Next Server Actions mantêm a verificação de origem da framework; a base de dados volta a decidir os poderes e o âmbito.
- supabase/migrations: alterações transaccionais, integridade, RLS e RPCs. Sem escritas directas autenticadas nas tabelas administrativas; escrita exclusivamente por funções autorizadas com search_path fixo e auditoria.
- src/modules/cost-centers e integrations: contratos de referência e de pré-visualização, sem interface de importação, processamento de ficheiros ou rede ERP.

## Identidade e organização

Nome Gestor de Actividades, subtítulo Gestão Integrada. Os tokens CSS concentram azul-marinho #102A43, secundário #1E3A5F, destaque #2563EB, fundo #F3F6FA, apoio #64748B e branco. Verde, vermelho e âmbar ficam reservados a sucesso, erro e aviso. A disposição do Dashboard foi preservada.

A identidade apresentada deriva exclusivamente de profiles, cargos, unidades e atribuições devolvidos para o utilizador autenticado. As datas de vigência são apresentadas em Africa/Luanda; os instantes são timestamptz UTC e as datas de referência contabilística continuam date.

Uma pessoa tem uma associação primária actual de cargo/unidade e histórico de associações. Pode possuir vários perfis e âmbitos simultâneos. Caso a empresa necessite de múltiplos cargos primários simultâneos, essa regra deverá ser validada antes de alargar a restrição actual. Responsáveis de unidade e linhas de chefia preservam vigência e auditoria.

## Interfaces preparadas

Entrada, recuperação, definição de palavra-passe por ligação verificada e saída. Administração de utilizadores: convites, estados e associações. Estrutura: unidades, reparenting autorizado, cargos, responsáveis e chefias. Permissões: perfis, capacidades e concessões a terceiros, com vigência e revogação. As consultas são filtradas por RLS; não apresentam dados fictícios.

O administrador de um âmbito só pode mover uma associação se também tiver poderes na unidade anterior. A função de gestão de unidades exige poderes na unidade e no novo pai. Escritas em árvore são serializadas por locks transaccionais e rejeitam ciclos. Não se removem trabalhadores nem se apaga histórico.

## Limitações explícitas

Nesta máquina não existe projecto Supabase configurado. Fluxos Auth, SMTP, sessão real e operações administrativas pela API PostgREST estão implementados no código mas **não validados ponta a ponta** contra Supabase. O PostgreSQL isolado testa SQL/RLS com o contexto auth.uid simulado pela configuração JWT de testes, não a emissão/verificação de JWT do Supabase.

Na ausência de configuração, as rotas privadas redireccionam para /configuracao e os formulários de autenticação ficam desactivados. Após configurar um projecto, uma conta inactiva/suspensa ou com falha de configuração de permissões recebe /acesso-restrito.

Notificações, fecho, KPIs, planeamento e gestão de actividades mantêm-se como módulos futuros com rotas privadas e capacidades explícitas. As regras de validação e atribuição são infraestrutura, sem concluir ou criar actividades reais. Delegations tem fundação de dados, mas não concede poderes nesta fase; o seu fluxo temporário exige desenho/validação adicional. Não há organograma interactivo, importador Excel/CSV ou conectores ERP. Não foi iniciada a Fase 2.
