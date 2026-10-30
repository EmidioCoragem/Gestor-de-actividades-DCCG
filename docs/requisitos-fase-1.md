# GESTOR DE ACTIVIDADES
## PROMPT MESTRE — FASE 1 | VERSÃO CONSOLIDADA

### 1. CONTEXTO E OBJECTIVO

Actua como arquitecto de software sénior, engenheiro full-stack, especialista em segurança, bases de dados e sistemas empresariais.

Estamos a desenvolver o **Gestor de Actividades**, com o subtítulo **Gestão Integrada**, destinado à gestão de actividades, responsabilidades, prazos, validações, processos e desempenho dos departamentos de uma empresa.

O sistema foi inicialmente concebido a partir das necessidades da Direcção de Contabilidade e Controlo de Gestão (DCCG), mas deverá servir toda a organização.

A Fase 0 foi concluída e validada. A verificação visual da alteração do nome poderá ocorrer posteriormente e não deverá bloquear a evolução do projecto.

**Objectivo:** implementar exclusivamente a **Fase 1 — Autenticação, Utilizadores, Estrutura Organizacional, Hierarquias e Permissões**, incluindo a nova identidade visual e a preparação arquitectural para importação e integração de dados.

Respeitar integralmente a especificação funcional v1.4 e as decisões anteriormente aprovadas.

### 2. AMBIENTE TECNOLÓGICO

Manter a arquitectura existente:

- Next.js App Router.
- TypeScript em modo estrito.
- Tailwind CSS.
- Supabase Auth, PostgreSQL e Row Level Security (RLS).
- Zod para validação.
- Vitest e Playwright para testes.
- GitHub privado e GitHub Codespaces.
- Arquitectura modular, extensível e segura.

Repositório: `EmidioCoragem/Gestor-de-actividades-DCCG`.

Branch anterior: `fase-0-fundacao`.

Antes de iniciar, verificar o estado da branch `main`, do Pull Request #1 e dos commits da Fase 0.

Criar uma branch específica para a Fase 1 a partir do código aprovado, sem perder as alterações da Fase 0.

Não fazer merge automaticamente.

---

### 3. NOVA IDENTIDADE VISUAL — AZUL-ESCURO CORPORATIVO

**ALTERAÇÃO OBRIGATÓRIA**

Substituir o verde-esmeralda da interface actual por uma identidade visual em **azul-escuro corporativo**, mantendo a organização, elegância e funcionalidade do Dashboard.

Utilizar a seguinte paleta:

| Elemento | Cor |
|---|---|
| Azul-marinho principal | `#102A43` |
| Azul corporativo secundário | `#1E3A5F` |
| Azul de destaque | `#2563EB` |
| Fundo claro | `#F3F6FA` |
| Cinza de apoio | `#64748B` |
| Branco | `#FFFFFF` |

Aplicar consistentemente a nova identidade visual em:

1. Logótipo com a letra **G**.
2. Menu lateral e navegação activa.
3. Dashboard e cabeçalhos.
4. Botões, ícones e links.
5. Cartões de indicadores.
6. Formulários de autenticação.
7. Tabelas, filtros e componentes administrativos.
8. Páginas de todos os módulos existentes.
9. Estados de foco, selecção e interacção.

Manter o nome **Gestor de Actividades** e o subtítulo **Gestão Integrada**.

Preservar as cores semânticas: verde para sucesso, vermelho para erros e amarelo/âmbar para alertas.

Centralizar a paleta em variáveis ou tokens de design para permitir futuras alterações sem modificar cada componente individualmente.

Garantir contraste adequado, acessibilidade, responsividade e boa legibilidade.

Não redesenhar desnecessariamente a estrutura do Dashboard já aprovada.

---

### 4. AUTENTICAÇÃO E GESTÃO DE UTILIZADORES

Implementar uma estrutura segura de autenticação utilizando Supabase Auth.

Prever:

- Entrada com correio electrónico e palavra-passe.
- Recuperação de palavra-passe.
- Gestão segura de sessões.
- Terminar sessão.
- Protecção das rotas privadas.
- Utilizadores activos, inactivos e suspensos.
- Convite ou registo de utilizadores mediante autorização administrativa.
- Identificação do utilizador autenticado.
- Associação de utilizadores à estrutura organizacional.

Não permitir registo público indiscriminado.

Não utilizar credenciais fictícias como mecanismo real de autenticação.

Caso o Supabase ainda não esteja configurado, preparar a implementação e documentar as instruções necessárias, sem inventar credenciais nem declarar funcionalidades operacionais antes da respectiva validação.

---

### 5. ESTRUTURA ORGANIZACIONAL

Criar uma estrutura configurável para representar:

- Empresa.
- Direcções.
- Departamentos.
- Secções.
- Equipas.
- Outras unidades organizacionais.
- Relações hierárquicas.
- Responsáveis pelas unidades.
- Histórico das alterações organizacionais.

Evitar departamentos rigidamente definidos no código.

