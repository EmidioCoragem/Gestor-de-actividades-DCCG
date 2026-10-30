# Arquitectura — Fase 0

O portal serve uma empresa com várias unidades. A interface inicial não consulta serviços externos nem guarda dados. Pode abrir sem Supabase configurado. Nenhuma página implementa autenticação ou autorização: não introduzir informação confidencial nesta versão.

## Camadas

- `src/app`: rotas App Router, metadados e composição das páginas, renderizadas no servidor por defeito.
- `src/components`: estrutura visual comum, navegação móvel e estados iniciais. Apenas a navegação necessita de estado no browser.
- `src/modules/catalog.ts`: nomes, âmbitos e fases dos módulos, reutilizados na navegação e nas páginas.
- `src/lib/supabase`: validação de configuração com Zod e fábricas de clientes browser/servidor. Nenhum cliente é chamado pelas páginas. A fábrica servidor escreve cookies e deve ser usada apenas em Server Actions/Route Handlers apropriados. Renovação de sessão ainda não implementada.
- Nas fases seguintes, cada módulo terá `domain` (regras independentes da interface), `application` (casos de uso), `authorization` (âmbito e segregação) e `data` (consultas e persistência). Não criar regras de negócio dentro dos componentes.

A entidade actividade será partilhada entre planeamento, fecho e relatórios. As tarefas dos ciclos referenciam actividades em vez de duplicar o seu ciclo operacional.

## Decisões

Next.js 16, React 19, TypeScript 5 e Tailwind 4; Node 24. Intervalos semver limitados à versão principal compatível. O lockfile gerado pelo npm fixa as versões efectivas; deve acompanhar a revisão. Fontes locais do sistema evitam downloads durante a compilação. Não existe dependência de Excel para definir actividades de fecho.

A navegação tem etiquetas, foco visível, ligação para saltar conteúdo, página activa e menu móvel com estado acessível. Os indicadores usam travessão e «ainda não disponível». Não existe utilizador fictício autenticado.

## Segurança e evolução

As páginas iniciais são públicas e contêm apenas descrição funcional. Cabeçalhos básicos reduzem exposição, mas não substituem a homologação. Na Fase 1 implementar autenticação, renovação de sessão, autorização servidor e RLS, com testes negativos antes de disponibilizar dados. Anexos usarão buckets privados e URLs assinadas após verificação de acesso. Não existe schema SQL implantado nesta fase.

Fase 8: validar CSP, rate limiting, observabilidade sem dados sensíveis, backups com recuperação testada, retenção, desempenho e serviço de alojamento. Não publicar em produção antes da aprovação.

## Revisão visual da Fase 0

O Dashboard privilegia actividades pendentes, validações, prazos e fecho. Os cartões têm ligações aos módulos, mas não calculam indicadores. O painel institucional foi reduzido a uma faixa compacta. Ícones SVG locais identificam os módulos de forma consistente, sem fontes remotas.

A identificação do utilizador é um painel expansível com nome, cargo, departamento e perfil marcados como indisponíveis. A opção «Terminar sessão» está desactivada. Não há utilizador ou sessão simulada.

`src/modules/navigation.ts` declara os cinco perfis funcionais e uma função de configuração visual por identificadores de módulo. A interface inicial apresenta todos os módulos informativos. Não há troca de perfil nem atribuição de poderes. Na Fase 1 a configuração visual deverá derivar das permissões resolvidas pelo servidor, mantendo autorização de cada pedido e RLS independentemente dos links apresentados.

Para Codespaces, `allowedDevOrigins` acrescenta apenas o hostname da porta 3000 derivado das variáveis próprias do Codespace, sem autorizar globalmente todos os Codespaces. O encaminhamento de portas deve continuar privado.
