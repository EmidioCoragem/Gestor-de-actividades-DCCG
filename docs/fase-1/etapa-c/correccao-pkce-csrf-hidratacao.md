# Correcção PKCE/CSRF e hidratação — 5 de Novembro de 2026

Base: commit 1675de9, exclusivamente na branch fase-1-autenticacao-permissoes. Esta tarefa autoriza análise, correcção e testes locais e commit; não autoriza intervenções Supabase, migrações remotas, contas, bootstrap ou merge. Nenhuma sessão real foi utilizada.

## Causa identificada

A causa está na disponibilidade do **formulário da aplicação antes da hidratação**, combinada com a política de privacidade Referrer-Policy: no-referrer. O simulador não fabrica o cabeçalho Origin: null nem existe uma falha de verificação PKCE que o justifique.

No commit anterior, AuthForm renderizava inputs e botão activos no HTML inicial. A automação (ou uma pessoa num carregamento lento) podia submeter enquanto React ainda não tinha instalado o transporte da Server Action. O browser utilizava então um POST HTML nativo. No Chromium ensaiado, no-referrer nesse transporte produz Origin: null; no fetch JavaScript produz a origem legítima. O Next compara Origin com Host/X-Forwarded-Host e recusava correctamente null. Compilação a frio/HMR e o teste que aguardava um botão já activo no SSR expunham a janela; aumentar tempos não corrigia a causa.

Evidências controladas, sem tokens/corpos/cookies registados:

- Um endpoint exclusivamente loopback do simulador serve um formulário com no-referrer e devolve apenas a classificação da origem e o modo de transporte. O mesmo browser produziu **null/navigate** no POST nativo e **legitimate/cors** no fetch.
- Antes de alterar a aplicação, essa prova passou e o novo teste SSR falhou: com JavaScript desactivado, o formulário real de recuperação tinha botão activo. A cópia de ensaio continha o código da aplicação de 1675de9. Esta falha esperada comprova a ausência da barreira de hidratação.
- Depois da correcção, bloquear temporariamente os scripts mantém campos/botão desactivados e não produz POST. Ao libertá-los, o browser utiliza fetch com origem legítima e identificador Next Action presente; só então o simulador recebe a recuperação fictícia.
- O cenário original «confirmação diferente não consome a autorização PKCE» passou em computador, tablet e telemóvel, mantendo todas as asserções de validação, não consumo e conclusão posterior.

Classificação: defeito de prontidão do formulário da aplicação, exposto pelo timing do teste. O simulador respeita a política do browser. A configuração anterior não distinguia HTML disponível de formulário hidratado; a correcção não consiste apenas em esperar mais no teste.

## Alteração mínima e protecções preservadas

[AuthForm](../../../src/components/auth-form.tsx) usa useSyncExternalStore com snapshot servidor false e cliente true. O snapshot de hidratação conserva o estado bloqueado até React instalar os handlers. Inputs e botão só ficam utilizáveis depois disso, respeitando ainda disabled/pending. Sem JavaScript, o formulário permanece bloqueado e apresenta indicação explícita para o activar. A prova CSRF escondida mantém-se serializável.

No [controlo de origem](../../../src/modules/auth/form-origin.ts), POST dos quatro formulários Auth exige a origem canónica também fora do Codespaces. O Next instalado apenas avisa quando Origin está ausente; a aplicação passa a recusá-lo antes de criar o cliente SDK. Origem nula, vazia, múltipla ou falsificada também é recusada. GET sem Origin continua permitido para navegação e callback. Uma configuração canónica inválida/ausente falha fechada.

No Codespaces mantém-se a adaptação previamente delimitada de localhost para a origem privada, exclusivamente com cookie __Host-, nonce no corpo e metadados válidos. Não foi acrescentada autorização para null, não se reescreve uma origem desconhecida e não foi alargada a allowlist do Next. Referrer-Policy: no-referrer e a comparação CSRF do Next permanecem activas. Não foi introduzido bypass Auth.

As migrações, as Server Actions de administração e a política AT/AF de 1675de9 não foram alteradas. A suite unitária volta a executar os cenários de segregação. SHA-256 preservados:

- Original 202610300001_fase1.sql: 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58.
- Incremental 202611050001_at_af_segregation.sql: fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5.