Permitir que trabalhadores mudem de departamento ou cargo sem perder o histórico das actividades ou responsabilidades anteriores.

Preparar a estrutura para futura apresentação através de organograma interactivo.

---

### 6. CARGOS, PERFIS E HIERARQUIAS

Separar claramente três conceitos:

**Cargo organizacional:** posição do trabalhador na empresa.

**Perfil funcional:** conjunto de capacidades atribuídas no sistema.

**Âmbito de acesso:** departamentos, unidades ou processos aos quais as permissões se aplicam.

Prever, entre outros:

- Técnico.
- Gestor.
- Director.
- Director Executivo.
- Administrador técnico.

Permitir que os perfis e as respectivas permissões evoluam sem alterações profundas na arquitectura.

O administrador técnico não deverá possuir automaticamente acesso funcional irrestrito aos dados empresariais.

---

### 7. SISTEMA DE PERMISSÕES

Implementar controlo de acesso baseado em permissões explícitas e âmbito organizacional.

Regras obrigatórias:

1. Apenas gestores ou níveis superiores devidamente autorizados podem criar e atribuir actividades.
2. A atribuição de actividades entre departamentos depende de autorização específica.
3. A visibilidade dos dados deve respeitar a hierarquia e o âmbito autorizado.
4. Gestores podem acompanhar as equipas sob a sua responsabilidade.
5. Directores e Direcção Executiva terão visibilidade conforme o respectivo âmbito.
6. Nenhum utilizador pode aumentar os próprios privilégios.
7. Alterações administrativas e de permissões devem ser auditáveis.
8. A interface deve adaptar a navegação ao perfil autorizado.
9. As permissões devem ser aplicadas no servidor e no PostgreSQL através de RLS.
10. Ocultar botões ou menus não constitui mecanismo suficiente de segurança.

Implementar a infraestrutura necessária para suportar as regras futuras de validação, incluindo a proibição de autovalidação de actividades, sem antecipar o módulo completo de Gestão de Actividades.

---

### 8. CENTROS DE CUSTO — PREPARAÇÃO PARA IMPORTAÇÃO

**REQUISITO ESTRATÉGICO OBRIGATÓRIO**

O Gestor de Actividades deverá estar preparado para receber e actualizar a listagem oficial dos Centros de Custo da empresa.

A listagem poderá ser proveniente de ficheiros Excel, CSV ou sistemas empresariais externos.

A hierarquia dos Centros de Custo deve ser independente da hierarquia dos departamentos.

#### 8.1 Modelo de dados

Preparar um modelo extensível com:

- Identificador interno.
- Código do Centro de Custo.
- Designação.
- Descrição.
- Centro de Custo superior, quando aplicável.
- Estado activo ou inactivo.
- Responsável.
- Unidade organizacional associada, quando aplicável.
- Sistema de origem.
- Identificador externo.
- Datas de vigência.
- Datas de criação e actualização.
- Histórico de alterações.

Não presumir códigos exclusivamente numéricos.

Preservar zeros à esquerda e caracteres significativos.

#### 8.2 Preparação para importação

A arquitectura deverá suportar futuramente:

1. Importação de ficheiros Excel e CSV.
2. Validação de campos obrigatórios.
3. Detecção de duplicados.
4. Identificação de novos Centros de Custo.
5. Actualização dos Centros de Custo existentes.
6. Identificação de Centros de Custo potencialmente desactivados.
7. Pré-visualização das alterações antes da confirmação.
8. Registo de erros e relatórios de importação.
9. Auditoria de quem importou e quando.
10. Preservação do histórico.
11. Reversão controlada, quando tecnicamente viável.

Uma nova listagem não deverá eliminar automaticamente Centros de Custo ausentes.

**Limite da Fase 1:** implementar a fundação de dados, os contratos e a documentação necessários. A interface e o processamento completo de importações ficam reservados à fase funcional de Centros de Custo.

---

### 9. PREPARAÇÃO PARA INTEGRAÇÃO FUTURA COM SAP E PRIMAVERA

**REQUISITO ESTRATÉGICO OBRIGATÓRIO**

Preparar o Gestor de Actividades para possível integração futura com:

- SAP.
- Primavera ERP.

A integração será implementada apenas se a empresa considerar necessária e tecnicamente viável.

Poderá abranger:

- Centros de Custo.
- Estrutura organizacional.
- Identificadores de trabalhadores, quando autorizados.
- Dados de referência necessários aos processos empresariais.
- Outros dados expressamente aprovados.

#### 9.1 Arquitectura de integração

Preparar uma camada desacoplada dos módulos funcionais, prevendo:

1. Adaptadores específicos para cada ERP.
2. Contratos internos independentes do sistema de origem.
3. Mapeamento de identificadores internos e externos.
4. Identificação da fonte oficial de cada dado.
5. Registo da origem e da última sincronização.
6. Tratamento de duplicados, erros e conflitos.
7. Auditoria das operações.
8. Possibilidade futura de sincronização manual ou agendada.
9. Preservação de histórico e integridade.
10. Funcionamento autónomo do Gestor de Actividades quando o ERP estiver indisponível.

