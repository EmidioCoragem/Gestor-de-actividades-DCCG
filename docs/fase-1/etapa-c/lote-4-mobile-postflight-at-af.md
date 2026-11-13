# Lote 4 — Diagnóstico mobile e pós-verificador AT/AF

Data: 13 de Novembro de 2026 (Africa/Luanda). Branch exclusiva: `fase-1-autenticacao-permissoes`. Base: `89e186ca3777010063a73182a74ef57abb92ade9`.

## Autorização e coordenação

Bloco local autorizado: diagnóstico instrumentado do caso Auth mobile intermitente e preparação de consultas de pós-instalação AT/AF. Desenvolvimento responde pelo runner e instrumentação temporária; Segurança pelo pós-verificador e revisão da instrumentação; Testes pelas regressões pertinentes; Base de Dados revê o contrato SQL; o coordenador consolida revisão, resultados, documentação e commit, se validado. Cada ficheiro tem um único editor.

Não há SQL remoto, execução de migrações, bootstrap, exportação, criação de utilizadores reais, alteração de permissões/infra-estrutura/segredos ou acesso aos stashes. Não há push, merge ou Fase 2 nesta autorização. As execuções pertencem ao checkout Cloud, não ao Codespaces do responsável.

## Evidências anteriores preservadas

Lotes 1–3 aprovados nos respectivos âmbitos, sem somar contagens de suites progressivamente ampliadas. Lote 3: 432 testes Vitest e 24 Playwright da demo; a abertura e os cinco cenários da demonstração privada no Codespaces foram posteriormente validados pelo responsável. Essa confirmação encerra a pendência manual indicada como futura no relatório L3; não equivale a homologação Auth/RLS real.

O primeiro mobile Auth do Lote 1 teve 18/19; revalidações passaram sem demonstrar a causa. O ajuste `gracefulShutdown` comprovou limpeza da fixture, não uma correcção de hidratação. O responsável também apresentou uma execução dirigida não instrumentada no Codespaces: 1/1 aprovado, caso 4,3 s, total 31,5 s. Não substitui a falha histórica por aprovação.

## Diagnóstico mobile

O teste original de scripts atrasados e o timeout de asserção de 15 segundos são preservados. A instrumentação fica exclusivamente em cópia temporária sem `.env`, `.git` e cache `.next` da aplicação, com dados fictícios e serviços loopback. Não modifica lógica de autenticação, origens, CSRF, TLS, timeouts ou retries.

São permitidos apenas IDs opacos, categorias, contagens, tempos relativos e booleanos de hidratação/configuração/pending. São excluídos cookies, tokens, credenciais, corpos, informação pessoal, cabeçalhos, URLs brutas, HTML e consola bruta. `response` indica cabeçalhos; `requestfinished` é necessário para distinguir conclusão de transferência. A libertação da barreira deve indicar quantos scripts foram efectivamente retidos; zero não demonstra o cenário atrasado.

**Resultado observado: execução aprovada sem reprodução (`passed-no-reproduction`), 1/1 cenário, exit 0. A causa histórica continua INDETERMINADA.** Não houve repetição ou suite Auth completa neste bloco.

| Observação, relativa ao início do caso | Resultado |
|---|---|
| Scripts efectivamente retidos | 4 |
| Libertação da barreira | 1 156 ms |
| Conclusão dos quatro downloads observados | Até 2 063 ms |
| Estado `hydrated=true` observado | 2 774 ms |
| Asserção de botão habilitado concluída | 3 102 ms; orçamento original de 15 000 ms preservado |
| Estado `pending=true` / regresso a false | 3 191 ms / 3 362 ms, após a submissão fictícia |
| Falhas de scripts / erros JavaScript observados | 0 / 0 |
| Indicador de pedidos fora do âmbito local | 0 |
| Telemetria completa / truncada | true / false |
| Cópia temporária removida / portas de teste libertadas | true / true |

O SSR observado começou com `hydrated=false`, `disabled=false` e `pending=false`; campo e botão estavam desactivados pela guarda de hidratação. A sequência actual permite distinguir transferência de scripts e habilitação, mas não explica a falha antiga. A instrumentação pode influenciar tempos; estes não são uma medição de desempenho em produção nem certificação Safari/iOS.

A única corrida foi realizada por Desenvolvimento, após revisão de Segurança e regressões puras de Testes. Segurança e o coordenador conferiram depois o relatório sanitizado por leitura, sem repetir Auth. O relatório fictício ficou fora do Git em `/tmp/gestor-mobile-report-4GmghR/report.json`, com directório 0700 e ficheiro 0600. Nenhuma saída bruta do framework foi retida. Depois da corrida, apenas foi reforçado o tratamento de metadata truncada na limpeza; não se alteraram o percurso normal, as asserções ou a telemetria, nem se repetiu o browser por essa defesa local.

