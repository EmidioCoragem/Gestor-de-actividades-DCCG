# Confirmação SSR e recuperação de AT no Codespaces

Preparação de código autorizada em 3 de Novembro de 2026 (Africa/Luanda). Nenhuma configuração remota ou envio de correio foi executado. Branch exclusiva: fase-1-autenticacao-permissoes. Não reaplicar a migração nem fazer bootstrap.

## Estado comprovado e diagnóstico

O responsável criou AT por convite e recebeu o email. A consulta de leitura devolveu uma conta, email confirmado, convite registado, perfil existente inactive e zero papéis. A definição de palavra-passe não está comprovada. AF permanece por criar.

O convite abriu um fluxo implícito que terminou em localhost:3000 com tokens no fragmento. Localhost no navegador refere-se ao computador do responsável, não ao Codespace. A aplicação usa verificação servidor por token_hash e cookies SSR; não recebe o fragmento no servidor. Mudar somente o Site URL não converte o fluxo antigo e não altera emails já enviados.

Não reutilizar, editar, copiar, importar ou tentar converter o token/ligação antigos. Não apagar/recriar AT. Email confirmado não implica perfil activo, palavra-passe definida ou poderes administrativos.

## Código preparado

- /auth/confirm valida APP_ORIGIN antes de contactar Auth. Destinos fixos são construídos exclusivamente a partir desta origem; Host, forwarded headers, request.url e next não escolhem o destino.
- APP_ORIGIN aceita uma origem HTTPS, sem credenciais, caminho, query ou fragmento. HTTP em localhost/127.0.0.1 só é permitido em desenvolvimento/testes; produção exige HTTPS. Não há fallback para a origem do pedido. Configuração ausente/inválida devolve 503 genérico.
- Apenas invite/recovery, um token_hash e um type são aceites; parâmetros ambíguos e tokens malformados são recusados. verifyOtp continua no servidor. Sucesso encaminha para /actualizar-palavra-passe; falha para /entrar?erro=ligacao-invalida. O destino nunca transporta token, email ou erro do fornecedor.
- Cookies SSR e renovação no proxy usam Secure quando APP_ORIGIN é HTTPS e SameSite=Lax. O cliente de navegador conserva a política compatível com o SDK SSR; não se muda HttpOnly isoladamente, pois esse SDK também usa cookies no cliente. Tokens não são transferidos para URLs nem para um novo armazenamento manual.
- A definição de palavra-passe verifica a sessão por getUser, exige pelo menos 12 caracteres e confirmação coincidente, actualiza apenas a palavra-passe e termina sessão. Um erro de logout não é apresentado como sessão terminada. Não consulta ou modifica papéis nem activa profiles.
- Recuperação mantém mensagem genérica inclusive perante endereço inexistente, limite ou erro de transporte, sem revelar resposta do fornecedor. Esta mensagem não comprova entrega.
- Modelos invite/recovery usam SiteURL + /auth/confirm, token_hash e type explícito, funcionando também quando um convite do painel não define RedirectTo. Esta escolha destina os emails a um único ambiente configurado; não é um mecanismo multi-origem.
- Logs de desenvolvimento Next (incluindo argumentos de Server Actions), debug Auth, traces, vídeos e capturas automáticas das suites estão desactivados. Páginas Auth e confirmação pedem no-store e no-referrer. Server Actions permitem apenas o hostname exacto deste Codespace quando identificado pelas variáveis nativas, sem wildcard; não se desactiva CSRF.

O token_hash continua a ser um segredo de utilização única, embora não seja um access token. A URL inicial atravessa o navegador e o encaminhamento GitHub. As protecções da aplicação não garantem a ausência de registos em serviços externos, extensões, histórico ou servidores de email. Não recolher URLs brutos, HAR, cookies, corpos de pedidos, sessões, passwords ou logs de infraestrutura para evidência. Conservar apenas resultado, alias, hora e código genérico. Não activar debug para diagnosticar o fluxo real.

## Configuração manual proposta — NÃO APLICADA

Usar ORIGEM como abreviatura da origem HTTPS exacta obtida em Codespaces → Ports → porta 3000 → Open in Browser. Exemplo apenas de formato: https://NOME-DO-CODESPACE-3000.app.github.dev. Não copiar o exemplo literalmente, não incluir caminho, query ou barra final.

