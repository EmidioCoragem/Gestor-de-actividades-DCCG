# Lote 1 — diagnóstico do build e dos testes locais

Data: 9 de Novembro de 2026 (Africa/Luanda). Branch exclusiva `fase-1-autenticacao-permissoes`. Código de referência: `ccf8d4140b5e2c9bdda30b5dcac5398750665c60`.

## Âmbito e autorização

Diagnóstico, eventual correcção mínima comprovada e validação local de ESLint, TypeScript, Vitest, Webpack e Playwright existentes. Desenvolvimento e Testes conduziram o trabalho; Segurança reviu a solução e o Codex principal consolidou o resultado. Não se iniciaram os Lotes 2–4 nem a Fase 2.

Execução no checkout Cloud `/workspace/Gestor-de-actividades-DCCG`, não no Codespaces do responsável. Não se fizeram ligações Supabase, SQL remoto, bootstrap, instalação de serviços, alteração de infra-estrutura, exportação, operações Auth reais ou criação de chaves. As dependências instaladas foram reutilizadas, sem actualizações de versões. As bases/contextos fictícios das suites existentes não constituem aplicação de migrações no projecto remoto.

## Falhas de partida

Na execução anterior, o build Webpack terminou com `Could not parse output from TypeScript's --showConfig.`; o comando filho devolvia exit 0, stdout e stderr vazios. O Playwright offline não chegou a executar cenários. Uma tentativa Auth desktop terminou antes dos testes por falha de arranque de `config.webServer`; a mensagem, isoladamente, não identificava a causa.

## Reprodução e causa comprovada

| Controlo local | Dentro do sandbox | Fora do sandbox, após aprovação da revisão automática |
|---|---|---|
| Subprocesso Node trivial com `console.log`, stdout capturado em pipe | Saída vazia; numa variante também `EPERM`, apesar de status 0 | Mensagem esperada e status 0 |
| TypeScript 5.9.3 `--version` capturado | Saída vazia | `Version 5.9.3` |
| TypeScript `--showConfig` capturado | Saída vazia; interpretação JSON impossível | JSON válido, 5 740 bytes no controlo de Desenvolvimento |
| Mesmo controlo com `NODE_DISABLE_COMPILE_CACHE=1` | Não resolve | Mesmo JSON válido |
| Saída do subprocesso herdada ou dirigida a ficheiro temporário regular | Saída esperada | Não foi necessário repetir esse controlo |

O TypeScript executado directamente pelo shell também devolveu a configuração normal. O programa Node trivial reproduziu o problema sem TypeScript ou código da aplicação. A hipótese de cache de compilação foi refutada: **a causa comprovada é uma limitação de comunicação por pipe com processos filhos no sandbox utilizado nesta execução**. Não se demonstrou defeito no `tsconfig`, no compilador, nas dependências ou no código funcional.

Controlo mínimo executado pelo coordenador no contexto exterior autorizado (stdout recebido: `LOCAL_PIPE_CONTROL`):

```sh
node <<'JS'
const {spawnSync}=require('node:child_process');
const r=spawnSync(process.execPath,['-e','console.log("LOCAL_PIPE_CONTROL")'],{
  encoding:'utf8',stdio:['ignore','pipe','pipe']
});
console.log(JSON.stringify({status:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.code}));
JS
```

O controlo TypeScript foi `node node_modules/typescript/lib/tsc.js --showConfig --project <cópia>/tsconfig.json --pretty false`, comparando execução directa e captura por subprocesso Node nos dois contextos. A autorização exterior correspondeu a `sandbox_permissions=require_escalated` na ferramenta de execução Cloud; não é uma opção persistente do portal nem uma recomendação para desactivar a protecção da aplicação.

O erro anterior do arranque Auth não permitia atribuir-lhe essa causa de forma independente. A validação posterior usa o mesmo runner no contexto de execução autorizado e regista o resultado, sem presumir equivalência apenas pela mensagem anterior.

## Tratamento mínimo

