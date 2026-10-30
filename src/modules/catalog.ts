export const modules = [
  {
    slug: "actividades",
    title: "Gestão de Actividades",
    group: "Operações",
    symbol: "AC",
    description:
      "Organize o trabalho, acompanhe os prazos e reúna os documentos de suporte.",
    features: [
      "Atribuição de executores",
      "Prazos e registos de tempo",
      "Documentos e histórico",
    ],
    phase: 2,
  },
  {
    slug: "fecho-mensal",
    title: "Fecho Mensal",
    group: "Operações",
    symbol: "FM",
    description:
      "Uma visão integrada do fecho contabilístico e de controlo de gestão.",
    features: [
      "Modelos versionados",
      "Ciclos e marcos de fecho",
      "Dependências e bloqueios",
    ],
    phase: 4,
  },
  {
    slug: "kpis",
    title: "KPIs",
    group: "Análise",
    symbol: "KP",
    description:
      "Transforme resultados operacionais em indicadores com critérios transparentes.",
    features: [
      "Definições e fórmulas",
      "Metas por âmbito",
      "Resultados históricos",
    ],
    phase: 7,
  },
  {
    slug: "centros-de-custo",
    title: "Centros de Custo",
    group: "Organização",
    symbol: "CC",
    description:
      "Estruture os centros de custo e acompanhe as respectivas responsabilidades.",
    features: [
      "Códigos e designações",
      "Hierarquia independente",
      "Responsáveis e histórico",
    ],
    phase: 5,
  },
  {
    slug: "estrutura-organizacional",
    title: "Estrutura Organizacional",
    group: "Organização",
    symbol: "EO",
    description:
      "Represente as direcções, os departamentos e as equipas da empresa.",
    features: [
      "Unidades organizacionais",
      "Organograma interactivo",
      "Histórico de cargos",
    ],
    phase: 1,
  },
  {
    slug: "hierarquia-permissoes",
    title: "Hierarquia e Permissões",
    group: "Organização",
    symbol: "HP",
    description:
      "Defina responsabilidades e âmbitos de acesso de forma controlada.",
    features: [
      "Papéis e permissões",
      "Chefias e delegações",
      "Separação de funções",
    ],
    phase: 1,
  },
  {
    slug: "planeamento",
    title: "Planeamento e Cronograma",
    group: "Operações",
    symbol: "PC",
    description:
      "Relacione os planos de trabalho com actividades, dependências e marcos.",
    features: [
      "Planos por período",
      "Calendário e recorrência",
      "Cronogramas de Gantt",
    ],
    phase: 6,
  },
  {
    slug: "relatorios",
    title: "Relatórios",
    group: "Análise",
    symbol: "RE",
    description: "Consulte informação consolidada dentro do âmbito autorizado.",
    features: [
      "Filtros por período e unidade",
      "Exportação para Excel e PDF",
      "Relatórios consolidados",
    ],
    phase: 7,
  },
  {
    slug: "notificacoes",
    title: "Notificações",
    group: "Operações",
    symbol: "NO",
    description: "Centralize os avisos de atribuição, prazo e validação.",
    features: [
      "Alertas configuráveis",
      "Escalonamento hierárquico",
      "Histórico sem duplicados",
    ],
    phase: 3,
  },
  {
    slug: "administracao",
    title: "Administração",
    group: "Configuração",
    symbol: "AD",
    description:
      "Prepare a configuração técnica do portal com responsabilidades separadas.",
    features: [
      "Configuração da plataforma",
      "Auditoria técnica",
      "Integrações e segurança",
    ],
    phase: 1,
  },
] as const;
export type PortalModule = (typeof modules)[number];
export const navigation = [
  { slug: "", title: "Dashboard", group: "Visão geral", symbol: "DB" } as const,
  ...[...modules].sort(
    (a, b) =>
      ["Operações", "Organização", "Análise", "Configuração"].indexOf(a.group) -
      ["Operações", "Organização", "Análise", "Configuração"].indexOf(b.group),
  ),
];