O endpoint origin-probe existe apenas no servidor de controlo fictício em loopback, nunca nas rotas da aplicação. Devolve categorias, não valores arbitrários de cabeçalhos ou credenciais. Os testes de origem ficam na suite Auth; a suite offline exclui-os porque não inicia o simulador. O runner aceita filtros de projecto/cenário para completar ensaios dentro dos limites do ambiente.

## Resultados efectivos

| Verificação | Resultado | Alcance e limites |
|---|---|---|
| Reprodução anterior à correcção | 1 prova aprovada; 1 regressão SSR falhou como esperado | Browser confirma o mecanismo; UI anterior activa sem JS |
| Unitários afectados | 58 aprovados | Origem, SSR dos quatro formulários e conservação do campo CSRF |
| Suite unitária completa | 316 aprovados / 24 ficheiros | Inclui os testes AT/AF preservados |
| Auth e regressões no browser | 57 cenários cobertos: 53 + 4 aprovados em execuções complementares | 39 fluxos originais e 18 regressões de origem/hidratação, em três formatos Chromium |
| Execução integral Auth | Interrompida pelo limite global de 600 segundos | 53 aprovados, 4 não executados nessa corrida; sem falhas de asserção. Não se declara exit 0 dessa corrida |
| Complemento mobile | 4 aprovados, exit 0 | Atraso de scripts e POST com origem ausente/null/falsificada |
| Lint / TypeScript finais | APROVADOS, exit 0 | Sem desactivar regras React/TypeScript |
| Build Webpack / Playwright offline | Build APROVADO e 54 testes APROVADOS, exit 0 | Cópia isolada, servidor de produção loopback, sem Supabase real |

O primeiro ensaio após a alteração passou os controlos funcionais mas falhou uma asserção de instrumentação: request.headers() do Playwright omitia Sec-Fetch-Mode. A prova no servidor confirmou o modo; o teste da aplicação passou a verificar resourceType=fetch, Next Action presente, origem legítima e contagem real do simulador. Não se alterou o browser nem o cabeçalho enviado para fazer passar o teste.

Comandos locais, com bindings Supabase removidos pelo runner e sem .env/.git/.next do portal:

```bash
npx --no-install vitest run tests/unit/form-origin.test.ts tests/unit/auth-form-hydration.test.ts tests/unit/logout-form.test.ts
npm test -- --maxWorkers=1
npm run lint
npm run typecheck
node tests/run-app-isolated.mjs auth
node tests/run-app-isolated.mjs auth --project=mobile '--grep=scripts atrasados|POST Auth'
node tests/run-app-isolated.mjs offline
```

A última linha compila com Webpack e executa os 54 cenários offline em porta 3110. Auth utiliza apenas 3100/4343/4344, contextos de browser novos e contas/credenciais fictícias. Nenhum comando altera o servidor real ou os cookies do navegador pessoal. Não se repetiram as corridas PostgreSQL nativas: SQL e política AT/AF não mudaram; os testes SQL em memória foram executados novamente pela suite completa.

## Limitações e homologação pendente

A lentidão de compilação/execução neste ambiente impediu terminar os 57 cenários numa única corrida com o orçamento global. O complemento executou exactamente os quatro casos em falta; isso não transforma a corrida interrompida numa corrida integral aprovada. O limite e o estado de cada execução ficam preservados. Turbopack não foi repetido: mantém-se a limitação conhecida de resolução de node_modules por symlink na cópia isolada; Webpack é o compilador desta verificação.

A cobertura de browser é Chromium, incluindo perfis de dimensões tablet/telemóvel; não certifica Safari/iOS nativos. A alteração torna JavaScript necessário para estes formulários: o comportamento sem scripts é bloqueio explícito, não uma alternativa de autenticação.

A causa local de Origin: null está identificada e corrigida nos cenários cobertos. Isso não homologa Auth/Supabase/PostgREST reais nem autoriza migração, carregamento no Codespaces real ou bootstrap. Continuam pendentes autorização para inventário remoto, validação do transporte HTTPS privado e da adaptação Codespaces com código carregado confirmado, aplicação incremental AT/AF se aprovada e homologação real delimitada. Não utilizar estes resultados como autorização para login, recuperação, logout ou emails reais.
