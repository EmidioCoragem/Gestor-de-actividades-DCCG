# Fase 1 — arquitectura e limites

## Cenários permanentes — decisão aprovada

Decisão aprovada pelo responsável em **9 de Novembro de 2026 (Africa/Luanda)**, reutilizando a revisão dos cinco agentes. Este registo altera apenas o planeamento: não implementa configuração, funcionalidades ou infra-estrutura, não homologa produção nem inicia a Fase 2.

| Aspecto | A — Empresarial | B — Departamental |
|---|---|---|
| Âmbito | Vários departamentos, direcções e unidades de uma empresa | Departamento autorizado e subunidades, com expansão futura |
| Base técnica | Base única modular Next.js/TypeScript/Tailwind e Supabase/PostgreSQL | A mesma base de código e contratos, sem fork ou reconstrução funcional |
| Segurança | Identidade verificada, permissões por âmbito/vigência, RLS, segregação AT/AF e auditoria | Os mesmos requisitos; equipa menor não autoriza acumulação implícita de poderes |
| Funcionalidades | Todos os requisitos originais preservados, implementados por fase aprovada | Os mesmos requisitos, com disponibilidade por âmbito/fase sem remover módulos |
| Governação | Aprovação e operação institucional com T.I. | Autorização dos responsáveis pelos dados e operação formalmente atribuída; não contorna uma recusa institucional |

**Âmbito e ambiente são eixos diferentes:** empresarial/departamental define alcance organizacional; desenvolvimento/demonstração e produção definem operação. Separar dados e segredos de produção dos ensaios nos dois cenários. Codespaces continua reservado a desenvolvimento e ensaios autorizados.

### Configurações necessárias — ainda não implementadas

| Configuração conceptual | Regra proposta |
|---|---|
| Identidade da organização e cenário A/B | Resolvidos no servidor, sem aceitar poderes declarados pelo browser |
| Unidade de referência e unidades abrangidas | Identidades estáveis e hierarquia existente, sem departamentos fixos no código |
| Âmbitos permitidos e corrente | Derivados das concessões; servidor, RPCs e RLS validam cada alvo |
| Módulos disponíveis | Catálogo comum por fase/configuração, distinto da autorização e sem eliminação de requisitos |
| Ambiente e origem canónica | Desenvolvimento e produção separados, com URLs, segredos e destinos próprios |
| Fronteira de implantação | Decidir implantação departamental própria ou partilhada; na partilhada, provar isolamento inclusive perante papéis globais, sem tratar selecção de unidade como barreira |
| Anexos | Armazenamento privado, quota, acesso e retenção específicos, quando implementados |
| Recuperação | Destinos autorizados, destinatário público age, custódia independente da chave, frequência, retenção e objectivos de recuperação |
| Operação | Responsáveis, alertas, agendamento, orçamento e capacidade aprovados por ambiente |

Estes nomes são conceitos, **não novas variáveis ou opções já disponíveis**. Seleccionar um cenário não activa contas nem concede privilégios. O modelo actual suporta uma empresa e unidades hierárquicas; não demonstra isolamento entre empresas independentes. No cenário B, preservar a raiz organizacional exigida pelo modelo e delimitar o departamento/subárvore. Expandir para A deve acrescentar unidades e concessões aprovadas, preservando identificadores e histórico, sem concessões automáticas.

Preservar Dashboard, componentes e tokens azul-escuro aprovados. Contexto, etiquetas e eventual selector de âmbitos são propostas futuras sujeitas a aprovação visual; ocultar menus ou seleccionar uma unidade não substitui autorização. Não apresentar métricas fictícias como resultados reais.

### Dados operacionais, anexos e backups

| Tipo | Destino | Finalidade e limite |
|---|---|---|
| Dados operacionais | Supabase/PostgreSQL | Fonte transaccional de relações, estados, permissões e auditoria; Drive não substitui o banco |
| Anexos | Storage privado com referências PostgreSQL, quando aprovado | Documentos operacionais com acesso autorizado; um dump de metadados não copia os ficheiros |
| Backups | Google Drive como opção **definitiva**, com cifra age | Pontos de recuperação, sem sincronização de tabelas ou uso como repositório operacional de anexos |

