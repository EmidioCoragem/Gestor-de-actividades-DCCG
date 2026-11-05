# Etapa C — Homologação funcional e de segurança

Estado actualizado em 5 de Novembro de 2026: homologação parcial. O subcaso [AUTH-02-AT-LOGOUT-01](relatorio-homologacao-at.md) está APTO, com código d0d8b90 e evidências reais fornecidas pelo responsável. O restante grupo AUTH-02 e os outros cenários mantêm as pendências registadas no CSV. A base inicial deste plano foi o commit 150f1c3 na branch fase-1-autenticacao-permissoes; as 67 aprovações iniciais são históricas e não homologam os novos mecanismos.

## Âmbito e salvaguardas

Usar exclusivamente o projecto Supabase de desenvolvimento confirmado, dados fictícios e endereços de email controlados pelo responsável. Não usar dados empresariais. Não executar novamente a migração. Não publicar, fazer merge na main, contratar recursos pagos ou alterar Auth/SMTP. A identidade azul-escuro e os contratos de Centros de Custo, SAP e Primavera mantêm-se; estes mecanismos não alteram a interface ou esses contratos.

A migração original mantém o SHA-256 56a4f959ba552e473bc1161bc8c529ae7a1a51574221ed4c0ae8c36a322a3e58. O executor local verifica este valor antes de usar uma cópia em memória. A validação remota aceite documenta 16 tabelas com RLS e 13 políticas; não representa homologação com sessões reais.

## Identidades fictícias

| Alias | Perfil | Permissões propostas | Âmbito |
|---|---|---|---|
| AT | Administrador técnico | technical_admin: users.read e users.manage | Global |
| AF | Administrador funcional | access_admin e papel explícito c_org_admin: org.read e org.manage | Global |
| DIR | Direcção | director | Empresa fictícia |
| GA | Chefia A | manager; c_cost_reader apenas para ensaio dos Centros de Custo | Departamento A |
| GB | Chefia B | manager; c_cost_reader apenas para ensaio dos Centros de Custo | Departamento B |
| CA | Colaborador A | technician | Departamento A |
| CB | Colaborador B | technician | Departamento B |
| EST | Conta para estados e recuperação | Sem papel inicialmente | Departamento A |

O cargo organizacional não concede permissões automaticamente. O papel access_admin não concede org.manage; por isso c_org_admin é explícito. AF não recebe users.manage nem permissões de actividade. AT não recebe access.manage, org.manage ou privilégios de negócio. O operador SQL continua a ser uma identidade privilegiada de manutenção, fora destes perfis, e nunca simula um utilizador normal.

## Organização e dados

Criar, apenas depois de autorização, Empresa Fictícia C, Departamento Fictício A, Departamento Fictício B e Secção Fictícia A1 subordinada a A. Associar cargos e utilizadores aos respectivos âmbitos. Usar dois Centros de Custo fictícios opcionais, 000C-A e 000C-B, conservando os códigos como texto. Não ligar SAP/Primavera ou executar importações.

O plano de controlo positivo é obrigatório: confirmar previamente que A, B e respectivos objectos existem e são visíveis ao perfil autorizado. Uma resposta vazia para uma entidade inexistente não comprova isolamento.

## Bootstrap futuro, sujeito a autorização

Para o próximo bloco prevalece o [plano controlado AT/AF](bootstrap-at-af.md), incluindo a condição prévia de segregação identificada na RPC. Nenhuma escrita está autorizada. AT já existe e está inactive/zero papéis/zero sessões após o caso aprovado.

