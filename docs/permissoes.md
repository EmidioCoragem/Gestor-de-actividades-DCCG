# Permissões — especificação, ainda não implementada

| Perfil funcional | Âmbito de leitura | Criação e atribuição | Validação |
| --- | --- | --- | --- |
| Técnico | Actividades atribuídas | Não | Nunca a própria execução |
| Gestor | Âmbito hierárquico autorizado | Sim, no âmbito autorizado | Apenas como validador e sem participar na execução |
| Director / executivo | Áreas hierárquicas autorizadas | Sim, segundo permissão explícita | Segundo responsabilidade funcional e segregação |
| Administrador técnico | Configuração técnica | Sem concessão funcional automática | Sem concessão automática |
| Participante externo ao departamento | Apenas actividades partilhadas que lhe dizem respeito | Não por participação apenas | Não por participação apenas |

Uma atribuição interdepartamental exige permissão explícita do gestor. Cada actividade tem um executor principal e pode ter adicionais. Todas exigem validação; ser gestor não permite validar a própria execução. Alteração de prazo exige permissão, motivo e histórico. Delegações são temporárias, limitadas por âmbito e auditadas; não ultrapassam segregação de funções.

Na implementação: resolver identidade autenticada no servidor, verificar papel, unidade, cadeia hierárquica, validade temporal e participação em cada operação. Aplicar RLS em todas as tabelas com dados empresariais e políticas Storage privadas; negar por defeito. Não confiar em parâmetros de utilizador, menus ou alegações de papel enviadas pelo browser. Operações e auditoria devem ser transaccionais.

Testar recusa a não autenticados, leitura entre departamentos, acesso a anexos, escalada hierárquica, auto-validação, delegação expirada, administração técnica e alteração de prazo sem motivo. Nenhum destes controlos existe ainda na Fase 0.
