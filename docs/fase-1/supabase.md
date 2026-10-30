# Configurar e homologar Supabase de desenvolvimento

Nenhum projecto, recurso de produção ou credencial foi criado/alterado por esta implementação. Faltam URL, chave pública e configurações Auth do projecto de desenvolvimento. Não enviar valores secretos no chat, nem colocar service_role em NEXT_PUBLIC_*.

## Configuração no navegador

1. Seleccionar ou criar um projecto Supabase **exclusivamente de desenvolvimento**. Confirmar que não é a base de dados de produção e que ainda não contém tabelas homónimas. Não aplicar esta migração a um projecto existente sem revisão.
2. No SQL Editor desse projecto, executar o conteúdo de supabase/migrations/202610300001_fase1.sql uma vez. É uma migração versionada transaccional, sem DROP ou dados empresariais fictícios. Se falhar, investigar a mensagem; não apagar tabelas nem ignorar RLS para forçar o resultado.
3. Em Auth, desactivar registo público e fornecedores não aprovados; manter correio electrónico/palavra-passe com confirmações, protecção de recuperação e limites de pedidos. Exigir pelo menos 12 caracteres na política de palavra-passe. Activar protecções adicionais disponibilizadas pelo plano e rever alertas de segurança.
4. Copiar as configurações públicas da API para NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no ambiente seguro do Codespace. A URL deve ser HTTPS.
5. Copiar a URL HTTPS **da porta privada 3000** para APP_ORIGIN, sem caminho. Em Auth, usar esta origem em Site URL e autorizar exactamente APP_ORIGIN/auth/confirm como endereço de redireccionamento. Não usar wildcards globais. Uma mudança de Codespace exige actualizar estas URLs.
6. Configurar SMTP de desenvolvimento ou verificar as restrições de entrega do fornecedor. Configurar os modelos de convite e recuperação com os ficheiros supabase/templates/invite.html e recovery.html: usam token_hash, type e RedirectTo apontando para /auth/confirm. Não usar confirmação automática de contas públicas.
7. Se for preciso enviar convites pela aplicação, configurar SUPABASE_SERVICE_ROLE_KEY apenas no servidor, através das definições seguras. Não é necessária para entrar/consultar com uma conta já preparada. A aplicação não usa esta chave para ignorar RLS nas consultas/mutações empresariais.
8. Após criar/alterar segredos nas definições do GitHub Codespaces, parar e reiniciar o Codespace para injectar os novos valores. Se usar .env.local (ignorado pelo Git), reiniciar npm run dev após alterar variáveis; para build de produção/revisão, recompilar após alterar NEXT_PUBLIC_*. Não publicar nesta fase. Se o ambiente Cloud recusar o domínio, autorizar apenas o hostname exacto do projecto nas definições de rede existentes.

.env.example tem somente nomes e campos vazios. Não copiar ficheiros .env para Git. A porta continua Private e exige a sessão GitHub do proprietário; esta autenticação da porta é independente da autenticação funcional Supabase. Para testar várias contas, usar contas de teste autorizadas num projecto de desenvolvimento e o navegador autorizado a abrir o Codespace, sem expor a porta.

## Primeiro responsável de acessos — operação de bootstrap controlada

Não existe uma conta pré-criada nem atribuição administrativa automática. O operador autorizado do projecto deve criar/convidar a primeira conta **depois** da migração (as já existentes recebem perfil inactivo na migração) e confirmar o UUID em Authentication → Users.

No SQL Editor do projecto de desenvolvimento, o operador poderá, após aprovação do responsável, executar uma transacção adaptada ao UUID real:

```sql
begin;
-- Substituir o identificador abaixo pelo UUID real, não por uma palavra-passe.
update public.profiles set status='active' where id='<UUID-DA-CONTA-AUTORIZADA>'::uuid;
insert into public.roles(code,name) values('organization_admin','Responsável de organização');
insert into public.role_permissions(role_code,permission_code) values
 ('organization_admin','org.read'),('organization_admin','org.manage');
insert into public.user_role_assignments(user_id,role_code,granted_by) values
 ('<UUID-DA-CONTA-AUTORIZADA>'::uuid,'access_admin',null),
 ('<UUID-DA-CONTA-AUTORIZADA>'::uuid,'organization_admin',null);
-- Só se esta pessoa também estiver explicitamente autorizada a gerir contas/convites:
-- insert into public.user_role_assignments(user_id,role_code) values ('<UUID-DA-CONTA-AUTORIZADA>'::uuid,'technical_admin');
commit;
```

Este exemplo **não foi executado** nem faz parte da migração automática. A mudança de privilégios é feita pelo operador SQL autorizado, fora da identidade da aplicação; os triggers preservam o evento (actor SQL sem auth.uid pode ficar null). Preservar também o registo operacional do responsável que realizou o bootstrap. A aplicação proíbe a auto-atribuição de perfis.

O responsável poderá criar a empresa, unidades e cargos; convidar e activar outras contas conforme a autorização; atribuir perfis e âmbitos a terceiros. Não consegue alterar o seu próprio perfil pela UI. Um âmbito vazio significa global e só pode ser concedido por access.manage global.

## Homologação ainda pendente nesta máquina

- Entrada correcta, palavra-passe errada e mensagens genéricas; logout invalida a navegação privada.
- Renovação de sessão e expiração de cookies com acesso pelo Codespaces.
- Registo público rejeitado directamente pela API Auth, não apenas ausência de botão.
- Convite real entregue pelo SMTP, ligação verificada, definição de palavra-passe, conta inicialmente inactiva e activação autorizada.
- Recuperação real: mensagem genérica para e-mail existente/inexistente, ligação expirada/alterada recusada, palavra-passe actualizada e sessão terminada.
- Duas unidades e contas de teste com papéis distintos: via UI **e chamadas directas à API PostgREST**, confirmar isolamento, restrição de actualizações, rejeição de auto-elevação e ausência de dados funcionais para administrador técnico.
- Suspender uma conta durante sessão: a próxima operação deve ser recusada no servidor/RLS.
- Transferir um trabalhador, trocar chefia, expirar/revogar perfil e confirmar histórico, actor e âmbito.
- Validar a migração, tipos, permissões de execução de funções, relatórios de segurança do Supabase e comportamento das políticas no projecto real.

Não marcar estes testes como aprovados com base em mocks ou nos testes SQL isolados. Esta implementação mantém o acesso bloqueado até existir configuração válida e conta activa. A Fase 2 continua dependente de autorização.
