# Origem dos formulários no Codespaces privado

Branch: fase-1-autenticacao-permissoes. Base: 2d09ece99edc0bceb04eebe6dad3a767c0f6e5e8. Data: 4 de Novembro de 2026, Africa/Luanda.

## Causa e limites da evidência

O diagnóstico de leitura fornecido pelo responsável encontrou no log do Next uma rejeição com Origin de hostname localhost:3000 e x-forwarded-host igual ao hostname HTTPS autorizado. APP_ORIGIN e o hostname calculado a partir das variáveis Codespaces coincidem, tanto no terminal como no processo 1360. A configuração existente de serverActions.allowedOrigins já contém apenas o hostname público exacto; não permite localhost nem wildcards.

O código instalado do Next.js 16.4.3 (server/app-render/action-handler.js) extrai new URL(Origin).host, dá prioridade a x-forwarded-host sobre Host e, quando divergem, consulta a allowlist. Como localhost:3000 não está autorizado, lança Invalid Server Actions request antes de chamar a acção. Essa é a causa comprovada da rejeição registada; não é uma resposta do SMTP ou do Supabase.

A documentação primária do transporte Microsoft Dev Tunnels prevê a reescrita de Host e Origin para localhost por defeito e opções independentes para preservar esses cabeçalhos: https://github.com/microsoft/dev-tunnels/blob/b73b0eb774b86a5b519c300f2f41c9072a66f663/ts/src/contracts/tunnelOptions.ts . O desvio observado é compatível com esse transporte. Não foi possível inspeccionar o POST à saída do navegador nem capturar o percurso completo do Codespace privado: a atribuição exacta a um salto do proxy, a data da linha do log e o protocolo do Origin não estão comprovados. Não se afirma que algum email foi ou não enviado na tentativa interrompida; falta correlacionar os logs Auth dessa tentativa.

## Correcção limitada e protecção CSRF

A adaptação é local aos formulários /entrar, /recuperar-acesso e /actualizar-palavra-passe. Só funciona com CODESPACES=true, NODE_ENV diferente de production, domínio app.github.dev, nome Codespaces válido e APP_ORIGIN exactamente igual a https://<nome>-3000.app.github.dev, sem barra final. Configuração divergente falha fechado. Fora do Codespaces, o fluxo anterior mantém-se.

1. O GET emite uma prova CSRF aleatória de 256 bits num cookie __Host-gestor-form-origin: Secure, HttpOnly, SameSite=Strict, Path=/, sem Domain, dez minutos. Um cookie válido existente é reutilizado para não invalidar outra aba. A prova é passada pelo servidor a um campo oculto do formulário, sem URL, logs ou armazenamento no Git.
2. Todo POST desses formulários no modo Codespaces exige a prova no corpo e no cookie, com comparação de tempo constante. O prefixo __Host- impede plantação por subdomínio/Domain em navegadores conformes; a política de mesma origem impede outro site de ler o campo. Não se habilita CORS. A prova é anti-CSRF, não é uma sessão ou uma autorização para alterar passwords.
3. Exige também Sec-Fetch-Site=same-origin e o hostname encaminhado exacto. Cabeçalhos de origem alternativa, listas de hosts, portas adicionais, ausência de Origin, origens externas, prova ausente/trocada/duplicada ou corpo superior a 16 KiB são recusados com 403 antes do SDK Supabase. Nem x-forwarded-host nem Fetch Metadata, sozinhos, bastam para aceitar a adaptação.
4. Apenas com essas provas pode um Origin de transporte exactamente http://localhost:3000 ou https://localhost:3000 ser reposto para o APP_ORIGIN fixo. Não se aceita 127.0.0.1, outra porta ou outro domínio. A origem HTTPS canónica também exige a prova; não é reescrita.
5. O pedido segue com o corpo intacto para o Next, que continua a executar a comparação CSRF nativa. Não se acrescenta localhost a allowedOrigins, não se altera Host/x-forwarded-host e não se reconstrói APP_ORIGIN a partir de valores recebidos. Cabeçalhos x-original-origin e x-forwarded-origin não concedem confiança.
6. A leitura do corpo usa uma cópia limitada, suporta FormData serializado pelo React e formulário HTML, e não o regista. Cookies CSRF e de sessão são preservados quando o SDK renova cookies. As respostas Auth continuam private/no-store e no-referrer.

