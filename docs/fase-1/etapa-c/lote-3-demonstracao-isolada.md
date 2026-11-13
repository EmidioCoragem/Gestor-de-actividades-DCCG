# Lote 3 — Demonstração funcional isolada com dados fictícios

Data: 13 de Novembro de 2026. Branch: `fase-1-autenticacao-permissoes`. Base aprovada: `620fc9c2e92b5d84931d24e763b3cb7b43edaa31`.

## Objectivo e fronteira

Percurso navegável exclusivamente de apresentação da Fase 1, com empresa, departamentos, pessoas e relações inteiramente sintéticos. Não constitui autenticação simulada com credenciais, servidor Supabase falso ou bypass das rotas reais: seleccionar uma identidade escolhe um cenário público fictício, sem criar sessão. A troca de cenário não representa uma alteração de privilégios de uma conta real. A aplicação Next.js e os seus guardas, sessões, Server Actions, CSRF, políticas RLS e migrações permanecem intactos.

O servidor de demonstração é um processo Node separado: não inicia Next.js, não carrega `.env`, não usa SDK Supabase, não consulta o projecto remoto e não envia pedidos a serviços externos. Só apresenta código e dados fictícios explicitamente permitidos. Sem persistência, cookies de sessão, passwords, tokens ou chaves. Pedidos de mutação não executam operações administrativas. A apresentação indica permanentemente «Demonstração isolada» e «dados 100% fictícios».

Esta separação é de processo, dados, rotas e configuração; não é uma máquina virtual nem um isolamento absoluto de permissões do sistema operativo. O processo conserva os direitos do utilizador local. A porta Private é uma protecção da plataforma Codespaces que o operador deve confirmar; o servidor não altera a visibilidade da porta nem substitui essa protecção.

## Equipa e propriedade dos ficheiros

- Base de Dados: dados sintéticos, contratos e selecção de âmbito para o cenário, em `src/modules/demo/`.
- Desenvolvimento: servidor HTTP e comando de arranque em `scripts/demo-fase1*.mjs`.
- Interface/UX: renderização, estilo empresarial e acessibilidade, em `src/components/demo/render.ts`.
- Testes: regressões unitárias e percurso browser próprio, sem editar testes produtivos.
- Segurança: revisão independente de isolamento, métodos HTTP, rotas, escapes, cabeçalhos e distinção entre cenário e autenticação.
- Codex principal: contratos, revisão cruzada, integração, verificações finais, documentação e commit. Sem edições concorrentes do mesmo ficheiro.

## Como abrir no Codespaces

O guia pressupõe que os ficheiros deste lote já estão no checkout do Codespaces. A implementação e validação desta entrega ocorreram no checkout Cloud; não houve push, sincronização ou alteração remota do Codespaces. A disponibilização do commit nesse checkout deverá usar o procedimento autorizado de integração, preservando os seus stashes.

1. No terminal do repositório, confirme que está na branch `fase-1-autenticacao-permissoes`. Não mude de branch nem aplique stashes.
2. A porta 3000 deve estar livre. Se o portal de desenvolvimento estiver a correr nessa porta, pare **apenas esse comando**, com `Ctrl+C` no terminal onde o iniciou. O comando da demonstração não termina processos existentes; se a porta estiver ocupada, interrompe com mensagem de erro.
3. Execute:

   ```bash
   node scripts/demo-fase1.mjs
   ```

   Não use `start-preview.sh` ou `npm run dev` para abrir esta demonstração: esses comandos iniciam o portal real.
4. Abra o separador **Ports** do Codespaces. Na porta **3000**, confirme **Port Visibility → Private**. Não escolha Public e não partilhe o URL.
5. Na mesma linha, seleccione **Open in Browser**. A página inicial deve identificar a demonstração e oferecer a escolha de cenário, sem pedir palavra-passe.
6. Percorra as identidades fictícias, as consultas autorizadas no cenário e as recusas. Nas tabelas largas, pode deslizar horizontalmente para consultar as restantes colunas. Use «Encerrar demonstração» para voltar à selecção; isso não é logout Supabase, pois não existe sessão Auth.
7. Para terminar, volte ao terminal da demonstração e prima `Ctrl+C`. Para voltar ao portal real, inicie-o depois pelo procedimento habitual, sem alterar configurações ou segredos.

