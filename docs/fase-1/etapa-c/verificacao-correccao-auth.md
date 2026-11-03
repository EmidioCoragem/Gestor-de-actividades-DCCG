# Verificação da correcção Auth

Data: 3 de Novembro de 2026, Africa/Luanda. Base de código: 43f08bf6138cfc1638e06cee555ddbad6d3429e7. Alteração limitada à branch fase-1-autenticacao-permissoes.

## Resultados desta alteração

| Verificação | Resultado |
|---|---|
| npm run lint | Aprovado |
| npm run typecheck | Aprovado |
| npm test | 117 testes aprovados em 14 ficheiros; 61,97 segundos |
| Novos testes Auth isolados | 45 aprovados, incluídos nos 117 |
| Cenários SQL anteriores | 32 cenários continuam incluídos na suite, não somar novamente |
| Descoberta Playwright normal | 54 casos encontrados em 2 ficheiros, três formatos |
| Descoberta Playwright Auth fictício | 18 casos encontrados em 1 ficheiro, três formatos |
| Execução Playwright normal | Tentada; webServer não iniciou, exit code 1. Nenhum caso aprovado nesta alteração. |
| Execução Playwright Auth fictício | Tentada; webServer não iniciou, exit code 1. Arranque directo do simulador confirmou portas locais indisponíveis. Nenhum caso aprovado nesta alteração. |
| Build Turbopack | Tentado; criação de processo/abertura de porta recusada: Operation not permitted (os error 1). Não concluído. |
| Build alternativo --webpack | Tentado; não concluído: Could not parse output from TypeScript's --showConfig. Causa desta alternativa não esclarecida; TypeScript independente passou. |
| Auth/recuperação/Supabase reais | Não executados e não autorizados nesta entrega |

Não se alteraram políticas de segurança, TLS, CSRF ou visibilidade de portas para fazer os testes passar. As suites de navegador novas precisam de execução num ambiente adequado, como o Codespaces, antes de qualquer ensaio real. A suite Auth local usa um serviço HTTPS fictício e certificado temporário confiado apenas pelo processo Node de teste; não desactiva validação TLS nem modifica o sistema de certificados. A execução do simulador foi impedida antes do arranque de Next; os cenários de navegador completos ainda não estão validados.

Os resultados históricos confirmados pelo responsável no Codespaces — npm ci, lint, TypeScript, build, 72 Vitest, 42 Playwright e 20 descritores offline — pertencem ao código anterior. A auditoria então reportou zero vulnerabilidades em produção e 16 alertas moderados de desenvolvimento. Não se repetiu npm audit nem se actualizaram dependências nesta correcção.

## Cobertura local aprovada

- Verificação invite/recovery com cliente Auth simulado; destino exclusivamente APP_ORIGIN HTTPS apesar de Host/forwarded headers/next maliciosos.
- Falha fechada sem origem; recusa de origens inseguras, caminhos, credenciais, query/fragmento; HTTP loopback limitado a desenvolvimento/teste.
- Parâmetros ausentes/duplicados/malformados e erro de convite expirado/consumido; sem transporte do token/erro em redireccionamentos.
- Excepções simuladas não são impressas ou devolvidas ao utilizador.
- Recuperação genérica, origem explícita e ausência de chamadas com dados inválidos ou origem ausente.
- Definição de password exige getUser válido, confirma o valor, só altera password e termina sessão; falhas de alteração/logout não declaram sucesso.
- Configuração Secure/SameSite e passagem dos cookies do SDK para o armazenamento SSR; renovação no proxy mantém Secure com origem interna HTTP e APP_ORIGIN HTTPS.
- Modelos SiteURL/auth/confirm e protecções de logs/headers.

Esta cobertura não prova a API Auth real, a entrega, o proxy GitHub, a validade criptográfica de JWT emitido pelo Supabase ou os cookies num navegador HTTPS real. Não há contas ou sessões reais nos testes; todos os marcadores são sintéticos.

## Integridade e âmbito

Migração inalterada: SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58. package.json/package-lock.json inalterados; nenhuma dependência acrescentada. Identidade azul-escuro, estrutura organizacional, RLS, permissões e contratos de Centros de Custo/SAP/Primavera preservados.

Workflow existente preparado para executar a suite Auth local depois da suite normal; não se abriu PR, publicou ou alterou main. Este relatório não afirma execução de GitHub Actions. Nenhum email, convite, operação SQL remota, alteração Auth/SMTP/URLs/modelos no Supabase, criação/eliminação de conta ou bootstrap foi executado.

Conclusão: correcções de código preparadas e verificações unitárias/lint/TypeScript aprovadas. Build e execução das duas suites Playwright estão pendentes. Configuração e recuperação real de AT continuam a exigir autorização separada e conclusão destas verificações. Seguir correccao-confirmacao-e-recuperacao.md.
