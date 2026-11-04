# Verificação da recuperação PKCE com SMTP padrão

Data: 4 de Novembro de 2026, Africa/Luanda. Base: c7247a7a8b8de264eb4eb6c130b66eca0fcea86d. Node v24.19.0/npm 11.9.0. Branch exclusiva fase-1-autenticacao-permissoes.

## Evidência obtida nesta implementação

| Comando/verificação | Resultado real |
|---|---|
| npm ci | Aprovado; 418 pacotes instalados em 32 segundos. Aviso de suporte de ESLint 9.39.5. |
| npm run lint | Aprovado na versão final |
| npm run typecheck | Aprovado na versão final |
| npm test | 149 testes aprovados em 16 ficheiros, 94,32 segundos. Inclui os cenários SQL anteriores em memória. |
| Teste SDK real/fetch fictício | S256, gravação anterior a /recover, novo cliente lendo verificador, troca PKCE e evento público PASSWORD_RECOVERY aprovados; sem rede real. |
| Testes de autorização de password | Sessão normal/cookie inventado/outro utilizador/outra sessão recusados; uso único/expiração aprovados. |
| Build Turbopack | Tentado; não concluído. Criação de processo/abertura de porta recusada: Operation not permitted (os error 1). |
| Build Webpack alternativo | Tentado; não concluído: Could not parse output from TypeScript's --showConfig. Causa não esclarecida; o typecheck independente passou. |
| Playwright normal | Tentado; webServer não iniciou (exit code 1). Suite tem 54 casos; não há aprovação desta execução. |
| Playwright Auth local | Tentado; webServer não iniciou (exit code 1). Arranque directo do simulador confirmou portas locais indisponíveis. 33 casos reconhecidos em --list; não executados com sucesso. |
| Supabase/Auth/correio reais | Não executados, não autorizados nesta entrega |

O SDK público expõe PASSWORD_RECOVERY em onAuthStateChange. O primeiro ensaio local mostrou também que uma chave auxiliar de índice PKCE pode permanecer após remover o verificador efectivo; o teste passou a conferir a chave efectiva e o evento público. Não se usam propriedades internas redirectType no código. O typecheck e os testes finais passaram depois desse ajuste.

São 149 testes Vitest no total, não 149 mais 32: a suite já inclui os 32 cenários SQL. Novos cenários de navegador não se confundem com os 54+18 aprovados pelo responsável no Codespaces para c7247a7. A suite Auth nova tem 33 casos (11 em cada formato), com o fluxo padrão modelado por simulador e SDK reais da dependência instalada. Só essa execução no navegador poderá confirmar a propagação HTTP Set-Cookie, armazenamento em memória partilhado entre callback/Server Action e a interacção completa desta alteração.

Não se alteraram TLS, CSRF, permissões de portas ou políticas do ambiente para contornar restrições. Não se repetiram npm ci ou testes SQL caros sem motivo; houve verificações focadas após ajustes e uma suite completa final. Não se actualizaram dependências ou aplicaram correcções de auditoria.

## Limitações e próximos passos

1. Concluir build e as duas suites Playwright no Codespaces antes de qualquer email. Uma falha real deve ser analisada; esta entrega não é uma aprovação antecipada de recuperação remota.
2. As intenções/grants são memória efémera do único processo Node do Codespaces, com expiração/uso único. Reinício, HMR ou outro processo podem invalidá-los. Falha fechado; não reutilizar links nem acrescentar fallback para sessão normal. Produção com múltiplas instâncias exige armazenamento partilhado e revisão própria.
3. Os testes de SDK usam transporte e cookies fictícios. Não comprovam SMTP, elegibilidade do destinatário, gateway GitHub, validade criptográfica de JWT remoto ou a sessão real de AT.
4. Um pedido/ligação de recuperação de AT pelo portal, aceitação no mesmo navegador, password/logout e eventual login exigem nova autorização. Nenhum email foi enviado e nenhuma consulta/operação foi executada no projecto Supabase remoto.

## Integridade

- Migração original intacta: SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58.
- package.json e package-lock.json inalterados; sem dependências novas.
- Nenhuma escrita de profiles, papéis, organização, Centros de Custo, RLS ou auditoria remota. Último estado de AT comunicado pelo responsável: inactive, zero papéis; não se voltou a consultar ou alterar essa conta.
- Sem configurações remotas, SMTP, modelos no painel, novas contas, migrações remotas, publicação ou merge na main. Identidade azul-escuro e contratos SAP/Primavera preservados.

Conclusão: implementação guardada para revisão e execução local restante. Unitários/lint/TypeScript aprovados. Build, navegador e ensaio real permanecem pendentes nos termos acima. O procedimento exacto está em pkce-smtp-padrao.md.
