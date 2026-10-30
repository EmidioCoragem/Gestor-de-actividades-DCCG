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
