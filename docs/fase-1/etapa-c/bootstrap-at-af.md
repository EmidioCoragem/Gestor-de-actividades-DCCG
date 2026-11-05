# Próximo bloco — bootstrap controlado AT/AF

**PLANO NÃO EXECUTADO.** Preparado em 5 de Novembro de 2026, exclusivamente na branch fase-1-autenticacao-permissoes. A autorização vigente permite apenas documentação. Não permite criar AF, activar AT/AF, atribuir papéis, executar SQL de escrita, migrações, convites, bootstrap, publicação ou merge.

O [logout real de AT está APTO](relatorio-homologacao-at.md). A última leitura mantém AT com conta/email confirmado, perfil inactive, zero papéis e zero sessões. Não duplicar nem recriar AT. A existência e preparação de AF precisam de inventário de leitura antes de qualquer proposta de criação.

## Matriz mínima proposta, ainda sem concessões

| Identidade | Concessões propostas | Capacidades próprias esperadas | Limites exigidos |
|---|---|---|---|
| AT — administrador técnico | technical_admin global, perfil active apenas após autorização | users.read; users.manage | Sem access.manage, org.manage ou papéis de negócio; não concede o próprio acesso funcional |
| AF — administrador funcional | access_admin e c_org_admin globais, perfil active apenas após autorização | access.manage; users.read; org.read; audit.read; org.manage | Sem technical_admin, users.manage ou papéis de negócio; sem alteração dos próprios papéis/capacidades; sem concessão técnica indirecta |
| Operador de manutenção | Identidade privilegiada externa à sessão normal da aplicação | Executa exclusivamente o lote de bootstrap revisto e aprovado | Não é a sessão AT/AF; não prova RLS com postgres/service_role; não falsifica auth.uid |

c_org_admin deve conter exactamente org.read e org.manage. O access_admin actual já contém access.manage, users.read, org.read e audit.read. Não modificar esse papel de sistema para acrescentar org.manage. Cargo organizacional não concede permissões. Identidades e responsáveis AT/AF devem ser distintos e aprovados, sem partilha de credenciais ou acumulação dos dois conjuntos de poderes na mesma conta.

## Condição prévia: verificar a segregação efectiva

A revisão estática da migração original, public.admin_mutation, mostra que grant_role exige access.manage e impede o alvo igual ao actor, mas aceita role_code de terceiros sem excluir technical_admin. role_permission impede alterar um papel actualmente detido pelo actor, mas não protege, por categoria, os papéis/capacidades técnicos de outros utilizadores. A validação TypeScript também não contém essa exclusão. O campo technical do catálogo não é usado nesses ramos como barreira de autorização.

Portanto, ausência de users.manage nos papéis iniciais de AF não demonstra, por si só, que AF não consiga atribuir poder técnico a terceiros ou modificar um papel técnico. Não se apresenta isso como uma operação remota executada: é uma propriedade observada no código. A protecção contra auto-atribuição existe, mas não equivale à segregação forte exigida para este bloco.

**Não executar o bootstrap enquanto esta condição estiver por resolver.** Primeiro definir e aprovar a política de papéis reservados, combinações incompatíveis e competências do operador. Demonstrar em testes isolados que AF não concede technical_admin, não introduz users.manage num papel funcional, não modifica as capacidades técnicas de AT nem concede a AT os poderes funcionais proibidos. Confirmar também que AT não concede/revoga papéis ou modifica as próprias capacidades e que AF não altera os próprios papéis.

Uma eventual correcção de servidor/RPC exige autorização própria para código e testes. Uma eventual alteração SQL incremental exige aprovação adicional; nunca editar/reaplicar a migração original para este fim. Ocultar opções da UI, uma proibição documental ou a promessa de não usar a RPC não substituem a recusa no servidor/banco. Não usar escritas remotas de ensaio para descobrir esta condição.

Os testes isolados devem incluir um terceiro alvo activo e um papel ainda não detido, além de uma concessão funcional permitida como controlo positivo. Uma recusa por duplicado, alvo inexistente ou sessão inválida não comprova a barreira de segregação pretendida. Conferir a ausência de efeitos, não apenas a mensagem de erro.

## Implementação local de segurança — instalação e bootstrap pendentes

A [auditoria AT/AF de 5 de Novembro](revisao-segregacao-at-af.md) reproduz localmente os caminhos de concessão/revogação técnica e clonagem de capacidades e prepara um protótipo SQL fora da pasta de migrações, com testes adversariais e controlos positivos. Não foi alterada a migração original nem instalado qualquer SQL no Supabase. O bootstrap permanece bloqueado: primeiro aprovar a política, completar a validação PostgreSQL/ACLs e a guarda de servidor proposta, depois autorizar separadamente a migração incremental e os lotes de manutenção.

