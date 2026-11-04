# Recuperação por PKCE com SMTP padrão

Data: 4 de Novembro de 2026, Africa/Luanda. Branch exclusiva fase-1-autenticacao-permissoes. Base c7247a7. Código/testes preparados localmente; nenhum envio, configuração ou utilizador remoto foi alterado.

Este é o procedimento vigente para recuperar AT com o modelo padrão Reset password. Substitui a recomendação anterior de editar o modelo como pré-requisito. Os modelos token_hash existentes no repositório continuam opcionais para uma futura configuração expressamente autorizada; não são aplicados ao Supabase nesta entrega.

## Fluxo e segurança

No Codespaces privado, os três formulários Auth passam também pela [prova CSRF de origem](correcao-origem-codespaces.md). Esta adaptação não autoriza localhost na configuração do Next: exige prova ligada ao cookie do navegador antes de repor APP_ORIGIN no transporte afectado. Build e túnel real da adaptação têm validação própria pendente; não repetir um pedido real como diagnóstico.

1. O pedido começa no formulário /recuperar-acesso, através da Server Action. O SDK SSR 0.8.0 usa flowType=pkce, persistência em cookies e detectSessionInUrl=false. Não há leitor de fragmentos nem conversão manual de access_token/refresh_token.
2. resetPasswordForEmail gera o verificador e grava-o por setAll antes de chamar /recover. O desafio S256 é enviado ao Auth. A Server Action exige escrita de cookies: uma falha na gravação do verificador impede esse pedido. Apenas clientes usados em leitura de Server Components conservam a tolerância anterior a cookies não graváveis.
3. Após sucesso do SDK, a aplicação guarda uma intenção curta em cookie HttpOnly, Secure no HTTPS, SameSite=Lax e Path=/auth/confirm. O estado servidor liga esta intenção à impressão SHA-256 dos cookies do verificador e ao hash do destinatário. Não guarda email em claro, JWT ou password.
4. O email padrão mantém ConfirmationURL. O utilizador abre-o no mesmo navegador/perfil que iniciou o pedido. A verificação no Supabase encaminha para APP_ORIGIN/auth/confirm?code=... . O servidor não exige que o email contenha token_hash.
5. O callback exige intenção/verificador coincidentes antes de trocar o código. Consome essa intenção uma vez, executa exchangeCodeForSession e reconhece PASSWORD_RECOVERY pela API pública onAuthStateChange. A subscrição é síncrona e removida em finally. Confere utilizador e destinatário, sem confiar num type=recovery recebido no URL.
6. Só depois de uma recuperação válida emite uma autorização opaca de definição de password. Esta autorização é HttpOnly, Secure no HTTPS, SameSite=Lax, Path=/actualizar-palavra-passe e dura no máximo dez minutos ou a validade restante do JWT verificado. É ligada ao utilizador e session_id; não aparece no URL.
7. O formulário continua a exigir password com 12 a 128 caracteres e confirmação coincidente. A Server Action verifica getUser, identifica a sessão actual e consome a autorização sincronamente antes de updateUser. Uma sessão normal ou cookie inventado não basta. Não há consulta/escrita de profiles, papéis ou organização neste fluxo.
8. O consumo é de uso único inclusive quando a actualização falha. Valores inválidos detectados antes do consumo podem ser corrigidos no formulário. Depois de erro de transporte/actualização, não repetir em ciclo: pode ser necessária uma nova recuperação, separadamente autorizada. Logout com erro nunca é apresentado como sessão terminada.
9. O percurso token_hash+verifyOtp foi preservado para recovery e invite verificados no servidor. O convite permite a definição inicial de password, sem atribuir poderes. Códigos PKCE de outros tipos não recebem autorização.

APP_ORIGIN continua a ser a única base dos destinos. Não há fallback para Host/request.url/next. Parâmetros duplicados, code misturado com token_hash/type, tokens de sessão ou erros do fornecedor no query são recusados. As respostas mantêm no-store/no-referrer e destinos sem segredos; logs/traces e debug permanecem desactivados conforme a correcção anterior.

## Limite explícito do armazenamento local

As intenções e autorizações de password são estados efémeros em memória do processo Node, com nonces aleatórios de 256 bits, expiração e limite de 256 entradas por mapa. Adequado ao ensaio privado num único processo do Codespaces, sem nova dependência, tabela ou segredo administrativo. Reiniciar, recompilar, editar código ou encaminhar pedidos para outro processo pode invalidar o percurso; falha fechado e não activa fallback.

Isto não constitui uma solução de armazenamento para produção com várias instâncias. Antes desse uso, seria necessário um armazenamento partilhado com consumo atómico, expiração e revisão própria. Não publicar esta implementação como se essa condição estivesse resolvida. A memória não substitui a verificação criptográfica Auth: getUser/verifyOtp/exchange validam a identidade; a leitura das claims serve apenas para ligar a autorização à sessão validada.

## Testes e estado desta entrega

Os testes usam valores sintéticos. O teste de integração do SDK real substitui exclusivamente fetch/armazenamento cookies e verifica: S256, escrita anterior ao pedido, novo cliente lendo o mesmo verificador, troca PKCE, evento PASSWORD_RECOVERY, remoção do verificador e escrita da sessão. Falha de Set-Cookie impede o envio no transporte fictício; ausência de verificador impede troca.

A suite Auth de navegador tem agora 33 casos (11 por formato): percurso padrão ConfirmationURL simulado, password/logout, código expirado/reutilizado, outro navegador sem verificador, sessão normal sem autorização e confirmação de password diferente. Conserva os testes de token_hash. O simulador valida o desafio S256 e a utilização única do código. Nenhum email é enviado; as contas não existem no Supabase. Os 54 testes normais permanecem.