Drive pessoal ou institucional só pode receber os dados expressamente autorizados. A pasta pessoal de testes declarada pelo responsável limita-se a material inteiramente fictício e cifrado; não autoriza dados empresariais. Para dados reais, aprovar titularidade, acessos/partilhas, recuperação da conta, continuidade na mudança de responsável, retenção, eliminação e obrigações aplicáveis de protecção de dados. O cenário departamental não dispensa essa aprovação.

Cifrar antes da transferência; manter a chave privada separada dos arquivos e fora do Codespaces, com custódia protegida de contingência e responsáveis designados. Manter segunda cópia independente em computador autorizado, conforme a estratégia aprovada. A falta de confirmação de cifra de disco no Windows corporativo exige decidir um mecanismo de custódia aprovado, sem contornar políticas.

Guardar cada ponto em arquivo distinto, com manifesto protegido de âmbito, versões e integridade. Não depender apenas do histórico automático de versões do Drive nem presumir imutabilidade. Validar envio privado autenticado, recuperação das cópias, SHA-256, decifragem autenticada e restauro isolado. Transferência e agendamento futuros ficam separados dos módulos de negócio e exigem autorização própria.

Dimensionar a quota pela soma dos pontos retidos e folga para receber um novo ponto antes de eliminar o anterior; dimensionar separadamente o disco de exportação/restauro. Frequência e retenção decorrem do volume real e dos objectivos **RPO** (perda máxima aceitável) e **RTO** (tempo máximo de recuperação), ainda por aprovar. Monitorizar quota e falhas; prever aumento de capacidade com orçamento e aprovação. Contabilizar alojamento, banco, anexos, tráfego, Drive e ensaios separadamente. Não foram aprovados preços, quotas adicionais ou contratação.

O backup lógico abrange aplicação e dependências reais indispensáveis de Auth/papéis, a delimitar antes de exportar. Não recupera automaticamente SMTP/OAuth/JWT, ficheiros Storage, configuração PostgREST, chaves Vault ou todo o projecto gerido. Não exportar sessões/tokens/credenciais indiscriminadamente. Checksum e cifra não demonstram restauro; após COMMIT, qualquer recuperação exige plano e autorização próprios.

### Preservação dos requisitos e gates

Preservam-se integralmente os [requisitos originais](../requisitos.md) e os [requisitos da Fase 1](../requisitos-fase-1.md). Actividades, executores, validação operacional, notificações, fecho mensal, centros de custo, planeamento, KPIs, relatórios e integrações mantêm os âmbitos e fases aprovados; nenhuma funcionalidade é removida por escolher B. Os cenários e a configuração conceptual são **planeamento aprovado**, não implementação ou homologação.

Prioridade: recuperação verificável e homologação da Fase 1, incluindo instalação/validação AT/AF sob autorização própria. Outra fase ou produção exige aprovação expressa. Consultar o [plano futuro de implantação](supabase.md#plano-futuro-de-implantação) e o [progresso consolidado](entrega.md#progresso-consolidado--9-de-novembro-de-2026).

## Contexto da entrega inicial — histórico preservado

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

## Limitações explícitas da entrega inicial — histórico

Nesta máquina não existe projecto Supabase configurado. Fluxos Auth, SMTP, sessão real e operações administrativas pela API PostgREST estão implementados no código mas **não validados ponta a ponta** contra Supabase. O PostgreSQL isolado testa SQL/RLS com o contexto auth.uid simulado pela configuração JWT de testes, não a emissão/verificação de JWT do Supabase.

Na ausência de configuração, as rotas privadas redireccionam para /configuracao e os formulários de autenticação ficam desactivados. Após configurar um projecto, uma conta inactiva/suspensa ou com falha de configuração de permissões recebe /acesso-restrito.

Notificações, fecho, KPIs, planeamento e gestão de actividades mantêm-se como módulos futuros com rotas privadas e capacidades explícitas. As regras de validação e atribuição são infraestrutura, sem concluir ou criar actividades reais. Delegations tem fundação de dados, mas não concede poderes nesta fase; o seu fluxo temporário exige desenho/validação adicional. Não há organograma interactivo, importador Excel/CSV ou conectores ERP. Não foi iniciada a Fase 2.