| Local | Valor/alteração exacta |
|---|---|
| Supabase → Authentication → URL Configuration → Site URL | Substituir http://localhost:3000 pela ORIGEM HTTPS exacta |
| Redirect URLs | Acrescentar apenas ORIGEM/auth/confirm; não usar wildcards nem autorizar outra origem |
| Authentication → Email Templates → Invite user | Substituir o corpo pelo conteúdo completo de supabase/templates/invite.html |
| Authentication → Email Templates → Reset password | Substituir o corpo pelo conteúdo completo de supabase/templates/recovery.html |
| Codespaces → APP_ORIGIN | ORIGEM, sem caminho |
| Codespaces → NEXT_PUBLIC_SUPABASE_URL | URL HTTPS pública apenas do projecto novo de desenvolvimento confirmado |
| Codespaces → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Chave publicável do mesmo projecto; nunca uma chave privilegiada |
| Porta 3000 | Manter Private; não abrir ao público ou à organização |
| SUPABASE_SERVICE_ROLE_KEY | Não é necessária para este percurso; não acrescentar/configurar para recuperação |

Guardar antes, privadamente, os valores anteriores e os modelos completos para recuperação de configuração. Não alterar SMTP, confirmação de email, signup, anónimos, política de palavras-passe, duração de sessões ou limites. Não alterar o projecto Supabase anterior. Não remover outras configurações inesperadas: parar e confrontar com o registo privado do painel.

No Codespaces, editar privadamente .env.local (ignorado pelo Git) ou usar os segredos Codespaces do repositório. Não sobrescrever um ficheiro existente inteiro nem mostrar valores no terminal/chat/GitHub. Alterações a segredos Codespaces podem exigir parar/reiniciar o Codespace; alterações a .env.local exigem reiniciar Next. Variáveis exportadas vazias nos testes têm precedência sobre .env.local: usar um terminal novo sem esses exports. Não executar env, printenv ou cat .env.local para conferir.

## Verificação local antes da operação real

Com Node 24 e sem servidores anteriores a ocupar as portas, executar os comandos um de cada vez:

    npm ci
    npm run lint
    npm run typecheck
    npm test

Para build offline, numa subshell que não altera a configuração guardada:

    (
      export NEXT_PUBLIC_SUPABASE_URL=""
      export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
      export SUPABASE_SERVICE_ROLE_KEY=""
      export APP_ORIGIN="https://preview.example.invalid"
      npm run build
    )

As suites Playwright substituem configuração Supabase por valores vazios ou exclusivamente fictícios locais, sem efectuar pedidos ao projecto remoto:

    npm run test:e2e
    npx playwright test --config=playwright.auth-local.config.ts

Executar sequencialmente, nunca ao mesmo tempo que build/outro servidor Next neste checkout. Suite normal: 54 casos esperados nos três formatos, incluindo rejeições/redireccionamento HTTPS sem seguir a origem externa fictícia. Suite Auth local: 18 casos esperados, seis por formato.

A suite Auth local inicia Next em 127.0.0.1:3100 e simuladores em 127.0.0.1:4343/4344. Usa certificado temporário e confiança Node limitada ao simulador; TLS não é desactivado, não há alterações ao repositório de certificados do sistema e os ficheiros temporários são removidos no encerramento. Precisa de openssl, Chromium e portas disponíveis. Não tem modo de teste injectado no código de produção e não aceita uma URL Supabase externa. Sessões e contas são sintéticas, sem ligação ao UUID real de AT. O frontend desta suite é HTTP loopback de desenvolvimento; a política HTTPS/Secure e o destino canónico têm testes separados. Não prova a sessão GitHub ou a infraestrutura remota.

Resultado local desta preparação é registado em verificacao-correccao-auth.md. Não contar os 32 cenários SQL novamente nem confundir descritores PostgREST com pedidos executados. Resultados históricos de build/42 testes do Codespaces são anteriores a esta alteração e não aprovam automaticamente o código novo.

## Passos para recuperar AT — apenas após autorização separada