Resultados finais e limitações de execução são registados no relatório de entrega desta alteração. Listagem de testes não significa execução aprovada. As aprovações do responsável para c7247a7 (117 Vitest, build, 54+18 Playwright) são históricas e não aprovam automaticamente este novo código.

## Ensaio real de AT — requer NOVA autorização

Antes do ensaio, concluir npm ci, lint, TypeScript, Vitest, build e as duas suites Playwright no Codespaces. Não executar os simuladores em paralelo com outro servidor Next neste checkout. Os comandos offline de build devem substituir as variáveis Supabase por valores vazios; as suites de navegador já substituem as suas variáveis por valores vazios ou fictícios de loopback.

    npm ci
    npm run lint
    npm run typecheck
    npm test

    (
      export NEXT_PUBLIC_SUPABASE_URL=""
      export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
      export SUPABASE_SERVICE_ROLE_KEY=""
      export APP_ORIGIN="https://preview.example.invalid"
      npm run build
    )

    npm run test:e2e
    npx playwright test --config=playwright.auth-local.config.ts

Cada comando deve terminar antes do seguinte. Falhas exigem análise; não desactivar TLS/CSRF/sandbox, alterar visibilidade ou corrigir dependências automaticamente. Não aplicar stashes antigos durante a validação.

Após autorização expressa do ensaio real:

1. Confirmar o commit aprovado e actualizar o checkout preservando alterações/stashes. Confirmar que não ficaram os exports vazios/fictícios da validação no terminal real. Abrir um terminal novo com os segredos Codespaces já configurados para o projecto de desenvolvimento confirmado.
2. Parar apenas o servidor de pré-visualização identificado e arrancar uma única instância Next actualizada. Conservar a porta 3000 Private. Não alterar SMTP, modelos ou políticas Auth. Confirmar por leitura Site URL, Redirect URL exacta /auth/confirm e APP_ORIGIN coerentes com a origem HTTPS do Codespace.
3. Confirmar por leitura que a conta AT existente continua com email confirmado, perfil inactive e zero papéis. O último estado foi comunicado pelo responsável; não se fez nova consulta remota nesta implementação. Não criar AF nem repetir a migração.
4. Abrir primeiro a pré-visualização HTTPS no navegador autorizado e concluir o acesso GitHub. Deixar esse navegador/perfil aberto, sem limpar cookies, mudar de dispositivo ou reiniciar Codespace durante o percurso.
5. Confirmar a quota disponível e elegibilidade do endereço controlado. O SMTP integrado mantém dois emails por hora e restrições de destinatários. Contabilizar outros envios/notificações; não pressupor que uma resposta genérica comprova envio ou entrega.
6. Em /recuperar-acesso, introduzir o email de AT privadamente e clicar uma única vez. Não pedir a recuperação pelo painel/terminal, pois não criaria o verificador/intenção no navegador da aplicação. Não pedir outro email enquanto este percurso estiver pendente.
7. Abrir apenas a ligação do novo email no mesmo navegador. O percurso esperado é verificação no Supabase, callback HTTPS com código de uso único e redireccionamento imediato para /actualizar-palavra-passe, sem código/token no destino final. Não capturar, copiar ou partilhar a ligação intermédia. Não reutilizar o convite antigo ou um email de recuperação anterior.
8. Introduzir duas vezes a nova password única (mínimo 12 caracteres), guardada num gestor privado. Aguardar o retorno a /entrar?mensagem=palavra-passe-actualizada e a conclusão do logout. Não fazer capturas do formulário preenchido.
9. Confirmar por leitura que o perfil continua inactive e sem papéis. Login de validação, se incluído expressamente na autorização, deverá continuar a bloquear acesso funcional. Não activar o perfil para contornar esse resultado.
10. Registar apenas alias, versão, horários UTC/Africa-Luanda, entrega, destino final sanitizado, resultado e estado do perfil. Sem password, cookies, verificador, nonce, token_hash, código ou ConfirmationURL. Guardar evidências numa localização privada persistente.

## Paragem e recuperação

- Outro navegador, verificador perdido/alterado, intenção inexistente, código inválido/reutilizado ou destinatário divergente: recusa, sem fallback implícito ou sessão normal autorizada a alterar password.
- A validade do código PKCE é curta (a documentação Supabase indica cinco minutos após emissão). Preparar o acesso privado antes de iniciar; não há renovação automática de links.
- Leitores automáticos de email podem consumir a ligação antes do utilizador. Não desactivar protecções do email nem editar/manipular links; parar e analisar antes de um reenvio autorizado.
- Depois de reinício/edição do processo, perder a intenção/grant é comportamento esperado de segurança. Não reutilizar um link consumido para contornar a perda de estado.
- Se updateUser falhar ou houver timeout, a password pode ou não ter sido alterada. A autorização local já foi consumida: analisar sem repetir cegamente. Reenvio/novo ensaio requer autorização própria e quota disponível.
- Cookies, URL/modelo ou sessão inesperados: parar. Não configurar SMTP, criar/eliminar utilizadores, conceder papéis ou restaurar a baseline vazia para corrigir Auth.

O âmbito futuro a autorizar é um único pedido de recuperação pelo portal para AT existente, entrega/aceitação no mesmo navegador, definição privada de password, logout, consultas de leitura e opcional login de validação. Não inclui reenvios, configuração SMTP/modelos/URLs, outras contas, bootstrap, permissões, migrações, publicação ou merge.