1. Confirmar o projecto de desenvolvimento, os inventários e a cópia privada de configurações. Definir manifest privado de aliases, emails, UUID reais e identificador da execução. Os UUID locais não são UUID remotos.
2. Reutilizar AT existente, sem recriar. Inventariar AF; apenas se ausente e depois de autorização separada, criar AF por mecanismo suportado do Supabase. Registar confirmação de email e estado do perfil separadamente. Não inserir directamente em auth.users nem desactivar confirmação de email.
3. Por operação de manutenção aprovada, atribuir exclusivamente technical_admin global a AT, activar o seu perfil e registar operador, hora e UUID. A criação da conta Auth não equivale a atribuição de poder funcional.
4. Por operação de manutenção aprovada, activar AF e atribuir access_admin mais c_org_admin global. Não utilizar auto-atribuição pela aplicação, contornar guardas RPC ou conceder technical_admin a AF.
5. Terminar o bootstrap privilegiado. AT gere convites e estados de contas; AF configura a organização e atribui papéis funcionais dos outros utilizadores. AF não modifica o seu próprio papel. Qualquer alteração posterior dos papéis do próprio AF exige manutenção autorizada e rastreável.
6. Validar AT e AF com sessões próprias na aplicação e PostgREST. Eventos de manutenção sem auth.uid podem apresentar actor nulo; conservar a evidência privada do operador em vez de falsificar um actor.

O bootstrap é uma excepção explícita de manutenção. Nenhum dos oito perfis deve usar postgres ou service_role para provar permissões normais.

## Matriz de homologação real

| Grupo | Acções e resultado exigido |
|---|---|
| AUTH-01 | Login correcto e incorrecto; mensagens sem enumeração indevida; palavra-passe fictícia conforme política; nenhum segredo na evidência. |
| AUTH-02 | Logout e limpeza da sessão no navegador; refresh token revogado conforme âmbito de logout; verificar outro separador/dispositivo. Um JWT já emitido pode continuar válido até expirar: não exigir invalidação instantânea do access token nem reduzir a segurança para acelerar o ensaio. |
| AUTH-03 | Expiração e renovação de sessão, recarregamento de página, acesso directo a rotas e estado sem sessão. Esperar os tempos configurados. |
| AUTH-04 | Conta nova/inactiva e conta suspensa sem permissões funcionais, incluindo um JWT anterior à suspensão. A leitura mínima do próprio perfil pode continuar permitida. |
| AUTH-05 | Conta activa sem papéis: zero capacidades funcionais; um painel vazio pode ser válido e não significa acesso aos módulos. |
| EMAIL-01 | Convite feito por AT através da aplicação, auditoria requested/sent/failed coerente, aceitação, confirmação e criação da sessão. Evitar que todas as contas sejam criadas só pelo painel, pois isso não ensaia o convite da aplicação. |
| EMAIL-02 | Recuperação de acesso com endereço controlado, resposta sem enumeração, ligação válida/expirada/reutilizada, nova palavra-passe e sessões conforme comportamento documentado. Não guardar ligações de recuperação. |
| RLS-01 | GA vê A e A1, GB vê B; GA/GB não vêem perfis e Centros de Custo do departamento oposto. CA e CB têm apenas o âmbito mínimo previsto. |
| RLS-02 | DIR vê os dois departamentos por descendência; o título de direcção não concede gestão técnica ou de acessos. |
| RPC-01 | AT não concede director; AF não se auto-atribui director nem altera permissões do seu próprio papel; colaborador não se promove. |
| RPC-02 | Escritas directas em tabelas negadas; helpers internos sem acesso RPC; anónimo sem leitura indevida. Confirmar ausência de efeitos, além do código de erro. |
| ORG-01 | Hierarquia válida, ciclos recusados e reparenting que afectaria âmbito do próprio actor recusado. Relações de chefia e cargos não criam poderes implicitamente. |
| ORG-02 | Transferência controlada: suspender, mudar colocação, rever/revogar concessões antigas, conceder novo âmbito, verificar e reactivar. Mudar a colocação não revoga papéis automaticamente. |
| PERM-01 | Concessão expirada ou revogada sem poder; conferir valid_from/valid_until e linhas efectivamente afectadas, sobretudo concessões futuras. Sucesso RPC sem alteração não comprova revogação. |
| DEL-01 | Uma delegação registada não deve criar poderes inesperados. A Fase 1 não implementa concessão efectiva por delegação; não declarar um fluxo funcional completo de delegações aprovado. |
| AUD-01 | Mutação autorizada produz actor, operação, entidade, valores antes/depois e hora coerentes. Leitura de auditoria apenas autorizada; escritas directas e remoção negadas. |
| UI-01 | Computador, tablet e telemóvel: estados de erro e sessão, menu coerente e azul-escuro preservado. A interface não substitui a validação de permissões na base de dados. |