A [implementação local autorizada](implementacao-segregacao-at-af.md) acrescenta uma migração incremental e guarda na Server Action. A conclusão dos testes locais não autoriza instalação, activações ou concessões reais. Consultar esse relatório para os resultados actuais e riscos residuais.

A manutenção técnica proposta exige identidade SQL nominal, pertença temporária a papel NOLOGIN externo à API, ausência de JWT e referências de mudança/aprovação reconciliadas com registo privado independente. Não usar access.manage, sessão AT/AF, chave de serviço ou auth.uid fictício como substitutos dessa autorização. Isto é uma proposta para decisão, não uma autorização de execução.

## Sequência proposta e autorizações necessárias

1. **Inventário de leitura:** reconfirmar projecto de desenvolvimento, branch/versão, porta Private, diagnóstico desligado, estado AT e ausência de concessões inesperadas. Inventariar AF sem criar conta; conferir o catálogo real e as capacidades/concessões directas e indirectas. Reconciliar o catálogo remoto com o código revisto, sem executar chamadas mutadoras.
2. **Revisão técnica da segregação:** resolver a condição acima em âmbito autorizado separado, com evidências positivas e negativas. Se a política ou o código não satisfizerem a separação aprovada, parar antes de qualquer activação.
3. **Preparação AF, somente se autorizada:** se não existir, obter autorização separada para uma conta e para qualquer convite/email necessário, com destinatário e orçamento aprovados. Usar mecanismo suportado do fornecedor, sem INSERT em auth.users ou auto-confirmação. A conta deve começar inactive e sem papéis. Confirmar a titularidade e o email; credenciais são definidas pessoalmente. Se já existir, não duplicar; confirmar se está dentro do âmbito autorizado.
4. **Proposta concreta de manutenção:** preparar para revisão duas transacções delimitadas, uma AT e outra AF, com pré-condições, linhas exactas esperadas, âmbito/vigência, verificações finais, auditoria e critérios de ROLLBACK antes do COMMIT. Não incluir novas unidades, Centros de Custo ou contas adicionais. Não executar com base apenas na aprovação deste plano.
5. **Autorização de escrita específica:** identificar privadamente contas, operador e aprovadores, versão revista e concessões exactas. Autorizar separadamente activação AT, activação AF, atribuições e eventual criação do papel c_org_admin. Se esse papel já existir com capacidades diferentes, parar em vez de o alterar automaticamente.
6. **Bootstrap aprovado:** operador de manutenção aplica só technical_admin a AT e só access_admin+c_org_admin a AF, nos âmbitos aprovados. Sem auto-atribuição pela aplicação, troca de identidade do actor ou bypass de guardas. Cada lote deve ser atómico. Falha num lote interrompe o processo; um lote já confirmado não é desfeito automaticamente nem se declara bootstrap completo com estado parcial.
7. **Verificação posterior por leitura:** confirmar contagens, estados, concessões e permissões efectivas exactas da matriz, ausência de acumulação, auditoria e preservação da conta existente. Conservar no registo privado a identidade real do operador/aprovadores e os alvos. O trigger de uma operação SQL sem auth.uid pode registar actor nulo; não inventar um actor para o preencher.
8. **Homologação com identidades próprias, após autorização:** titulares efectuam pessoalmente os acessos AT e AF, sem service_role no navegador. Verificar controlos positivos e negativos na aplicação e na API, com dados sintéticos mínimos e mutações identificadas aprovadas separadamente. Não usar o SQL Editor privilegiado como prova de RLS de um utilizador comum.

A preparação de AF não deve ser obtida à custa de novos poderes de AT ou da introdução de uma chave administrativa por conveniência. O convite pela aplicação exige configuração administrativa servidor que não está implicitamente autorizada; se faltar, parar e apresentar um método suportado para decisão. Não alterar Auth/SMTP/URLs/modelos, adicionar membros à organização ou relaxar confirmações para contornar limitações de email.

## Critérios de aprovação e paragem

O bloco só poderá ser APTO com a matriz exacta observada, segregação demonstrada por testes e verificações reais autorizadas, auditoria reconciliada, ausência de efeitos fora do lote e contas distintas sob controlo dos titulares. O sucesso do logout AT não concede esses poderes.

Parar se houver conflito de identidades, conta duplicada, papel/capacidade inesperado, possível auto-elevação ou cruzamento técnico/funcional, diferença entre código e catálogo remoto, falta de auditoria reconciliável, erro/timeout ou resultado ambíguo. Não repetir a escrita, conceder permissões adicionais ou alterar RLS para obter sucesso. Qualquer compensação após COMMIT exige plano e autorização próprios, sem apagar contas ou auditoria.

Evidência pública: aliases AT/AF, versões, capacidades/âmbitos, contagens, resultados sanitizados e referência ao registo privado. UUID, nomes, emails, credenciais, tokens/cookies e capturas não sanitizadas ficam fora do Git. Recursos pagos, Fase 2, publicação e merge na main continuam fora do âmbito.
