# Primeiro login AT sem bootstrap

Data: 5 de Novembro de 2026, Africa/Luanda. Base observada: bda4981b77015e9316a841ab5c21cbb5d656fd56. Branch fase-1-autenticacao-permissoes. Este documento não autoriza activação, atribuição de papéis ou bootstrap.

## Evidência real apresentada pelo responsável

- AT tinha uma conta Auth, email confirmado, um perfil inactive, zero papéis e zero sessões antes do ensaio.
- O responsável declarou uma única submissão pessoal de credenciais e redireccionamento automático para Acesso não autorizado.
- A leitura actualizada, feita às 11:26:21 de Luanda, encontrou uma conta, last_sign_in_at às 11:14:40 e uma sessão Auth. Os logs apresentados mostram POST /token 200 e GET /user 200 às 11:14:40–42. Isto comprova aceitação Auth e existência de sessão; a ausência de sessões de uma leitura anterior não descreve o estado posterior confirmado.
- O POST /logout 204 anterior, às 10:50:50 no painel, pertence à recuperação de password. Não é prova de logout da sessão de login criada depois.
- O responsável confirmou visitas directas à raiz / e a /administracao no mesmo navegador, sem repetir o login. Ambas redireccionaram para /acesso-restrito, sem menus, dados funcionais ou funcionalidades administrativas. Isto comprova o bloqueio dessas duas rotas neste cenário. A inspecção RLS descrita abaixo ainda precisa de resultados reais; a página de recusa, isoladamente, não prova todas as políticas do banco.
- Não houve login por parte do agente, recolha de credenciais ou mutação administrativa. Não se atribuiu uma causa não demonstrada ao resultado SQL anterior.

## Lacuna de logout e correcção

A página /acesso-restrito usava um formulário directo de signOut, sem a prova CSRF que protege os formulários Auth no transporte Codespaces. A rota não estava na adaptação de origem. Além disso, signOut ignorava erros do fornecedor e não exigia escrita de cookies. Não se apresentou uma tentativa real desse logout como falha observada: tratava-se de uma lacuna confirmada pela revisão do código.

A correcção adiciona /acesso-restrito à mesma guarda de origem, no-store/no-referrer e renderização dinâmica. O botão passa a usar ProtectedAuthForm em modo logout, com prova CSRF e sem campos de email/password. Um helper de encerramento exige requireCookieWrites=true e verifica signOut.error; a acção do formulário devolve mensagem genérica e não redirecciona se houver erro. A função signOut já existente também deixa de redireccionar silenciosamente quando falha. Não se registam erros brutos do SDK nem dados de sessão.

A correcção não modifica signIn, requireViewer, RLS, a migração ou dados. Cobre o percurso de logout de AT inactive. Não homologa os menus e percursos de um perfil activo, nem o futuro bootstrap. As origens permitidas continuam restritas ao Codespaces exacto; não se autoriza localhost na allowlist do Next.

## Continuação da única tentativa já efectuada

Não repetir o login. Não limpar cookies, reutilizar ligações de recuperação ou alterar configurações Auth/SMTP. Não se deve executar bootstrap para contornar a página de recusa.

1. No mesmo navegador/perfil, visitar por GET a raiz / e /administracao (e, opcionalmente, /actividades). Esperado: /acesso-restrito sem menus/dados funcionais. Se houver acesso funcional ou outro resultado inesperado, parar e analisar.
2. Antes de terminar a sessão, executar no SQL Editor do projecto de desenvolvimento o script [fase1-inactive-login-readonly.sql](../../../supabase/inspection/fase1-inactive-login-readonly.sql), substituindo o marcador de email privadamente. Não executar o SQL em Bash nem guardar o endereço no Git.
3. O script usa BEGIN READ ONLY, define apenas contexto JWT local à transacção e SET LOCAL ROLE authenticated. Isto não atribui um papel funcional a AT nem altera qualquer configuração Auth: o executor SQL fica temporariamente limitado e ROLLBACK repõe contexto/papel. Não utiliza um JWT assinado real. As funções chamadas são apenas de leitura. Se surgir erro, parar sem conceder privilégios ou mudar políticas.
4. Resultados esperados: contexto authenticated, sem bypass, sujeito presente; um perfil próprio inactive; utilizador_activo=false; zero permissões efectivas; catálogos administrativos não vazios como controlo positivo, mas zero papéis/permissões visíveis sob RLS; zero estrutura visível; 16 tabelas encontradas e 16 com RLS. Ler o próprio perfil inactive é permitido e necessário para o portal recusar o acesso.
5. Esta consulta testa as políticas reais do banco num contexto de identidade preparado pelo operador. Não é um pedido PostgREST usando o JWT do navegador e não equivale a homologação completa de todas as permissões, âmbitos ou Storage. Não exportar tokens para obter essa prova.
6. A instalação da correcção e os testes offline exigem uma janela de manutenção do processo Next; não foram executados no servidor do responsável por esta tarefa. Parar o Next não chama logout no Supabase. Os cookies Auth existentes no navegador devem ser conservados para retomar a sessão actual, sem outra submissão de credenciais. Se a sessão já não puder ser retomada, parar; não iniciar outro login sem novo enquadramento.
7. Após actualizar a branch preservando alterações/stashes, validar lint, TypeScript, Vitest, build e Playwright com configuração Supabase vazia/fictícia. Nenhum simulador deve correr ao mesmo tempo que o Next real neste checkout. A suite Auth ganha dois casos por formato e passa a 39; a normal continua com 54. Manter a porta 3000 Private e diagnóstico desligado ao voltar a iniciar o servidor real.
8. Reabrir /acesso-restrito para receber a prova CSRF actualizada. Confirmar que uma rota privada continua a recusar o acesso e que a leitura Auth ainda mostra a sessão de AT antes do logout. Isto não requer outro login.
9. Clicar uma vez em Terminar sessão e voltar à entrada. Sucesso esperado: /entrar, POST /logout bem sucedido no Auth e contagem auth.sessions de AT igual a zero. Se houver mensagem de erro ou timeout, parar sem repetir automaticamente; uma falha de transporte pode deixar o estado por esclarecer.
10. Repetir a consulta de estado AT: uma conta/email confirmado/perfil inactive/zero papéis/zero sessões. Visitar a raiz sem credenciais deverá levar a /entrar. Não validar logout apenas pela apresentação da página de entrada: a consulta de sessões é necessária. O teste não afirma revogação instantânea de todos os JWT já emitidos.

