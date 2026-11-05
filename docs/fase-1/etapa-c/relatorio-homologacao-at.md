# Homologação real de AT — fecho do ensaio de logout

Registo documental autorizado em 5 de Novembro de 2026 (Africa/Luanda). Branch exclusiva: fase-1-autenticacao-permissoes.

**Caso AUTH-02-AT-LOGOUT-01: APTO.** Este resultado é limitado ao ensaio descrito. Não declara a Fase 1 integralmente homologada nem autoriza bootstrap, activações ou concessões.

## Versão e âmbito

- Código do portal confirmado no checkout: d0d8b90e7dc52c21c1a3289e77d4feb67db806e1, com a correcção que conserva o FormData do logout.
- O responsável apresentou a verificação da branch, dos fontes relevantes, do processo principal e dos manifestos global e da rota /acesso-restrito. O lock estava associado ao processo e ambos os manifestos identificavam a acção com o argumento FormData conservado. Isto comprova a característica corrigida nos artefactos associados; não identifica o SHA integral de todos os módulos em memória.
- Porta 3000 Private, confirmada por leitura. GET local único, sem cookies ou credenciais, a /diagnostico-csrf: HTTP 404; mesmo processo após o pedido.
- A suite Auth fictícia isolada foi executada no Codespaces: 39 casos aprovados, exit=0, versão 898fb3638e1a506ce949d749550139ea9af75d74. Esse ensaio preservou o processo principal, inputs Next, branches locais e stashes. É evidência auxiliar, distinta do logout real.
- Projecto Supabase de desenvolvimento anteriormente confirmado e origem HTTPS privada autorizada. Os identificadores do projecto, host completo, conta e operador ficam fora deste relatório.

## Pré-condições observadas

Uma conta AT com email confirmado, um perfil inactive, zero papéis e uma sessão Auth registada. A navegação controlada anterior, no mesmo navegador/perfil, foi associada a AT pelo filtro de utilizador dos logs: GET /auth/v1/user 200 e leitura do próprio perfil 200. O portal recusou acesso funcional em /acesso-restrito. Não se usou a página genérica de recusa como prova isolada de identidade.

## Evidências do ensaio final

| Evidência | Resultado efectivo | Fonte |
|---|---|---|
| Acção pessoal | O responsável confirmou um único clique no botão de logout, dentro da autorização específica | Declaração do responsável |
| Navegação após o clique | /entrar | Captura do portal |
| Auth | POST /logout, HTTP 204, às 15:54:30 no horário apresentado pelo painel | Captura de logs Auth |
| API gateway | POST /auth/v1/logout?scope=global, HTTP 204, no mesmo horário, associado a AT pelo filtro de utilizador | Captura de logs filtrados |
| Conta preservada | contas_at=1; emails_confirmados=1; perfis=1 | Consulta BEGIN TRANSACTION READ ONLY, finalizada com ROLLBACK |
| Poderes preservados | perfil_inactive=true; papeis=0 | Mesma consulta |
| Encerramento | sessoes_auth=0, contra 1 antes do clique | Mesma consulta |
| Rota privada após logout | Uma abertura de / redireccionou automaticamente para /entrar; sem Dashboard, menus administrativos ou dados empresariais | Confirmação textual expressa do responsável |

As linhas Auth e API gateway são registos do mesmo ensaio nas duas camadas; não são contabilizadas como dois cliques. O âmbito global foi observado no registo da API. A pré-condição era uma única sessão AT.

O horário 15:54:30 é transcrito do painel. O fuso do painel não aparece explicitamente nas capturas: não se inventou conversão UTC, nem instante exacto da consulta SQL ou da navegação final. Os campos hora_utc/hora_luanda do CSV ficam vazios por esse motivo. A data deste registo usa Africa/Luanda.

As capturas e as confirmações foram fornecidas pelo responsável; o assistente não operou o navegador nem consultou directamente o Supabase remoto. Não foram incorporados ficheiros de captura, endereços pessoais, UUID, cookies, tokens, passwords, cabeçalhos de autenticação ou ligações de recuperação no Git.

## Conclusão e limites

O caso cumpre os critérios acordados: logout reconhecido pelo fornecedor, retorno à entrada, ausência de sessões Auth registadas, conta/perfil preservados sem concessão de poderes e recusa da rota privada após o encerramento.

A tentativa anterior na versão 01d6b67, com erro de transporte do formulário, permanece histórica e não é marcada APTO. O caso aprovado corresponde à autorização posterior e à versão corrigida d0d8b90. Não houve retentativa automática autorizada neste caso.

Este resultado não comprova revogação instantânea de todos os access tokens já emitidos, outros dispositivos/separadores, todos os cenários de expiração/renovação, perfis activos, suspensão, convites, bootstrap, segregação AT/AF ou toda a matriz RLS/PostgREST. O grupo AUTH-02 do plano inclui outros dispositivos e continua PENDENTE fora deste subcaso. Os restantes IDs do CSV não foram promovidos a APTO.

O estado inactive e zero papéis corresponde ao instante da leitura. Não se afirma que o estado futuro esteja imutável. A Fase 1 continua parcialmente homologada e sem autorização para produção, publicação ou merge na main.

Nenhum bootstrap, activação, atribuição de papéis, criação de conta, migração, alteração Auth/SMTP, envio de email ou reinício faz parte deste fecho documental. A migração original permanece inalterada, SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58.

Próximo bloco apenas planeado: [bootstrap controlado AT/AF](bootstrap-at-af.md), sujeito a autorizações separadas e à revisão de segregação nele identificada.