Node 24 já existente é o único runtime necessário para o servidor; não há instalação de dependências ou serviços para o abrir. O arranque usa loopback `127.0.0.1:3000`; o encaminhamento privado é efectuado pelo Codespaces. Não são abertos endpoints públicos pelo procedimento.

## O que pode ser demonstrado

Empresa fictícia, dois departamentos, cargos, estados de pessoas, responsáveis, chefias e histórico. Cinco identidades ilustram administrador técnico (AT), administrador funcional (AF), gestor, leitor limitado e utilizador inactivo. Os cenários limitados não devem receber os registos do outro departamento. Recusas e botões bloqueados são resultados da política demonstrativa local, nunca uma prova de autorização Supabase.

| Cenário | Consultas ilustrativas | Recusas/limites |
|---|---|---|
| Administrador técnico | Identificação e cadastro técnico fictício (nomes/estados) | Sem estrutura, cargos, histórico ou atribuições funcionais |
| Administrador funcional (AF) | Identificação, pessoas/unidades funcionais, histórico e capacidades ilustrativas | Sem `users.manage`, poderes técnicos ou mutações |
| Gestor do Departamento A | Pessoas, estrutura, histórico e capacidades limitados ao Departamento A | Registos do Departamento B excluídos da projecção |
| Leitor limitado | Identificação e estrutura do Departamento A | Utilizadores, histórico e permissões recusados |
| Inactivo | Só metadados do cenário | Todas as consultas administrativas recusadas |

A fixture mantém referência temporal fixa: **13/11/2026, 13:00, Africa/Luanda**, não uma fotografia da empresa ou do Supabase. A transferência histórica entre departamentos é sintética; o cenário limitado não recebe a linha do departamento fora do seu âmbito.

As páginas ilustram entrada no percurso, identificação, utilizadores, estrutura, histórico, permissões, recusas e saída. Todas as operações são de leitura ou explicitamente bloqueadas. Não há convites, criação de contas, atribuição/revogação real, auditoria persistente ou recuperação de passwords nesta demonstração.

## Fictício, implementado e homologado

| Elemento | Nesta demonstração | Estado real / limite |
|---|---|---|
| Empresa, unidades, pessoas e relações | Fixture inteiramente inventada, só em memória | Não representa nem consulta os dados Supabase |
| Entrada e saída | Escolha livre de cenário e regresso à entrada | Sem login, cookies Auth, validação de credenciais ou logout real |
| Consultas e recusas | Projecções do servidor separado, com HTTP 200/403 | Não executam as páginas administrativas Next.js nem comprovam RLS |
| Identidade visual | Paleta e linguagem empresarial aprovadas, renderer autónomo | Os componentes reais do portal não foram modificados |
| Administração | Controlos ilustrativos desactivados; métodos de escrita recusados | As Server Actions reais existentes não são chamadas ou homologadas |
| AT/AF e âmbito departamental | Matriz ilustrativa limitada por cenário | Não cria papéis, não instala migrações e não demonstra concessões remotas |
| Portal real | Código existente preservado; build/regressões locais aplicáveis | Aprovação local dos Lotes 1/2 não é homologação integral ou autorização de produção |

## Verificações

Checks finais do coordenador, no checkout Cloud com Node 24.19.0. Variáveis Supabase removidas dos processos de verificação e compilação/typecheck em cópias temporárias sem `.env` ou `.git`. Execução fora do sandbox de processos, reutilizando o diagnóstico aprovado do Lote 1; não foi alterada a configuração da aplicação ou a infra-estrutura.