Os segredos/cookies não devem aparecer em capturas, HAR, logs ou relatórios. O cookie novo pode expirar durante inactividade; nesse caso a submissão é recusada. Não repetir pedidos reais como diagnóstico. Uma sessão normal continua sem autorização para definir password: o grant PKCE de uso único, getUser, mínimo de 12 caracteres, confirmação coincidente e logout não foram alterados.

Não se modificou a visibilidade da porta 3000. O arranque existente continua a exigir Private. Não se alteraram NextConfig, dependências, migração, Auth/SMTP/URLs/modelos remotos, perfis, papéis ou main. O processo do Codespaces do responsável não foi reiniciado por esta tarefa.

## Verificações desta alteração

- Lint aprovado.
- TypeScript aprovado após corrigir a tipagem da matriz de casos adversos do teste.
- Vitest: 180 testes aprovados em 17 ficheiros, 74,53 segundos; 31 casos novos de origem/CSRF. Os 149 anteriores incluem os cenários SQL em memória, sem migração remota.
- Casos novos: origem canónica; desvio localhost com prova válida; origem externa/nula/ausente; falsificação de hosts, origem alternativa e Fetch Metadata; prova ausente/trocada/duplicada; cookie duplicado; domínio/configuração divergente; limite de corpo; renovação simultânea de cookies. O serializador encodeReply real do React instalado é exercitado, e o corpo permanece legível após o proxy.
- O matcher CSRF real da dependência Next confirma que localhost e attacker.invalid continuam recusados na allowlist que admite apenas o hostname público.
- Build executado com configuração Supabase vazia: bloqueado pelo ambiente Cloud na transformação CSS/Turbopack, ao criar processo/abrir porta local, Operation not permitted (os error 1). Uma verificação isolada de listen também devolveu EPERM. Não é build aprovado; necessita de execução no Codespaces.
- Playwright Auth local tentado nesta versão: o webServer terminou com exit code 1 antes dos testes, coerente com a restrição de portas confirmada. Não há validação HTTP real do túnel nesta tarefa. Os 33 Playwright fictícios apresentados pelo responsável são da versão anterior, não constituem aprovação desta correcção. As fixtures offline agora desactivam expressamente CODESPACES no processo de testes para não herdar a adaptação HTTPS num simulador HTTP.
- Migração original intacta: SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58. package.json e package-lock.json inalterados.

## Antes de qualquer novo ensaio real

Primeiro confirmar nos logs Supabase apenas a presença/ausência e estado HTTP de POST /recover da tentativa interrompida, sem expor dados. O estado de envio/entrega permanece pendente enquanto isso não for verificado.

A actualização do Codespaces, o carregamento da nova versão, build e regressões de navegador devem ocorrer numa janela de manutenção fora do ensaio interrompido, sem reaproveitar intenções/links anteriores. É necessário um diagnóstico sem envio através do túnel para confirmar a compatibilidade da prova e dos cabeçalhos no transporte real antes de autorizar outra recuperação. Não se deve repetir o formulário real para testar esta correcção. A causa da rejeição foi reproduzida ao nível dos cabeçalhos e do matcher Next; a reescrita exacta pelo gateway continua uma limitação declarada.

Nenhum email foi enviado por esta implementação ou pelos testes. Não se apresenta homologação real de SMTP/PKCE/conta AT como concluída. Não abrir nem reutilizar links da tentativa interrompida. Um novo pedido de recuperação exige autorização própria.