1. Guardar evidências locais numa localização privada persistente. Actualizar o checkout da branch preservando alterações locais. Não aplicar o stash antigo da Fase 0.
2. Concluir build e as duas suites de navegador no Codespaces; perante falha, analisar antes de configurar/enviarem emails reais.
3. Guardar a baseline privada de URLs/modelos. Aplicar só as configurações aprovadas da tabela acima.
4. Confirmar porta 3000 Private. Configurar as três variáveis da aplicação para o projecto correcto e a ORIGEM; manter a chave administrativa ausente neste ensaio.
5. Iniciar a aplicação com npm run dev num terminal novo. Em Ports → Open in Browser, abrir a ORIGEM e autenticar no GitHub com o proprietário autorizado. Manter esse navegador/perfil aberto. Não é preciso alterar o protocolo do processo Next para HTTPS: o endereço externo fornecido pelo Codespaces é HTTPS.
6. Sem qualquer ligação de email, abrir ORIGEM/recuperar-acesso. Abrir também ORIGEM/auth/confirm sem parâmetros: deve resultar apenas em ORIGEM/entrar?erro=ligacao-invalida. Parar perante localhost, domínio inesperado, 503 ou erro de origem.
7. Reconfirmar por leitura uma única conta AT, email confirmado, perfil inactive e zero papéis. Usar a consulta de inspecção já fornecida; não recolher colunas de tokens/passwords. Se o resultado diferir, parar.
8. Confirmar quota e elegibilidade do email. Com autorização de envio, introduzir o endereço de AT no formulário Recuperar acesso e clicar uma vez em Enviar instruções. A mensagem é genérica: confirmar entrega na caixa privada. Não criar outra conta nem enviar novo convite.
9. Abrir apenas o novo email no mesmo navegador/perfil que já acede à porta privada. O endereço final deve ser ORIGEM/actualizar-palavra-passe, sem token. Não copiar a ligação para o terminal, chat ou ferramentas de teste. Se houver autenticação GitHub intermédia inesperada ou erro, parar antes de repetir/reencaminhar a ligação.
10. Definir e confirmar uma palavra-passe única com pelo menos 12 caracteres, guardada num gestor privado. Depois de guardar, esperar ORIGEM/entrar?mensagem=palavra-passe-actualizada. Não partilhar a password ou capturar o formulário preenchido.
11. Conferir por leitura que AT continua inactive e sem papéis. Com autorização para o ensaio de login, a password pode ser comprovada pela entrada; o resultado funcional esperado é acesso restrito enquanto o perfil estiver inactivo. Não activar para ultrapassar essa restrição.
12. Registar alias, hora UTC/Africa-Luanda, entrega, destino final sanitizado, definição concluída, logout e estado do perfil. AF e bootstrap permanecem pendentes.

## Falhas e recuperação

- Ligação antiga: não reutilizar; mudança de URL/modelo não a converte.
- Expiração, consumo por scanner ou ligação inválida: parar; pedir nova autorização de envio e respeitar a quota. Não reutilizar fragmentos/tokens anteriores nem confirmar email manualmente.
- Nenhum email: a resposta genérica da aplicação não distingue envio, endereço desconhecido ou erro; não repetir automaticamente. Rever quota e elegibilidade por meios do painel que não exponham segredos.
- Definição falhou/timeout: não assumir que a password ficou por alterar. Registar o estado, sem repetir em ciclo. Se o logout falhar, a aplicação não declara sessão terminada; analisar antes de continuar.
- Redireccionamento para domínio errado ou cookie sem Secure no HTTPS: interromper. Não tornar a porta pública, desactivar CSRF, alterar SameSite para None, TLS ou confirmação de email.
- Reverter URLs/modelos exige restaurar apenas os valores privados anteriores, com autorização. A reversão não desfaz email enviado, password alterada, confirmação ou sessões. Não usar rollback da migração/baseline vazia.
- Não apagar AT, criar AF, conceder papéis ou activar perfis como solução de uma falha de Auth.

## Autorizações pendentes

Esta entrega autoriza exclusivamente código/documentação/testes no GitHub. Para a operação real, aprovar separadamente: (A) os valores exactos de Site URL/Redirect URL e os dois modelos; (B) variáveis/reinício da aplicação no Codespaces; (C) um email de recuperação para a AT existente, sua aceitação, definição privada de password, logout e eventual login de validação. Qualquer reenvio não está implícito. Não inclui SMTP, novas contas, bootstrap, permissões, migração, publicação ou merge.