Mantém-se o runner opt-in `tests/run-auth-mobile-diagnostic.mjs`, como ferramenta de diagnóstico reutilizável. Os três atributos booleanos, a spec instrumentada e os ficheiros de trabalho existem somente na cópia descartável. O formulário, a spec original e a configuração Auth do checkout não foram alterados. O runner falha fechado perante drift do código de entrada, contagens desconhecidas, falta de observabilidade, truncagem ou ausência de scripts retidos; não converte estes casos em aprovação.

## Pós-verificador AT/AF

Específico para `supabase/migrations/202611050001_at_af_segregation.sql`, SHA-256:

`fb531bb63ca8d80f746e3e0fdf32e1161a4475237e184c308d60f38876a120e5`.

A original `202610300001_fase1.sql` mantém SHA-256:

`56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58`.

O verificador original não é substituído nem reaplicado. O novo artefacto só prepara leitura; não aplica migração, corrige catálogo, concede privilégios ou chama funções mutadoras da aplicação. A ausência de referência privada anterior impede afirmar preservação dos dados/auditoria apenas com contagens ou catálogos posteriores.

A revisão considera funções/corpos/assinaturas/configurações/owners, ACLs efectivas e possibilidades de assumir papéis, privilégios por coluna, triggers e sua activação, RLS/políticas, barreiras técnico/funcionais, auditoria e limites que exigem reconciliação independente. Resultado ambíguo ou cobertura insuficiente nunca se converte em aprovação.

Artefactos preparados e revistos:

| Ficheiro | Finalidade | SHA-256 do modelo versionado |
|---|---|---|
| `supabase/inspection/at-af-pre-baseline.sql` | Captura anterior de contagem/hash de auditoria, fingerprints de políticas/RLS/owners e contexto | `9a8cb334a5ebbe17775fbb0503dd91134ced062d07310612d70922e9015fb6f0` |
| `supabase/inspection/at-af-post-migration.sql` | Pós-verificação específica da incremental, com baseline e aliases privados em NULL no Git | `2ea76330139e6afe4af1ea3109cc9cc80c30f9d730b1cc6aa14f9b7d18cc9b6c` |

O gerador textual `scripts/generate-at-af-postflight.mjs` verifica três fontes por checksum, extrai referências sem iniciar qualquer base de dados e gera ambos os SELECTs. `--check` compara-os sem os sobrescrever. O guard lexical é conservador para o formato gerado: recusa DML em CTE, instruções extra, metacomandos, funções/casts/operadores arbitrários e chamadas mutadoras. **Não é parser PostgreSQL geral nem uma sandbox para SQL fornecido por terceiros.**

Cobertura revista: 20 funções (corpos SHA-256, assinaturas, flags, configurações e owners coerentes), 31 triggers incluindo 14 novas guardas, 16 tabelas RLS, 13 políticas, ACLs efectivas/por coluna nas sete tabelas protegidas, grant options e alcançabilidade por SET ROLE. Inclui coerência de catálogos/capacidades técnicas, concessões e intervalos incompatíveis, delegações administrativas e estados válidos de perfis. Aliases AT/AF e estados esperados requerem o manifesto privado aprovado, não identificam titulares humanos por si só.

Os pontos que não podem ser comprovados não recebem PASS artificial: histórico sem baseline/contexto adequado; proprietário sujeito a FORCE RLS sem bypass; grants personalizados service_role dos onze helpers originais; presença/funcionamento operacional da linha write_epoch; default privileges futuros; configuração/cache PostgREST e resposta efectiva COMMIT. Preservação de todas as outras tabelas da aplicação depende adicionalmente do manifesto e ensaio de recuperação, não só deste fingerprint de auditoria.

Nenhuma consulta destes artefactos foi executada no Supabase ou num motor SQL neste bloco. Testes estáticos e revisão não equivalem à validação de execução numa instalação real. O estado remoto actual da incremental continua não verificado; a última informação aprovada é instalação pendente.

## Validação e resultado

| Verificação efectivamente executada | Resultado |
|---|---|
| Única execução `node tests/run-auth-mobile-diagnostic.mjs` | 1/1 cenário aprovado, exit 0; sem reprodução, não fecha a causa |
| `node node_modules/vitest/vitest.mjs run tests/unit/at-af-postflight.test.ts tests/unit/auth-mobile-diagnostic.test.ts --maxWorkers=1` | 51/51 testes puros, 2/2 ficheiros, exit 0; 1,65 s na consolidação final |
| `npm run lint` | APROVADO, exit 0 |
| `npm run typecheck` | APROVADO, exit 0, numa cópia completa temporária sem `.env`, `.git` ou configuração remota |
| `node scripts/generate-at-af-postflight.mjs --check` | APROVADO, exit 0; ambos os artefactos reprodutíveis, sem escrita nem SQL executado |
| Hashes das duas migrações e diff dos controlos originais | Preservados; nenhum diff de produção, Auth, CSRF, migrações ou dependências |
| `git diff --check` | APROVADO |