## Testes desta correcção

- Lint e TypeScript aprovados após corrigir a tipagem da matriz de cabeçalhos do teste.
- Suite completa: 202 testes em 19 ficheiros aprovados, 97,47 segundos. Inclui os testes anteriores e dez novos casos de logout/formulário/origem.
- Inspecção SQL adicional: um teste PGlite aprovado, 9,91 segundos. Executa a migração apenas numa base em memória e comprova filtragem de catálogos não vazios, leitura do próprio perfil inactive, ausência de permissões e reposição de contexto/dados após ROLLBACK. Não é migração ou consulta no Supabase remoto.
- Build tentado: bloqueio do ambiente Cloud ao abrir porta/processo na transformação CSS/Turbopack, Operation not permitted (os error 1).
- Playwright focado nos seis casos novos de logout: tentado; webServer terminou com exit code 1 antes dos testes. Nenhum caso de navegador desta correcção é apresentado como aprovado. Testes existentes no Codespaces são históricos até nova execução desta versão.
- Dependências e migração original inalteradas. SHA-256 da migração: 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58.

Não se contactou Supabase remoto nesta implementação. Os dados reais deste relatório provêm exclusivamente das capturas/declarações do responsável, sem passwords, cookies, ligações de recuperação, tokens ou identificadores de sessão. Não se alterou main, não se publicaram serviços e não foram criados utilizadores, perfis activos ou papéis.

## Revisão após o primeiro clique de logout

O responsável apresentou no Codespaces aprovação de lint, TypeScript, testes unitários do logout, build e Playwright focado no commit 01d6b67. A sessão continuava registada e a porta 3000 permanecia Private. O clique único posterior apresentou o erro genérico de resposta inesperada do Next, sem provar por si só o resultado no Supabase. Não foi autorizado um retry automático; a leitura de sessões e o evento Auth correspondente continuam necessários.

A revisão identificou uma falha introduzida em 01d6b67: signOutFromRestricted não declarava argumentos. O compilador SWC da versão Next instalada gera uma máscara de argumentos vazia para essa função. O cliente aplica omitUnusedArgs antes de encodeReply, eliminando o FormData com a prova CSRF. No modo Codespaces a guarda exige essa prova e deve recusar o pedido antes do SDK. A marcação de linha ProtectedAuthForm no overlay não demonstra uma falha do render nem do Supabase.

O novo teste de regressão compilou o ficheiro real de acções e reproduziu a perda do FormData no código anterior (falha observada: argumento indefinido). A acção passa a declarar estado e FormData e a validar o tipo deste último antes do logout. Isso conserva o argumento na máscara produzida pelo compilador. O mesmo teste usa omitUnusedArgs, encodeReply e o proxy reais, com transporte localhost, host público exacto e prova fictícia, confirmando que o corpo preservado passa a guarda Codespaces. Os casos existentes de falsificação e prova ausente permanecem exigidos. Não se enfraqueceu a guarda, a allowlist ou os cookies.

Os testes de navegador locais anteriormente aprovados usam CODESPACES vazio no simulador e, por isso, não exercitavam a perda da prova exigida no túnel. A regressão nova cobre esse intervalo sem tokens reais nem contacto com o Supabase. O estado remoto após o clique e qualquer novo ensaio pessoal de logout devem ser tratados separadamente; este documento não autoriza repetição automática, login adicional ou bootstrap.

O responsável comunicou que a leitura após o erro ainda mostra uma sessão Auth. Não foi apresentado um novo evento POST /logout correspondente ao clique. O logout real não está validado, e nenhum clique adicional foi executado pelo agente.

Validação da correcção da serialização: lint e TypeScript aprovados; 70 testes focados em quatro ficheiros aprovados; suite completa com 204 testes em 20 ficheiros aprovada (154,96 segundos). O teste de regressão falhou antes da alteração e passou depois. Build tentado mas bloqueado por Turbopack/CSS ao criar processo/abrir porta (Operation not permitted); Playwright focado tentado mas o webServer terminou antes dos casos (exit 1). Estes dois resultados não são aprovações da versão nova e requerem execução no Codespaces. Dependências, allowlist e migração original inalteradas.
