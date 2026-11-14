# F2-F01 — Rascunhos de actividades

## Autorização e base de trabalho

Implementação local expressamente autorizada pelo responsável, conservando os requisitos do Portal Empresarial v1.4. Esta autorização permite o primeiro lote da Fase 2 mesmo com homologação operacional da Fase 1 pendente; não autoriza implantação, SQL remoto, bootstrap, sincronização Git ou os lotes seguintes.

Branch: `fase-1-autenticacao-permissoes`. Base Cloud: `915d6d1fd0ec6cdc6254764b0fba3ef706b0bcbb`. Na consulta de referências efectuada no início da tarefa, o GitHub apontava para `89e186ca3777010063a73182a74ef57abb92ade9`; esse era também o último estado Codespaces comprovado pelas saídas do operador. Não existe acesso directo ao checkout Codespaces nesta tarefa. O Cloud estava limpo e exactamente um commit à frente, sem divergência; por isso a implementação local não exigiu sincronização.

O commit `915d6d1f`, filho directo de `89e186c`, acrescenta nove ficheiros/alterações para diagnóstico mobile sanitizado e preparação da verificação incremental AT/AF, com documentação e testes. Não altera a autenticação de produção. O presente lote e esse commit não ficam disponíveis no Codespaces por este registo: publicação e avanço do checkout exigem autorização específica. Não foram executados push, pull, merge, rebase ou operações sobre stashes.

Foram recuperadas as alterações não consolidadas dos agentes nas páginas, formulário, CSS, módulos, migração e fixtures. A conferência dos ficheiros efectivos e do Git orientou a integração; não se reconstruíram componentes da Fase 1 nem se repetiram os ensaios de cifragem ou o diagnóstico mobile já aprovados.

## Contratos fechados

- Uma única base de código e a organização existente servem os cenários empresarial e departamental. A unidade e o âmbito efectivo governam o acesso; não existe um modo departamental com segurança reduzida.
- Criar exige perfil activo, papel gerencial elegível e capacidades efectivas `activities.create` e `activities.read` sobre a mesma unidade activa. A elegibilidade é um registo privado de papéis, inicialmente `manager`, `director` e `executive`; clonar uma capacidade para um papel não gerencial não concede elegibilidade. Novos papéis gerenciais exigem manutenção revista e autorizada. Administrador técnico é excluído. AT/AF não recebe poderes operacionais automaticamente.
- O banco atribui UUID, código único `ACT-` seguido de 32 caracteres hexadecimais, autoria a partir de `auth.uid()`, estado `draft`, versão 1 e instantes UTC. O formulário só envia título, descrição, unidade e identificador de intenção. Título normalizado: 1–200 pontos Unicode; descrição: até 10 000. Apresentação temporal em Africa/Luanda.
- Os sete estados permanecem reservados: Rascunho, Atribuída, Em execução, Aguardando validação, Concluída, Suspensa e Cancelada. Este lote só admite Rascunho; não permite atribuir, executar ou concluir. Não existe via para contornar a validação obrigatória nem autovalidar. Executores múltiplos/principal, responsáveis/validadores, prioridades, prazos, alterações justificadas, comentários e anexos pertencem aos lotes seguintes e não são declarados implementados.
- `create_activity_draft` efectua criação, registo mínimo de evento e auditoria na mesma transacção. A chave de intenção é única por actor; repetir chave e conteúdo devolve o mesmo resultado sem nova auditoria. Conteúdo diferente com a mesma chave é conflito. A autorização é revalidada também no replay. Não se duplica título/descrição no evento ou auditoria.
- A listagem é paginada, ordenada por data e UUID; o detalhe e a lista obedecem ao RLS. Relações de nomes indisponíveis não apagam um rascunho autorizado: são apresentadas com indicação neutra, sem usar UUID como nome. Erro, recusa e lista vazia são estados distintos; erro de contagem não significa zero registos.
- Escritas directas por papéis API são recusadas. A aplicação usa exclusivamente o cliente da sessão, sem chave administrativa ou fallback fictício. A Server Action exige origem canónica, sessão e payload estrito; a RPC decide a autoridade efectiva. O formulário fica inactivo antes da hidratação, bloqueia duplo envio e conserva chave/conteúdo depois de resultado incerto, sem repetição automática. Uma nova intenção só nasce por acção explícita.
- A criação só é apresentada quando a RPC confirma unidades autorizadas não vazias, além da capacidade de apresentação da sessão. Capacidade isolada não faz surgir um formulário para um papel inelegível. Vazio, recusa e indisponibilidade dessa RPC mostram informação própria, sem botão de criação.

