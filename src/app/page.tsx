import Link from "next/link";
import { modules } from "@/modules/catalog";
import { ArrowIcon, ModuleIcon } from "@/components/module-icon";

const operationalAreas = [
  {
    title: "Actividades pendentes",
    symbol: "AC",
    href: "/actividades",
    detail: "Trabalho atribuído e em execução",
  },
  {
    title: "Validações pendentes",
    symbol: "HP",
    href: "/actividades",
    detail: "Submissões a aguardar decisão",
  },
  {
    title: "Prazos a acompanhar",
    symbol: "PC",
    href: "/planeamento",
    detail: "Prazos próximos e ultrapassados",
  },
  {
    title: "Fecho mensal",
    symbol: "FM",
    href: "/fecho-mensal",
    detail: "Ciclos, tarefas críticas e marcos",
  },
];

export default function Dashboard() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Visão operacional</p>
          <h1>Dashboard</h1>
          <p>Acompanhe o trabalho, os prazos e as prioridades da empresa.</p>
        </div>
        <span className="badge">Estrutura inicial · Fase 0</span>
      </div>
      <div className="foundation-strip">
        <span className="status-dot" />
        <strong>Gestor de Actividades</strong>
        <span>Uma base comum para coordenar as suas equipas.</span>
      </div>
      <div className="notice">
        <span className="notice-icon" aria-hidden="true">
          i
        </span>
        <div>
          <strong>Funcionalidade ainda não implementada</strong>
          <p>
            Autenticação, dados e processos ainda não implementados. Os espaços
            abaixo aguardam ligação a dados autorizados; não representam
            resultados reais.
          </p>
        </div>
      </div>
      <section aria-labelledby="overview-title">
        <div className="section-heading">
          <h2 id="overview-title">Acompanhamento operacional</h2>
          <span>Sem ligação a dados</span>
        </div>
        <div className="metric-grid">
          {operationalAreas.map((area) => (
            <Link
              className="panel metric operational-metric"
              key={area.title}
              href={area.href}
            >
              <div className="metric-heading">
                <span className="module-symbol">
                  <ModuleIcon symbol={area.symbol} />
                </span>
                <ArrowIcon />
              </div>
              <h3>{area.title}</h3>
              <div className="metric-value" aria-label="Sem dados">
                —
              </div>
              <p>{area.detail}</p>
              <span className="module-status">Ainda não disponível</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="operational-grid">
        <section
          className="panel work-panel"
          aria-labelledby="priorities-title"
        >
          <div className="work-panel-heading">
            <div>
              <p className="eyebrow">Trabalho e prazos</p>
              <h2 id="priorities-title">Prioridades de acompanhamento</h2>
            </div>
            <ModuleIcon symbol="AC" />
          </div>
          <div className="compact-empty">
            <span className="empty-symbol">
              <ModuleIcon symbol="PC" />
            </span>
            <h3>Sem actividades para apresentar</h3>
            <p>
              As actividades pendentes, os bloqueios e os prazos serão
              apresentados após a implementação dos respectivos módulos.
            </p>
          </div>
          <Link className="panel-link" href="/actividades">
            Consultar Gestão de Actividades <ArrowIcon />
          </Link>
        </section>
        <section className="panel work-panel" aria-labelledby="closing-title">
          <div className="work-panel-heading">
            <div>
              <p className="eyebrow">Contabilidade e controlo de gestão</p>
              <h2 id="closing-title">Acompanhamento do fecho</h2>
            </div>
            <ModuleIcon symbol="FM" />
          </div>
          <div className="closing-status">
            <span className="badge">Ciclo não disponível</span>
            <p>
              O período contabilístico e o estado do ciclo ainda não estão
              ligados a dados.
            </p>
          </div>
          <dl className="closing-checklist">
            {[
              "Actividades críticas",
              "Marcos de fecho",
              "Validações obrigatórias",
            ].map((label) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>Não disponível</dd>
              </div>
            ))}
          </dl>
          <Link className="panel-link" href="/fecho-mensal">
            Consultar Fecho Mensal <ArrowIcon />
          </Link>
        </section>
      </div>
      <section aria-labelledby="modules-title">
        <div className="section-heading">
          <div>
            <h2 id="modules-title">Áreas de trabalho</h2>
            <p>Acesso aos módulos previstos para o portal.</p>
          </div>
          <span>Implementação por fases</span>
        </div>
        <div className="module-grid">
          {modules.map((portalModule) => (
            <Link
              className="panel module-card"
              key={portalModule.slug}
              href={`/${portalModule.slug}`}
            >
              <span className="module-symbol">
                <ModuleIcon symbol={portalModule.symbol} />
              </span>
              <span className="module-copy">
                <h3>{portalModule.title}</h3>
                <p>{portalModule.description}</p>
                <span className="module-status">
                  Planeado · Fase {portalModule.phase}
                </span>
              </span>
              <span className="module-arrow">
                <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
