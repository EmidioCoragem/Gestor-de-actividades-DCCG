# Registar o painel sem alterar o Supabase

Objectivo: completar a baseline nao secreta do projecto de desenvolvimento.
Este guia nao autoriza migracao, testes de envio de email ou criacao de contas.
Os nomes das secoes podem variar conforme a versao do painel. Se nao encontrar
uma opcao, registe «nao encontrado» e o nome da secao; nao active nada para a ver.

O responsavel ja confirmou: projecto correcto, copia privada adicional do CSV,
signup publico e acessos anonimos desactivados, confirmacao de email obrigatoria
e autenticacao por email activa. Esses estados estao pre-preenchidos no modelo.

## 1. Preparar o ficheiro privado

Abra um editor de texto no seu computador. Copie
[modelo-registo-painel.txt](modelo-registo-painel.txt) e guarde-o como
`baseline-fase1-painel.txt` numa pasta privada, junto da copia do CSV. Preencha
apenas o que consegue observar. O modelo publico e vazio; o ficheiro preenchido
nao deve ser guardado no repositorio GitHub publico.

Navegue e leia os campos, sem clicar nos interruptores, digitar em formularios,
carregar em Save/Guardar, Send test email, Invite user, Add user, Reset, Rotate,
Reveal ou Upgrade. Evite abrir as areas API keys, Signing keys e Database password.
Se abrir acidentalmente um formulario, saia sem guardar; nao confirme mudancas.

## 2. Identificar o projecto

Seleccione o projecto novo de desenvolvimento. Em Project Settings / General
(ou a pagina equivalente), anote privadamente o nome, Project ID/Reference e plano
Free. A referencia do projecto nao e uma API key; nao copie uma connection string.
Acrescente data/hora e fuso. Nao altere o nome, plano ou configuracao.

## 3. Fornecedores e politica de email

Abra Authentication → Sign In / Providers (pode aparecer Providers). Veja os
nomes dos fornecedores activados e registe apenas esses nomes. Nao abra nem revele
client secrets de fornecedores. Abra o fornecedor Email apenas para ler as opcoes:
minimo/composicao da palavra-passe, confirmacao de email e confirmacao segura de
mudanca de email, se estiverem visiveis. Registe o valor actual, mesmo que pareca
diferente de uma recomendacao; esta fase e inventario, nao correcao de seguranca.

Os estados ja confirmados nao precisam de ser alterados ou testados por criacao
de contas. A [documentacao geral Auth](https://supabase.com/docs/guides/auth/general-configuration)
descreve as secoes do painel e a localizacao destas opcoes.

## 4. URLs

Em Authentication → URL Configuration, copie o valor actual de Site URL e cada
entrada de Redirect URLs para o registo privado. Se a lista estiver vazia, escreva
«lista vazia». Se Site URL ainda for localhost, registe exactamente esse valor.
Nao substitua por um endereco novo e nao adicione /auth/confirm nesta etapa.

Registe so os valores de configuracao, nunca um endereco de convite/recuperacao
recebido por email, que pode conter um token real. A
[documentacao de Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
explica a diferenca entre Site URL e lista de redireccionamentos.

## 5. SMTP e modelos

Em Authentication → Emails / Custom SMTP (ou SMTP Settings), veja se o SMTP
personalizado esta activado. Se nao, registe «desactivado; envio padrao Supabase».
Nao o active e nao contrate um fornecedor. Se ja estiver activo, registe
privadamente apenas fornecedor, host, porta e remetente visiveis. Nao copie nem
revele password, token, API key ou client secret. Credenciais existentes permanecem
no gestor seguro do operador; este registo nao tem de as conter.

Em Emails / Email Templates, consulte os modelos Invite user e Reset password /
Recovery. Registe se sao padrao ou personalizados. So escreva «padrao» se conseguir
confirmar; caso contrario «nao determinado». Se forem personalizados, guarde uma
copia privada do assunto e HTML estatico, sem pre-visualizacoes de mensagens reais.
Marcadores literais como {{ .TokenHash }} ou {{ .RedirectTo }} sao placeholders,
nao tokens reais; nao substitua esses marcadores nem copie links reais recebidos.
Se houver qualquer segredo incorporado, nao o copie para este registo e assinale
que o modelo requer revisao segura. Nao envie emails de teste nem guarde edicoes.

Sem SMTP personalizado, o envio padrao tem restricoes; isso sera tratado na
homologacao de emails, nao exige pagamento para recolher a baseline. Ver
[SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

## 6. Outras opcoes, apenas se visiveis

Em Sessions e Rate limits, registe os valores visiveis ou uma personalizacao que
saiba ter feito. Em Multi-Factor / Attack Protection / Auth Hooks / Third Party
Auth, registe estados e nomes, sem abrir segredos. Uma opcao paga pode ser marcada
«indisponivel no Free»; nao activar Upgrade. Nao suponha «padrao» se nao o conseguir
confirmar. Se nunca usou uma funcionalidade, pode registar «nao utilizado», mantendo
qualquer valor actualmente visivel. Em Edge Functions, registe apenas nomes ou
«nenhuma»; nao abra Secrets. Registe personalizacoes de Realtime/API/extensoes que
tenha efectuado; nao crie ou active nada para fazer este inventario.

## 7. Fechar e confirmar

Guarde apenas o ficheiro de texto no seu computador e uma segunda copia privada.
Nao e preciso guardar qualquer formulario no Supabase. Pode responder no chat:

```text
Registo privado do painel guardado e com copia adicional: sim/nao.
Nenhuma configuracao alterada durante a recolha: sim/nao.
Outros fornecedores activos: [nomes/nenhum/nao verificado].
SMTP personalizado: [activo/desactivado/nao verificado].
Modelos: [padrao/personalizados/nao determinado]; copias privadas se aplicavel.
Valores que nao consegui localizar: [lista/nenhum].
Alteracoes no projecto desde o CSV: [nenhuma/descrever sem segredos].
```

Nao precisa de enviar o ficheiro privado completo, referencias, emails pessoais,
URLs privadas ou capturas de ecras com segredos. Se faltar uma opcao, podemos rever
a lacuna sem alterar o projecto. Continua separadamente pendente a consulta de
leitura de privilegios do operador, descrita na analise da baseline real.