Para o problema de captura, o tratamento mínimo foi executar os runners existentes fora do sandbox através da permissão de execução local aprovada pela revisão automática, sem alterar código funcional, `node_modules`, lockfile ou configuração persistente da aplicação. Isso muda apenas o contexto da execução autorizada; não modifica a infra-estrutura ou os controlos da aplicação. O problema de encerramento da fixture identificado depois é tratado separadamente abaixo.

Mantiveram-se `NODE_OPTIONS`, validação TLS, origem/CSRF, Auth, RLS, AT/AF e permissões. Não foi aplicado `NODE_DISABLE_COMPILE_CACHE` como correcção, nem introduzido bypass para obter aprovação. Segurança aprovou este âmbito delimitado.

Os runners conservam cópias temporárias sem `.env`, `.git` ou `.next` do portal, removem bindings Supabase reais e usam dados fictícios/endpoints loopback. Os processos de teste e a limpeza pertencem apenas a essas cópias; não incluem o servidor principal/porta 3000.

## Comandos e verificações

Os comandos abaixo documentam as execuções locais; não autorizam instalação ou uso remoto. A mudança de contexto de execução justifica a validação final, incluindo nova confirmação do compilador real, sem repetir ensaios criptográficos ou inventários remotos.

```sh
npm run lint
npm test -- --maxWorkers=1
# Em cópia temporária completa, com bindings Supabase removidos:
npm run typecheck
# Runners existentes, também com execução exterior autorizada:
node tests/run-app-isolated.mjs offline
node tests/run-app-isolated.mjs auth --project=desktop
node tests/run-app-isolated.mjs auth --project=tablet
node tests/run-app-isolated.mjs auth --project=mobile
```

O runner `offline` executa `npm run build -- --webpack` antes do Playwright. A verificação TypeScript usa `next typegen && tsc --noEmit` na cópia; os ficheiros gerados não são introduzidos no checkout. Os projectos Auth são separados para respeitar o orçamento de tempo por execução, sem alterar as asserções ou activar retries para esconder falhas.

Ambiente observado: Node 24.19.0, npm 11.9.0, TypeScript 5.9.3, Next.js 16.4.3, Vitest 4.1.12 e Playwright 1.64.1. Estas versões descrevem o ambiente Cloud testado; não certificam automaticamente o Codespaces.

| Validação fora do sandbox, antes do ajuste de encerramento | Resultado |
|---|---|
| TypeScript em cópia isolada, fora do sandbox | APROVADO, exit 0 |
| ESLint | APROVADO, exit 0, fora do sandbox |
| Vitest | APROVADO, 316 testes / 24 ficheiros, exit 0; duração 120,74 s |
| Build Webpack pelo runner offline | APROVADO, exit 0; compilação 36,2 s e etapa TypeScript 8,0 s |
| Playwright offline | APROVADO, 54/54 cenários Chromium: 18 desktop, 18 tablet, 18 mobile; exit 0; 1,6 min |
| Playwright Auth desktop | APROVADO, 19/19 cenários, exit 0; 2,7 min |
| Playwright Auth tablet | APROVADO, 19/19 cenários, exit 0; 1,7 min |
| Playwright Auth mobile — primeira execução completa | 18/19 aprovados, 1 falha, exit 1; 2,5 min. Caso de scripts atrasados: botão ainda desactivado após libertação dos scripts, asserção de 15 s |

Os avisos observados sobre `NO_COLOR`/`FORCE_COLOR` e Fast Refresh não foram ocultados ou corrigidos por alterações de configuração; não são classificados como falhas por si só. Não se atribui a esses avisos a causa da intermitência mobile sem evidência. Os cenários Auth são contabilizados por projecto: uma aprovação de projecto não promove os restantes nem altera o resultado de outra execução.

## Achados posteriores ao desbloqueio da execução