## Persistência, concorrência e migração

A migração nova é `supabase/migrations/202611130001_activity_drafts.sql`. Requer a fundação e a incremental AT/AF previamente instaladas e verificadas. As duas migrações anteriores são preservadas. A instalação nova é transaccional e falha perante dependências, proprietários, guardas ou ACLs incompatíveis. Não reaplica a migração original e não cria contas ou concessões de pessoas.

SHA-256 da migração candidata: `c4cc4a9f2a664ce6fcf792b28f9358c8f4660ddf3b23fabf6f240ffbd3517886`. Fundação preservada: `56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58`; incremental AT/AF preservada: `fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5`.

Objectos: tabelas públicas `activities` e `activity_events`, registo privado de elegibilidade e tabela privada de idempotência, helpers com `search_path` fixo, duas políticas RLS e RPCs de leitura de unidades/criação. SELECT é concedido ao papel autenticado e limitado por RLS; INSERT/UPDATE/DELETE/TRUNCATE não são concedidos à API.

Para impedir criação com autorização revogada durante uma espera, a RPC requer READ COMMITTED, adquire SHARE sobre seis tabelas de autoridade e revalida a autorização. O relógio é novamente consultado depois da espera pelo advisory lock da intenção, incluindo expiração de concessões. O timeout de lock é 5 segundos; conflitos/timeouts falham sem repetir automaticamente. O desenho permite criadores simultâneos, mas bloqueia brevemente alterações às autoridades. Esta contenção global é uma limitação explícita do primeiro lote de baixo volume e deve ser medida antes da homologação; não deve ser generalizada aos lotes seguintes sem revisão. A função `write_epoch` da Fase 1 não é alterada nem usada como atalho.

O pós-verificador AT/AF existente continua específico à etapa AT/AF **anterior à Fase 2**. As suas contagens estritas podem assinalar os novos objectos legítimos como extras se for executado depois de F2-F01. A ordem de instalação/verificação tem de respeitar esse âmbito; não eliminar objectos F2 nem enfraquecer o verificador para forçar aprovação.

## Verificação local

Os testes usam exclusivamente dados sintéticos, cópias sem `.env` e motores locais descartáveis; nenhum teste autoriza ou comprova persistência remota.

| Verificação | Resultado | Alcance |
|---|---|---|
| `npm run lint` | APROVADO | ESLint local |
| `npm run typecheck` em cópia isolada | APROVADO | Typegen e TypeScript, sem `.env` |
| `node tests/run-app-isolated.mjs offline` | APROVADO | Build Webpack e 63 Playwright offline, computador/tablet/telemóvel |
| `npm test`, sem variáveis Supabase | 612/612 APROVADOS, 35 ficheiros | Inclui contratos, Server Action, SQL PGlite, repositório, páginas SSR e regressões anteriores |
| `node tests/integration/activity-drafts-native.mjs` | 18/18 APROVADOS | PostgreSQL 17.11 nativo, múltiplas sessões, concorrência, rollback e ACLs |
| Harness Playwright do formulário | 12/12 APROVADOS | Quatro casos em computador/tablet/telemóvel, Chromium instalado |

PGlite executa SQL real em memória com identidades sintéticas. Não equivale a concorrência nativa multi-sessão. O Playwright offline verifica os bloqueios sem configuração Supabase; não prova gravação remota nem homologação Auth.

Os 84 casos dirigidos iniciais e os 45 casos de repositório/páginas estão incluídos nos 612 do Vitest, sem contagem adicional como testes independentes. ESLint e TypeScript foram confirmados com os ficheiros finais. O build foi novamente confirmado depois do ajuste restritivo de visibilidade da criação; os 63 casos offline, já aprovados antes desse ajuste, não foram repetidos, pois os seus percursos sem Supabase não atingem o formulário.

O harness opt-in `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node tests/fixtures/activity-drafts-form-server.mjs` prepara uma cópia sem `.env`, acrescenta uma rota exclusiva de teste e substitui a importação da acção **apenas na cópia**, por respostas sintéticas determinísticas. O componente é o formulário real hidratado. As páginas são também renderizadas com fronteiras de dados/sessão simuladas e verificadas como HTML; essa parte não executa a sessão ou os repositórios reais no browser. Pedidos externos são bloqueados, a porta 3122 fica em loopback e a cópia é removida no final.