Executar os cenários aplicáveis na aplicação e directamente em PostgREST. Utilizar apikey publicável e JWT normal do próprio alias. A chave publicável não é uma chave privilegiada. Não usar service_role nem JWT de outro utilizador como substituto de login.

No convite, a aplicação pode precisar de credencial de servidor para a API Auth Admin; isto é distinto de simular acessos de dados. A sua disponibilização/configuração exige autorização própria, fica exclusivamente no servidor e nunca integra o manifesto, browser ou evidência. Não foi configurada nesta preparação.

Para negações, aceitar apenas o erro esperado: por exemplo 42501 de privilégio ou P0001 da guarda RPC. Um erro de sintaxe, chave estrangeira, UUID inválido ou chave duplicada não comprova segurança. Algumas funções privadas podem produzir 403 ou 404 conforme exposição/cache PostgREST; conferir o código e a ausência de efeitos.

## Correio no plano gratuito

O SMTP integrado tem limite actual de dois emails por hora e restrições de destinatários. Confirmar a elegibilidade dos endereços antes de criar oito contas. O SMTP predefinido pode limitar entregas aos membros da organização; não adicionar membros nem contratar SMTP apenas para contornar esta limitação sem decisão expressa.

Manter um livro de envios privado que conte convites, recuperação, reenvios e notificações aplicáveis a todo o projecto. Usar janelas com margem superior a 60 minutos e considerar envios de outros operadores. Oito convites exigem pelo menos quatro janelas se os destinatários forem elegíveis e não houver outros emails; recuperação exige janelas adicionais. Ao obter 429, parar e não repetir automaticamente.

Se for autorizada preparação suportada de contas sem envio, isso permite ensaiar RLS, mas não aprova convites, confirmação ou recuperação por email. Estes ficam pendentes. Não desligar confirmação de email, aumentar permissões ou alterar SMTP para obter uma aprovação artificial. Site URL localhost:3000 sem Redirect URLs adicionais exige execução nesse endereço; qualquer mudança é uma operação separada a autorizar.

Referências: https://supabase.com/docs/guides/auth/auth-smtp ; https://supabase.com/docs/guides/auth/rate-limits ; https://supabase.com/docs/guides/auth/signout .

## Mecanismos locais preparados

- scripts/etapa-c/fixture.mjs: base PGlite sempre em memória, oito identidades locais e dois departamentos. Reaplica apenas a cópia da migração nesse ambiente descartável, verificando SHA-256.
- scripts/etapa-c/cases.mjs e runner.mjs: 32 cenários SQL, identidade local por papel e claim simulado; cada cenário corre em transacção com ROLLBACK e comparação de conteúdo das 16 tabelas antes/depois.
- scripts/etapa-c/run-local.mjs: comando node scripts/etapa-c/run-local.mjs, sem URL, credenciais, variáveis Supabase ou cliente HTTP.
- tests/unit/etapa-c-local.test.ts: integração dos 32 cenários numa suite Vitest.
- docs/fase-1/etapa-c/postgrest-pedidos.json: 20 descritores de pedidos; não é um executor. UUID e JWT são placeholders privados.
- scripts/etapa-c/request-contract.mjs e testes: validam descritores e observações sanitizadas; exigem controlos positivos, erro correcto, pré-condições e ausência de efeitos.

PGlite não reproduz Auth, SMTP, cookies, assinatura/expiração JWT, PostgREST, extensões Supabase ou toda a configuração remota. O claim local não é uma sessão autenticada. Os testes locais são preparação e não homologação real.