| Comando | Resultado observado |
|---|---|
| `npm run lint` | APROVADO, exit 0 |
| `npm run typecheck` | APROVADO, exit 0, com todos os novos testes/configurações |
| `npm test -- --maxWorkers=1` | 432/432 testes, 28/28 ficheiros, exit 0; 88,23 s |
| `node tests/run-app-isolated.mjs build --webpack` | APROVADO, exit 0; Next.js 16.4.3, compilação 19,1 s, TypeScript 6,1 s |
| `npx --no-install vitest run tests/unit/demo-fase1.test.ts --maxWorkers=1` (agente Testes) | 47/47 casos dirigidos, exit 0; 1,49 s; incluídos também no total 432, não somar duas vezes |
| `node scripts/test-demo-fase1.mjs` (agente Testes) | 24/24 casos, exit 0; 42,1 s, oito casos em cada formato desktop/tablet/mobile |

Os 47 casos novos de unidade verificam os cinco cenários, as secções permitidas/recusadas, ausência de dados do outro departamento nas projecções limitadas, distinção AT/AF, inactivo, entradas inválidas, imutabilidade, escape HTML e fronteira de importações/sem rede ou ficheiros de dados. O teste de fronteira é uma regressão estática complementar, não uma sandbox de sistema operativo.

Os 63 testes Playwright offline do portal real, aprovados no commit base do Lote 2, foram reutilizados como evidência anterior, **não contabilizados como nova execução deste lote**. Não houve alteração de rotas, componentes, guardas, dependências ou configuração de produção que justificasse repetir essa suite. A suite Auth do Lote 1 também não foi repetida. O percurso novo tem suite Playwright própria; testes locais não homologam Auth, RLS ou instalação remota de AT/AF.

O Playwright verificou navegação e saída, cinco cenários, âmbitos/recusas, controlos bloqueados, HTTP 405 inclusive em caminhos Auth/RPC, parâmetros inválidos/duplicados e CSP. Em todos os casos: **zero cookies e zero tentativas de pedidos externos**. Confirmados foco/sem credenciais e ausência de overflow da página; as tabelas têm deslocação horizontal local. O coordenador inspeccionou as capturas fictícias desktop (histórico AF) e mobile (estrutura do gestor), preservando a identidade empresarial.

Provas dirigidas adicionais pelo agente Testes, sem editar o candidato:

- Servidor próprio numa porta efémera e segunda tentativa CLI na mesma porta: exit 1, sem terminar o servidor original, que continuou com HTTP 200.
- Cinco pedidos a `/.env`, `/..%2F.env`, `/%2e%2e/.env`, `/src/modules/auth/session.ts` e ao caminho de uma migração: HTTP 404 genérico, sem exposição de ficheiros.
- Encerramento normal: nenhum listener em 3120, nenhum processo demo e nenhum directório temporário do runner remanescente. Apenas logs e duas capturas fictícias ficaram em `/tmp`, fora do Git.

Revisão independente de Segurança **APTO** para este âmbito, com as condições QA acima satisfeitas: sem importação de SDK/Next/ficheiros arbitrários no servidor, ambiente positivo no processo filho, rotas/métodos estritos, escape e cabeçalhos restritivos. Não é parecer sobre autorização real ou sobre isolamento de sistema operativo.

**Resultado: APTO para a demonstração local fictícia, exclusivamente de leitura.** Nenhum teste pertinente ficou bloqueado. A abertura na porta Private do Codespaces é uma verificação manual futura, não executada nem presumida pela validação Cloud.

## Limitações preservadas e próximo passo

A intermitência de hidratação Auth mobile do Lote 1 continua sem causa demonstrada. Uma demonstração sem autenticação não testa nem resolve essa intermitência. A homologação real da Fase 1, Auth/SMTP/PostgREST, RLS, perfis activos e segregação instalada continua pendente das autorizações próprias. Nada deste lote aplica migrações, bootstrap ou permissões reais.

Não foram criados utilizadores reais, exportados dados, geradas chaves empresariais, alterados segredos/infra-estrutura ou tocados stashes do Codespaces. Sem push ou merge na main. Os Lotes 4 e a Fase 2 não começam automaticamente; exigem nova autorização.
