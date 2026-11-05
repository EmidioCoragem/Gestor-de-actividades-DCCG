# POST de diagnóstico sem recuperação real

Data: 5 de Novembro de 2026, Africa/Luanda. Base: c3a279b4f0148a61c383763fc2ed9ce2bd4a8bfa. Branch exclusiva fase-1-autenticacao-permissoes.

## Âmbito e limites

Existe um diagnóstico isolado em /diagnostico-csrf, desligado por defeito. Só é disponibilizado com GESTOR_CSRF_DIAGNOSTIC=1 no processo Next de desenvolvimento, CODESPACES=true e a origem exacta do Codespace validada. Fora dessas condições devolve 404. Não há nova configuração no Supabase, instalação de dependências ou alteração das origens permitidas.

O programa usa uma Server Action própria que apenas devolve accepted=true/false. Não importa SDK Supabase, não recebe email/password e não chama recoverAccess/resetPasswordForEmail. O proxy sai antes de criar o cliente Supabase, tanto no GET como no POST deste diagnóstico; não lê nem renova sessões Auth. O layout da página também não faz chamadas Auth. Usa uma prova descartável própria, num cookie __Host-gestor-origin-diagnostic, separado dos cookies Auth, PKCE e do formulário de recuperação. Não se copiam, introduzem ou registam tokens de autenticação/recuperação reais.

São verificações distintas:

1. No navegador já autenticado no GitHub, o botão de POST chama a Server Action de diagnóstico através do túnel HTTPS privado. A mensagem de aceitação confirma que o proxy e a validação CSRF nativa do Next deixaram executar essa acção e que a acção conferiu a origem canónica/prova própria. Não se trata de um pedido de recuperação com email inválido; não se chama a função de recuperação.
2. Outro botão envia um POST ao mesmo diagnóstico com a prova deliberadamente adulterada, sem identificador de acção de negócio. Só apresenta rejeição confirmada se receber HTTP 403 e o marcador fixo X-Gestor-CSRF-Diagnostic: rejected emitido pelo proxy da aplicação. Um 403 do gateway GitHub não é confundido com rejeição da aplicação.
3. A falsificação de Origin é exercitada separadamente por pedidos NextRequest fictícios, com cookie/prova sintéticos e x-forwarded-host forjado. Os testes verificam HTTP 403 antes do SDK; o matcher real do Next continua a recusar localhost e origens externas na allowlist.

Um browser normal não permite a JavaScript escolher livremente o cabeçalho Origin. Não se deve tentar forjá-lo com fetch e interpretar a ausência de erro como prova: o browser pode ignorar esse cabeçalho. Sem um cliente HTTP autenticado no túnel, uma tentativa externa pode parar na autenticação GitHub antes de alcançar o portal. Não se copiam cookies GitHub, HAR, storageState, Authorization ou tokens para contornar essa limitação.

Portanto, o botão negativo testa adulteração da prova através do túnel, não uma origem falsificada nesse percurso. A falsificação de origem fica comprovada nos testes locais e continua pendente de uma eventual verificação HTTP independente autorizada. Não se apresenta o conjunto como prova de todos os cabeçalhos à entrada do túnel. O ambiente Cloud não controla a sessão do browser do responsável nem tem acesso autenticado ao seu Codespace privado.

## Execução no Codespaces, sem email

1. Fora de qualquer ensaio de recuperação, parar com Ctrl+C apenas o terminal conhecido de npm run dev. Preservar alterações locais/stashes e actualizar a branch para o commit de diagnóstico indicado na entrega. Não fazer merge na main.
2. Executar lint, TypeScript, Vitest e build com as variáveis Supabase vazias, APP_ORIGIN fictício e CODESPACES vazio, num subshell. Não repetir npm ci sem necessidade: package.json/lock não foram alterados.
3. Num terminal novo com a configuração real já validada, iniciar uma única instância: GESTOR_CSRF_DIAGNOSTIC=1 npm run dev. O prefixo só activa o diagnóstico nesse processo; não cria um segredo ou configuração persistente. Conservar a porta 3000 Private.
4. Abrir no mesmo navegador autorizado https://solitary-haunting-vp67vqvgjr6xfpgv7-3000.app.github.dev/diagnostico-csrf. Não navegar para nem submeter os formulários Entrar/Recuperar acesso.
5. Clicar uma vez em Testar POST de diagnóstico. Esperado: POST de diagnóstico aceite pela aplicação. Se houver erro, parar e comunicar apenas a mensagem; não experimentar a recuperação como alternativa.
6. Só depois da aceitação, clicar uma vez em Testar prova CSRF adulterada. Esperado: HTTP 403 — rejeitada pela aplicação. Não repetir automaticamente, não recolher dados de rede e não fotografar campos ocultos/cookies. As mensagens de resultado não contêm provas ou credenciais e podem ser partilhadas.
7. Terminar esse processo com Ctrl+C e reiniciar normalmente com npm run dev, sem o prefixo de diagnóstico. A rota deverá voltar a 404. O cookie de teste expira automaticamente em dez minutos e não é uma sessão Auth; não é necessário limpar os restantes cookies.

## Verificação nesta tarefa

Lint e TypeScript aprovados. Os 49 testes focados de origem, diagnóstico e cookies passaram, incluindo a ausência de qualquer criação do SDK nos pedidos diagnósticos. Suite completa: 192 testes aprovados em 18 ficheiros, 69,31 segundos. Após reforçar a configuração fictícia do teste de POST, os 43 casos focados de origem/diagnóstico voltaram a passar. Build executado com configuração Supabase vazia: bloqueado por Turbopack na transformação CSS ao criar processo/abrir porta local, Operation not permitted (os error 1). Playwright normal tentado: o webServer terminou com exit code 1 antes dos testes. Não são aprovações de build/navegador desta versão. Não confundir os resultados c3a279b anteriores com execução desta versão. Não há aprovação HTTP do túnel enquanto o responsável não apresentar os resultados dos botões.

Nenhum email foi enviado por esta implementação ou pelos seus testes. Não se usaram contas AT/AF reais, passwords, tokens Auth/PKCE ou operações remotas. Nenhum perfil/papel foi consultado ou alterado. Mantêm-se CSRF, Secure/HttpOnly/SameSite, no-store e no-referrer. A página não é um modo alternativo para alterar passwords.

## Eventual ensaio real posterior

O diagnóstico não renova nem amplia a autorização de recuperação. Qualquer novo envio exige autorização própria, verificação actual de AT inactive/zero papéis, projecto/URLs/APP_ORIGIN, quota e elegibilidade de email, ausência de intenções antigas e uma única instância estável. Seguir então o procedimento PKCE já documentado, com um único pedido pessoal pelo portal, mesma sessão do navegador, password privada de pelo menos 12 caracteres, logout e consultas de leitura posteriores. Falha implica paragem sem reenvio. Não reutilizar o convite ou ligações anteriores.
