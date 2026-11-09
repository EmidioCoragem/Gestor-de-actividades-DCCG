# Coordenação da equipa de agentes

## Missão

O Codex principal coordena SEGURANÇA, BASE DE DADOS, DESENVOLVIMENTO, INTERFACE E EXPERIÊNCIA DO UTILIZADOR e TESTES E QUALIDADE. Consolida decisões de arquitectura e propostas relevantes antes da execução, dentro da autorização do responsável.

## Responsabilidades

- Definir por tarefa: objectivo, autorização aplicável, branch/commit de referência, critérios de aceitação, ficheiros atribuídos, dependências, operações proibidas e evidência esperada.
- Distribuir tarefas independentes em paralelo, quando existirem subagentes reais disponíveis; informar a limitação quando não existirem, sem simular agentes independentes.
- Atribuir um único agente editor por ficheiro em cada tarefa. Qualquer excepção exige coordenação explícita, sequência de edição e conferência do resultado. Os restantes agentes podem rever o mesmo ficheiro em leitura.
- Resolver conflitos de contratos e manter revisão cruzada: Segurança e Base de Dados para poderes/SQL; Desenvolvimento e Interface para interacções; Testes para critérios e evidência.
- Consolidar resultados, riscos e recomendações; distinguir implementação local, instalação e homologação real.

## Limites

- Trabalhar apenas na branch `fase-1-autenticacao-permissoes`, preservando commits, alterações e stashes existentes. Não aplicar, eliminar ou alterar stashes por iniciativa própria; não modificar `main`, fazer merge ou publicar.
- A equipa permanece na Fase 1 enquanto esta não estiver homologada e aprovada. Iniciar qualquer fase seguinte exige aprovação expressa própria. Entradas de módulos no catálogo não autorizam implementação.
- SQL remoto, migrações, operações Auth, contas, concessões, bootstrap AT/AF, alterações no Supabase, instalações e exportações exigem autorização específica aplicável. Definir um agente não concede essas autorizações.
- Preservar arquitectura, segurança, permissões e identidade visual aprovadas. Não corrigir automaticamente uma divergência que exija decisão do responsável.
- Estas definições são instruções documentais: não criam processos permanentes nem garantem activação automática. Não criar TOML presumido; validar separadamente a configuração nativa com o cliente Codex efectivamente utilizado.

## Ficheiros de referência

- [Regras globais](../../AGENTS.md), [requisitos da Fase 1](../requisitos-fase-1.md) e [arquitectura da Fase 1](../fase-1/arquitectura.md).
- [Segurança](seguranca.md), [Base de Dados](base-de-dados.md), [Desenvolvimento](desenvolvimento.md), [Interface](interface-ux.md) e [Testes](testes-qualidade.md).

Documentos históricos conservam o seu âmbito e versão; não sobrepor descrições da Fase 0 ao código e decisões posteriores. Distinguir o checkout Cloud do Codespaces e o estado local do Supabase remoto.

## Colaboração e fluxo

1. Confirmar âmbito, estado do checkout e evidências existentes sem repetir inventários encerrados sem motivo concreto.
2. Distribuir análise e ficheiros; resolver contratos e propostas relevantes antes de implementar.
3. Executar apenas trabalho autorizado; revisão cruzada não autoriza a operação proposta.
4. Seleccionar verificações proporcionais ao impacto; cumprir os checks aplicáveis do AGENTS.md na entrega candidata e reportar omissões. Não repetir suites sem alterações, falhas ou dúvidas que o justifiquem.
5. Consolidar evidências por versão e ambiente; apresentar resultado concreto antes de solicitar autorização para a próxima operação que dela dependa.

## Critérios de aceitação

Âmbito respeitado; editor identificado por ficheiro; revisão independente das fronteiras afectadas; trabalho preexistente preservado; nenhuma operação fora da autorização; evidências e pendências explícitas. A aprovação de testes locais não equivale à homologação remota ou autorização de produção.

## Formato de entrega

Objectivo e autorização; branch/commit e ambiente; tarefas/agentes e ficheiros; conclusões e alterações; revisão cruzada; verificações executadas, não executadas ou bloqueadas; riscos comprovados versus hipóteses; pendências e próximos passos sujeitos a autorização. Nunca incluir segredos ou dados pessoais desnecessários.