Validação prevista quando o ambiente estiver disponível: npm ci, npm run lint, npm run typecheck, npm test e node scripts/etapa-c/run-local.mjs. Confirmar scripts reais do package.json antes de executar. Não alterar package.json/package-lock.json nem introduzir dependências apenas para estes ensaios. Build e navegador podem ser repetidos se necessário para a integração posterior; não presumir aprovação com base na execução histórica.

O ambiente voltou a estar disponível durante a preparação. Os 32 cenários SQL locais passaram e a suite Vitest completa passou com 72 testes, incluindo a integração desses cenários e quatro testes do contrato PostgREST. ESLint e TypeScript também passaram. Build e navegador foram tentados, mas ficaram bloqueados por restrições do ambiente ao iniciar processos/abrir portas; não se alteraram configurações de segurança. Ver verificacao-local.md. Nenhum teste Auth/PostgREST remoto foi executado.

## Evidências e aprovação

Usar o modelo evidencias.csv, mantendo resultados remotos PENDENTE até execução. Registar versão do código, hash da migração, alias, âmbito, pré-condições, hora UTC/Luanda, resultado esperado/observado, código HTTP/SQLSTATE quando aplicável e confirmação da ausência/presença dos efeitos previstos. Guardar capturas sanitizadas e extratos de auditoria. O manifesto privado relaciona aliases com UUID reais e emails.

Não incluir passwords, JWT, refresh tokens, cookies, chaves, cabeçalhos de autenticação, links de convite/recuperação ou HAR bruto. Não carregar segredos no GitHub. Falhas imprevistas interrompem o cenário e exigem análise antes de repetir.

Aprovação exige os cenários obrigatórios de Auth, RLS, RPC, organização e auditoria com controlos positivos e negativos, ausência de auto-elevação/acesso cruzado, evidência revista e riscos registados. Fluxos de correio bloqueados significam homologação parcial, não conclusão total da Fase 1. Funcionalidades de actividade da Fase 2 não são declaradas implementadas com base em has_permission.

## Limpeza autorizada separadamente

Guardar as evidências e uma baseline actualizada antes da limpeza. A baseline vazia anterior à migração não recupera os novos utilizadores e dados. Identificar tudo pelo manifesto exacto da execução, sem selecções amplas por texto livre.

Preferir revogar concessões de teste, suspender contas e inactivar unidades/Centros de Custo fictícios, preservando auditoria, históricos e integridade referencial. Confirmar que concessões futuras também foram tratadas. A limpeza final de AT/AF pode requerer operação de manutenção aprovada porque a auto-alteração é bloqueada.

Não apagar contas Auth sem analisar as referências de profiles e auditoria. Remoção física, cascatas, eliminação de auditoria, DROP, rollback estrutural ou recriação do projecto ficam fora da limpeza normal e exigem plano e autorização próprios. Não desactivar guardas para facilitar limpeza.

## Autorizações necessárias para começar

C1 — Criar as oito contas fictícias com destinatários/forma de criação aprovados e orçamento de emails definido.
C2 — Executar bootstrap mínimo AT/AF, criar organização/cargos/atribuições e, se aprovados, os dois Centros de Custo e concessões temporárias de cenário.
C3 — Iniciar sessões e executar ensaios reais pela aplicação e PostgREST, incluindo mutações expressamente identificadas: suspensão/reactivação, alterações de âmbito, concessões/revogações, delegação e auditoria.
C4 — Enviar convites/recuperações dentro das janelas autorizadas e, se necessário, disponibilizar credencial apenas no servidor para Auth Admin. Alterações Auth, SMTP, URLs ou modelos exigem aprovação específica adicional.
C5 — Executar a limpeza identificada e preservar a auditoria.

Nenhuma destas autorizações está implícita na aprovação deste plano. Publicação, merge na main e recursos pagos continuam excluídos.
