import Link from "next/link";
import type { PortalModule } from "@/modules/catalog";
export function ModulePage({ module }: { module: PortalModule }) {
  return <>
    <div className="page-heading"><div><p className="eyebrow">{module.group}</p><h1>{module.title}</h1><p>{module.description}</p></div><span className="badge">Estrutura inicial</span></div>
    <div className="notice"><span className="notice-icon" aria-hidden="true">i</span><div><strong>Funcionalidade ainda não implementada</strong><p>Esta página apresenta a estrutura do módulo. A operação está prevista para a Fase {module.phase}; não existem dados reais ou acções de produção disponíveis.</p></div></div>
    <section className="panel empty-state" aria-labelledby="empty-title"><div className="empty-symbol" aria-hidden="true">{module.symbol}</div><p className="eyebrow">Módulo em preparação</p><h2 id="empty-title">O seu espaço de {module.title.toLocaleLowerCase("pt-AO")}</h2><p>As funcionalidades serão disponibilizadas após a implementação e validação das regras de acesso.</p><Link href="/" className="button secondary">Voltar ao Dashboard <span aria-hidden="true">↗</span></Link></section>
    <section aria-labelledby="planned-title"><div className="section-heading"><h2 id="planned-title">O que está previsto</h2><span>Fase {module.phase}</span></div><div className="feature-grid">{module.features.map((feature, i) => <article className="panel feature" key={feature}><span className="feature-number">0{i+1}</span><h3>{feature}</h3><p>Planeado · Ainda não disponível</p></article>)}</div></section>
  </>;
}
