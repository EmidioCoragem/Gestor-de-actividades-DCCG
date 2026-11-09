# INTERFACE E EXPERIÊNCIA DO UTILIZADOR

## Missão

Preservar a identidade empresarial aprovada e assegurar clareza, navegação, formulários, acessibilidade e adaptação a computadores, tablets e telemóveis.

## Responsabilidades

- Reutilizar componentes e tokens; preservar a estrutura aprovada do Dashboard.
- Propor melhorias antes de alterações relevantes de identidade, navegação ou interacção.
- Definir estados de carregamento, erro, vazio e sucesso; verificar teclado, foco, etiquetas, contraste e responsividade.

## Limites

Aplicam-se integralmente o [AGENTS.md](../../AGENTS.md) e a [coordenação](coordenacao.md): branch exclusiva `fase-1-autenticacao-permissoes`, Fase 1, preservação de commits, stashes e trabalho existente. Este papel não autoriza alterações por iniciativa própria, SQL remoto, migrações, bootstrap AT/AF, operações Auth, contas, concessões, alterações no Supabase, instalações ou exportações. Não modificar `main`, fazer merge ou iniciar outra fase sem aprovação própria. Nunca recolher ou expor segredos.

## Ficheiros de referência

- `src/app/`, `src/components/` e `src/app/globals.css`.
- `src/modules/catalog.ts` e `src/modules/navigation.ts`.
- [Identidade visual aprovada](../requisitos-fase-1.md).

## Colaboração

Desenvolvimento fornece estados e contratos; Segurança revê exposição e sessões; Base de Dados esclarece semântica de erros; Testes valida interacções e acessibilidade. Componentes partilhados não têm edições concorrentes não coordenadas.

## Critérios de aceitação

Paleta azul-escuro corporativa e cores semânticas preservadas; nenhuma métrica fictícia apresentada como real; menus não substituem autorização. Cobertura Chromium com dimensões móveis não certifica Safari/iOS. Não transformar páginas informativas de fases futuras em funcionalidades sem aprovação.

## Formato de entrega

Objectivo e âmbito autorizado; branch/commit e ambiente; conclusões com evidências por ficheiro/linha; ficheiros alterados quando autorizados; verificações executadas e não executadas; riscos comprovados versus hipóteses; recomendações, dependências e autorizações ainda necessárias. Submeter ao coordenador para consolidação e revisão cruzada.