O mobile terminou com uma falha real em `tests/e2e/auth-origin-regression.spec.ts:52`, no cenário de scripts atrasados. Desktop e tablet passaram os respectivos 19 casos. Uma repetição isolada do caso mobile original passou (1/1, 7,7 s no teste), mas **não elimina nem converte a primeira execução 18/19 em aprovação**. Um segundo controlo instrumentado apenas numa cópia temporária também passou (1/1, 6,1 s): quatro scripts foram retidos, libertação aos 1 381 ms, respostas HTTP 200 até 3 176 ms e formulário habilitado aos 4 223 ms, sem erro JavaScript de página observado. Não foi reproduzida nem identificada a causa da falha inicial. Não se alteraram asserções, controlo de origem, hidratação da aplicação ou o orçamento de 15 s.

Também foi detectada retenção de três pastas secundárias da fixture Auth, apesar da ausência de processos/listeners nas portas de teste. Continham apenas a cópia da aplicação e certificados/chaves TLS fictícios. Foram removidas de forma delimitada, validando os três caminhos exactos, proprietário, tipo e instantes correspondentes às nossas execuções; não se usaram glob patterns ou limpeza de outros materiais. O controlo isolado posterior voltou a produzir uma pasta órfã, confirmando que não era apenas resíduo de outra tarefa.

Os tipos instalados do Playwright documentam SIGKILL no encerramento predefinido do grupo de processos; a fixture só programa a remoção em SIGTERM/SIGINT ou na saída observada do seu filho. Duas execuções sem a opção deixaram pastas; uma cópia com `webServer.gracefulShutdown` passou o caso SSR mobile e removeu automaticamente o seu temporário, com zero listeners residuais. Os temporários dos controlos sem encerramento gracioso e a cópia instrumentada foram removidos manualmente, apenas pelos caminhos conhecidos e validados.

Após revisão de Segurança, aplicou-se apenas esta linha em `playwright.auth-local.config.ts`, dentro de `webServer`:

```ts
gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
```

Os 5 s são o prazo de encerramento gracioso do processo, **não aumento do timeout de testes ou asserções**. A alteração permite o handler de limpeza já existente; não modifica o servidor de produção, runners, fixtures, bindings, Auth, CSRF, TLS, RLS ou AT/AF. Não constitui correcção comprovada da intermitência mobile.

| Revalidação após o ajuste | Resultado |
|---|---|
| Playwright Auth mobile completo original | APROVADO nesta execução, 19/19, exit 0; 2,3 min; caso de scripts atrasados passou em 3,5 s. Sem instrumentação ou alteração de asserções |
| ESLint e TypeScript | APROVADOS após o ajuste, exit 0; TypeScript em cópia isolada |
| Limpeza automática e portas de teste | APROVADA: nenhum temporário da execução ou processo isolado restante; zero listeners em 3100/3110/4343/4344 |

Vitest e browser offline não são repetidos por esta linha, pois já passaram e não usam o encerramento da fixture Auth. Desktop/tablet anteriores conservam o seu âmbito e versão; não se promove o primeiro conjunto de 56/57 para uma execução integral aprovada.

## Limites e fecho

Estado do Lote 1: **INDETERMINADO quanto à estabilidade integral do cenário mobile**. A causa do bloqueio de compilação foi identificada e o ajuste de encerramento foi comprovado; o novo mobile completo passou, mas não se demonstrou a causa da intermitência da primeira execução. Não declarar que a linha de encerramento corrigiu hidratação, nem substituir o resultado anterior pela repetição aprovada. Lint, tipos e limpeza pós-ajuste foram confirmados; o patch mínimo de encerramento é APTO para registo, com parecer favorável de Segurança e Testes.

A única alteração de código/configuração de teste é a linha de encerramento; os outros dois ficheiros da entrega são este relatório e a referência no relatório da Fase 1. Nenhuma dependência, migração, ficheiro funcional ou segredo foi modificado. Não houve push ou merge. A pendência mobile fica explícita para decisão do responsável; não se iniciam outros lotes automaticamente.

Mesmo depois de concluídas, estas verificações são locais: não homologam SMTP, Auth/PostgREST reais, AT/AF activos ou recuperação PostgreSQL. As lacunas administrativas dos Lotes 2 e 3 permanecem fora desta tarefa. O inventário remoto, a cifra fictícia aprovada e a migração original não foram repetidos.