As regressões puras cobrem canários fictícios de dados privados, allowlist do relatório, contagens inválidas/fraccionárias, telemetria incompleta, conservação byte a byte do formulário sem os atributos temporários, asserções originais e timeout de 15 segundos; geração determinística, drift nas três fontes e SQL adversarial classificado como não permitido. Um erro inicial na expressão regular de um teste foi corrigido no próprio teste; não representava uma falha Auth. Os ajustes de sanitização pertencem ao runner e não constituem uma correcção da intermitência da aplicação.

Não foram repetidas suites Vitest que aplicam migrações locais/PGlite, Auth completo, browser offline ou build Webpack: apenas ferramentas de diagnóstico e artefactos de leitura foram acrescentados; o código da aplicação não mudou. As aprovações anteriores do Lote 3 conservam o seu âmbito e não são contadas como novas execuções. Os comandos de testes fora do sandbox reutilizam o tratamento da limitação de pipes comprovada no Lote 1, sem modificar o portal.

Segurança e Base de Dados emitiram parecer **APTO para integrar os instrumentos de preparação**, com os limites explícitos. A validade sintáctica/operacional do novo SQL num PostgreSQL 17 e a eficácia de controlos remotos continuam **NÃO EXECUTADAS**, por âmbito, não são declaradas aprovadas pelos testes de texto.

Os agentes de Desenvolvimento e Testes atingiram o limite de utilização após entregarem os ficheiros/evidências. O coordenador concluiu os checks finais reutilizando o trabalho existente, sem nova implementação funcional ou repetição da corrida mobile.

## Condições para homologação real

Continuam necessárias: recuperação PostgreSQL demonstrada, custódia/destinos aprovados, leitura dirigida de pré-condições, instalação incremental única autorizada, pós-verificação, preparação explícita das identidades/estados/concessões e homologação pela aplicação real e PostgREST com actores distintos. O operador SQL não prova RLS de utilizador normal.

A migração tem transacção própria. Falha ou resultado de COMMIT ambíguo exige verificar estado antes de qualquer nova tentativa. Depois de COMMIT, compensação ou restauro exige plano e autorização próprios; não reaplicar a original, restaurar baseline vazia ou apagar auditoria.

Qualquer operação remota depende de nova autorização. Um runner local ou pós-verificador preparado não homologa Auth, SMTP, RLS, AT/AF ou recuperação reais.

## Utilização futura, sem autorização de execução implícita

1. Confirmar alvo de desenvolvimento, commit/checksums, operador e contexto de leitura aprovados. Não usar o SQL Editor privilegiado como identidade de utilizador normal para provar RLS.
2. Só após autorização de leitura específica, capturar `at-af-pre-baseline.sql` **antes** da instalação. Guardar a única linha resultante privadamente fora do Git, com alvo, operador, instante e contexto. Exigir resultado PASS, fórmula `at-af-baseline-v1`, valores completos e contexto coerente; erro ou visibilidade parcial interrompem a preparação. A captura não substitui backup/restauro.
3. Depois de recuperação demonstrada e autorização de instalação própria, executar a incremental integral uma única vez. Nunca executar a original ou o checker como instalador.
4. Numa cópia privada do pós-verificador, preencher somente os valores previamente aprovados da baseline e, quando aplicável, aliases/estados da fase. Não colocar identificadores reais no modelo versionado. Comparar usando a mesma role, versão, TimeZone, DateStyle e search_path; contexto diferente impede concluir preservação.
5. Executar o SELECT posterior somente com autorização própria. FAIL exige parar e investigar; INDETERMINADO exige evidência adicional, não é aprovação tácita. Ausência de linhas, erro, resposta parcial/timeout ou divergência não autoriza reparação, concessões ou reaplicação. Divergência de auditoria pode também resultar de escrita concorrente legítima e deve ser reconciliada.
6. Confirmar a linha de serialização por leitura separada **apenas após schema/tabela e privilégios do inspector confirmados**, mediante autorização. Consulta preparada, não executada:

   ```sql
   SELECT pg_catalog.count(*) = 1
      AND COALESCE(pg_catalog.bool_and(id = 1 AND epoch >= 0), false)
      AS linha_epoch_conforme
   FROM gestor_security.write_epoch;
   ```

   TRUE verifica a linha actual, não comprova concorrência. Não exigir epoch=0 após utilização legítima; ausência/incoerência bloqueia o avanço. Esta consulta não integra a baseline anterior, quando o schema privado ainda pode não existir.
7. Reconciliar COMMIT, exposição/cache API, grants personalizados e demais critérios operacionais com evidências independentes antes de declarar a instalação/homologação aprovadas. Bootstrap, sessões, mutações, correio e limpeza conservam autorizações separadas.

**Estado final deste bloco:** instrumentos locais APTO para revisão/commit; cenário mobile aprovado sem reprodução, causa INDETERMINADA; SQL preparado/revisto estaticamente e não executado. A Fase 1 continua não integralmente homologada.