Não presumir que todas as versões SAP ou Primavera disponibilizam as mesmas APIs ou conectores.

A viabilidade técnica deverá ser avaliada posteriormente, considerando versões, módulos, licenciamento, interfaces disponíveis, segurança e autorizações.

#### 9.2 Limites

Nesta fase:

- Não estabelecer ligações reais a SAP ou Primavera.
- Não solicitar credenciais de produção.
- Não instalar conectores ERP desnecessários.
- Não implementar sincronização bidireccional.
- Não criar dependência obrigatória de qualquer ERP.

Preparar apenas a arquitectura, os contratos e a documentação.

---

### 10. BASE DE DADOS E SEGURANÇA

Criar migrações SQL versionadas para as entidades da Fase 1.

Implementar:

- Chaves primárias e estrangeiras.
- Restrições de integridade.
- Índices adequados.
- Políticas RLS.
- Separação de funções técnicas e funcionais.
- Auditoria de alterações sensíveis.
- Validação dos dados recebidos.
- Protecção contra acesso não autorizado.
- Controlo de alterações de perfis e permissões.

Manter a base de dados preparada para os módulos das fases seguintes.

Não utilizar `service_role` no navegador.

Não expor segredos em código, documentação ou commits.

---

### 11. INTERFACE DA FASE 1

Criar interfaces funcionais para:

- Entrada no sistema.
- Recuperação de acesso.
- Identificação do utilizador autenticado.
- Administração de utilizadores.
- Gestão de unidades organizacionais.
- Associação de trabalhadores a departamentos.
- Atribuição de cargos e perfis.
- Gestão de permissões.
- Consulta da estrutura hierárquica.

Aplicar a nova identidade visual azul-escuro a todas estas interfaces.

Manter o Dashboard e os restantes módulos existentes.

Não apresentar dados demonstrativos como resultados empresariais reais.

Manter a experiência responsiva e o português de Angola.

---

### 12. TESTES OBRIGATÓRIOS

Implementar testes para verificar:

- Autenticação e protecção de rotas.
- Bloqueio de utilizadores não autorizados.
- Permissões por perfil e âmbito.
- Tentativas de escalada de privilégios.
- Isolamento de dados entre departamentos.
- Gestão de utilizadores e hierarquias.
- Integridade das relações organizacionais.
- Políticas RLS.
- Validação dos contratos de Centros de Custo.
- Estrutura dos futuros adaptadores ERP.
- Navegação e funcionamento das interfaces.
- Consistência da nova identidade visual.
- Responsividade e acessibilidade.

Executar ESLint, TypeScript, Vitest, Playwright e compilação.

Não declarar funcionalidades seguras apenas porque passaram nos testes da interface.

Se algum teste depender de um projecto Supabase ainda não configurado, documentar a limitação e não declarar esse teste aprovado.

---

### 13. DOCUMENTAÇÃO

Actualizar a documentação com:

- Arquitectura da Fase 1.
- Modelo de dados.
- Matriz de permissões.
- Regras de hierarquia e visibilidade.
- Configuração do Supabase.
- Migrações e políticas RLS.
- Preparação para importação de Centros de Custo.
- Estratégia futura de integração com SAP e Primavera.
- Nova identidade visual e tokens de design.
- Testes executados.
- Limitações e pendências.

Distinguir claramente funcionalidades implementadas de funcionalidades apenas preparadas para o futuro.

---

### 14. GITHUB E CONTROLO DE ALTERAÇÕES

Criar uma branch própria para a Fase 1.

Criar um Pull Request específico, preferencialmente em Draft enquanto a implementação estiver em curso.

Preservar o histórico da Fase 0.

Não efectuar merge automático.

Não publicar em produção.

Não alterar a visibilidade do repositório ou das portas do Codespaces para pública.

Manter a aplicação compatível com desenvolvimento totalmente online.

---

### 15. RELATÓRIO FINAL

Apresentar:

1. Funcionalidades efectivamente implementadas.
2. Estrutura da base de dados.
3. Políticas de segurança e permissões.
4. Interfaces disponíveis.
5. Aplicação da nova identidade visual azul-escuro.
6. Testes executados e resultados.
7. Estado da configuração do Supabase.
8. Preparação para importação de Centros de Custo.
9. Preparação arquitectural para SAP e Primavera.
10. Ficheiros e documentação alterados.
11. Branch, commits e Pull Request.
12. Limitações e decisões pendentes.
13. Instruções simples para testar no GitHub Codespaces.

**Não iniciar a Fase 2 sem a minha autorização expressa.**

Caso faltem credenciais, decisões empresariais ou configurações externas, continuar as tarefas independentes e apresentar claramente as dependências pendentes.

Não fazer merge na `main` nem publicar em produção sem autorização.