As tentativas iniciais identificaram dois defeitos no próprio teste: rota iniciada por `_` tratada pelo Next como pasta privada (404/timeout de preparação), e selector exacto de label que incluía o conteúdo das opções do select (timeout do primeiro caso). Corrigidos o caminho para `qa-f01` e o selector para o papel `combobox`/nome acessível. A execução com selector defeituoso foi interrompida, evitando repetir a mesma falha em todos os formatos; o runner passa a parar na primeira falha. Nenhuma destas correcções alterou o código funcional. O ensaio final completou 12/12 em 1,1 minutos, com limpeza confirmada. Validou teclado, pending, duplo envio, repetição manual com chave/conteúdo iguais, conflito sem repetição, componente sem unidades, HTML de lista/detalhe/estados e ausência de overflow com título longo. As falhas da fixture não identificam a causa histórica da intermitência Auth mobile.

O ensaio nativo utilizou exclusivamente a imagem `postgres:17-alpine` já em cache (`sha256:ab20e934b27ba3ff927c1b4c9ff8cf6c32f315f743efe68dd3441182a87fb085`), `--pull=never`, rede `none`, TCP desactivado, nenhum porto publicado e dados em tmpfs. Confirmou remoção do seu contentor e ausência do seu token entre contentores restantes. Instalou as três migrações apenas nessa base fictícia descartável.

Provas nativas: criações de intenções distintas em paralelo; dois pedidos iguais com um único rascunho/evento/auditoria e replay; conflito de conteúdo; revogação e suspensão confirmadas durante a espera; expiração durante espera advisory tanto para criação como para replay; falha injectada na auditoria com rollback integral; recusa de REPEATABLE READ/SERIALIZABLE; recusas de DML directo, acesso privado e operações por `service_role`/`anon`. As identidades/JWT são fixtures, não sessões emitidas pelo Supabase.

## Limites e homologação

O código integra persistência PostgreSQL real, mas a migração não foi aplicada ao Supabase. Sem instalação autorizada, o portal apresenta indisponibilidade explícita; não apresenta dados sintéticos como se fossem reais. Testes com contexto JWT simulado não homologam emissão de sessões, PostgREST, configuração remota ou os serviços geridos Supabase.

Continuam pendentes: homologação Auth/RLS/AT/AF da Fase 1, recuperação PostgreSQL demonstrada, causa histórica da intermitência mobile, aprovação e aplicação remota da incremental AT/AF e desta migração, validação de ACLs/joins/contagens pelo PostgREST real e ensaios com identidades autorizadas distintas. A preparação local não declara o portal pronto para produção. Recuperação, armazenamento institucional, chaves, alojamento e continuidade mantêm as decisões anteriores, sem operações novas.

Próximo lote recomendado, sujeito a autorização: atribuição do rascunho com múltiplos executores, executor principal, responsáveis e prazos, conservando âmbito e rastreabilidade. O contrato de transições e validação obrigatória deve ser fechado antes de habilitar qualquer mudança de estado. Este relatório não inicia esse lote nem autoriza instalação remota.

## Coordenação

Base de Dados editou a migração; Desenvolvimento os contratos, validação, política, repositório e Server Action; Interface/UX as páginas, formulário e CSS; Testes as fixtures e verificações; Segurança reviu as fronteiras em leitura. O Codex principal consolidou contratos, integração, documentação e verificações finais. Um editor por ficheiro, sem alterar os controlos da Fase 1 ou dependências.

Ficheiros funcionais: `src/modules/activities/{contracts,validation,policy,repository,actions}.ts`; `src/components/activities/{draft-form.tsx,activities.module.css}`; `src/app/(private)/actividades/{page.tsx,loading.tsx,[id]/page.tsx,[id]/loading.tsx}` e a migração acima. Documentação: este relatório e a actualização de continuidade em `docs/fase-1/entrega.md`. As fixtures e testes `activity-drafts-*` são exclusivamente locais e contêm apenas dados sintéticos.

Testes adicionados: `tests/unit/activity-drafts-{contracts,actions,database,repository,pages}.test.ts`, `tests/fixtures/activity-drafts-database.ts`, `tests/integration/activity-drafts-native.mjs`, `tests/fixtures/activity-drafts-form-server.mjs` e `tests/e2e/activity-drafts-form.spec.ts`. O caso de browser é opt-in e só deve ser executado pelo harness indicado, não contra o portal real.

**Resultado: APTO para o âmbito local F2-F01.** Não há testes locais obrigatórios bloqueados nesta entrega. Segurança aprovou a revisão das fronteiras e as provas locais passaram; instalação remota, integração real e produção permanecem por homologar. Não houve alteração de Auth/CSRF/RLS/AT-AF existentes, segredos, dependências ou infra-estrutura de produção, nem operações Supabase, exportações ou uso de dados empresariais.
