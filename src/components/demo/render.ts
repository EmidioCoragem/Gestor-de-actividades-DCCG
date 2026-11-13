type DemoChoice = { id: string; label: string };
type DemoScenarioView = DemoChoice & {
  description: string;
  active: boolean;
  allowedSections: readonly string[];
  scopeLabel: string;
};
type DemoSectionView = {
  title: string;
  description: string;
} & (
  | {
      allowed: true;
      columns: readonly { key: string; label: string }[];
      rows: readonly Readonly<Record<string, string>>[];
    }
  | { allowed: false; reason: string }
);

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function destination(persona: string, section: string): string {
  return `/demonstracao?persona=${encodeURIComponent(persona)}&pagina=${encodeURIComponent(section)}`;
}

function document(title: string, content: string): string {
  return `<!doctype html>
<html lang="pt-AO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${escapeHtml(title)} · Demonstração fictícia</title>
  <link rel="stylesheet" href="/demo.css">
</head>
<body>
  <a class="skip-link" href="#conteudo">Saltar para o conteúdo</a>
  <div class="demo-banner">Demonstração isolada — dados 100% fictícios</div>
  ${content}
  <footer>Gestor de Actividades · Gestão Integrada <span>Fase 1 · Sem autenticação real · Africa/Luanda</span></footer>
</body>
</html>`;
}

export function renderDemoEntry(personas: readonly DemoChoice[]): string {
  return document(
    "Escolha um cenário",
    `<main class="entry" id="conteudo" tabindex="-1">
      <div class="brand"><span class="brand-mark" aria-hidden="true">G</span><span>Gestor de Actividades<small>Gestão Integrada</small></span></div>
      <div class="entry-heading"><p class="eyebrow">Percurso de apresentação · Fase 1</p><h1>Escolha um cenário de demonstração</h1><p>Explore a identificação, a organização e os acessos com pessoas e registos inventados.</p></div>
      <div class="notice"><strong>Seleccionar um cenário não inicia sessão.</strong><p>Não indique palavras-passe ou dados pessoais. Não há ligação ao Supabase, envio de correio ou alterações a contas.</p></div>
      <section class="scenario-grid" aria-label="Cenários fictícios">
        ${personas.map((persona) => `<article class="panel scenario-card"><span class="badge">Identidade fictícia</span><h2>${escapeHtml(persona.label)}</h2><p>Observe os dados e as recusas representados para este cenário.</p><a class="button" href="${escapeHtml(destination(persona.id, "identificacao"))}">Explorar cenário ${escapeHtml(persona.label)}</a></article>`).join("")}
      </section>
      <p class="limitation">Esta apresentação não comprova autenticação, permissões reais, RLS ou instalação da migração AT/AF.</p>
    </main>`,
  );
}

export function renderDemoPage({
  scenario,
  section,
  sections,
  currentSection,
}: {
  scenario: DemoScenarioView;
  section: DemoSectionView;
  sections: readonly DemoChoice[];
  currentSection: string;
}): string {
  const navigation = sections.map((item) => {
    const allowed = scenario.allowedSections.includes(item.id);
    return `<a href="${escapeHtml(destination(scenario.id, item.id))}"${item.id === currentSection ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}<small>${allowed ? "Consulta simulada" : "Ver recusa simulada"}</small></a>`;
  }).join("");
  let body: string;
  if (!section.allowed) {
    body = `<div class="panel refusal"><span class="badge">Recusa simulada</span><h1>Acesso recusado nesta demonstração</h1><p>${escapeHtml(section.reason)}</p><p>Não são apresentados registos deste percurso. Esta decisão pertence apenas ao cenário fictício.</p><a class="text-link" href="/">Escolher outro cenário</a></div>`;
  } else {
    const table = section.rows.length
      ? `<div class="table-scroll" tabindex="0" role="region" aria-label="Tabela de ${escapeHtml(section.title)}"><table><caption>${escapeHtml(section.title)} — registos fictícios</caption><thead><tr>${section.columns.map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${section.rows.map((row) => `<tr>${section.columns.map((column) => `<td>${escapeHtml(row[column.key] ?? "Não disponível")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : '<p class="empty-note" role="status">Sem registos fictícios para apresentar neste âmbito.</p>';
    const labels: Readonly<Record<string, readonly string[]>> = {
      utilizadores: ["Convidar utilizador", "Alterar estado"],
      estrutura: ["Criar unidade", "Alterar unidade"],
      permissoes: ["Atribuir perfil", "Encerrar atribuição"],
    };
    const actions = labels[currentSection];
    body = `<div class="page-heading"><p class="eyebrow">Consulta de demonstração</p><h1>${escapeHtml(section.title)}</h1><p>${escapeHtml(section.description)}</p></div>
      <section class="panel data-panel">${table}</section>
      ${actions ? `<section class="panel controls" aria-labelledby="controlos"><h2 id="controlos">Operações desactivadas</h2><p>Os controlos abaixo são ilustrativos. Este percurso não executa alterações.</p><div class="button-row">${actions.map((label) => `<button class="button" type="button" disabled>${escapeHtml(label)}</button>`).join("")}</div></section>` : ""}`;
  }
  return document(
    section.allowed ? section.title : "Acesso recusado",
    `<div class="portal">
      <aside class="sidebar"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">G</span><span>Gestor de Actividades<small>Gestão Integrada</small></span></a><p class="nav-group">Percurso fictício</p><nav aria-label="Percurso da demonstração">${navigation}</nav><a class="exit-link" href="/">Encerrar demonstração</a></aside>
      <div class="workspace"><header class="topbar"><div><p class="eyebrow">Cenário seleccionado</p><strong>${escapeHtml(scenario.label)}</strong></div><span class="badge">${scenario.active ? "Perfil activo fictício" : "Perfil inactivo fictício"}</span></header>
      <main id="conteudo" tabindex="-1"><div class="scope"><strong>Âmbito representado</strong><span>${escapeHtml(scenario.scopeLabel)}</span><p>${escapeHtml(scenario.description)}</p></div>${body}<p class="limitation">Dados e decisões exclusivamente fictícios. A selecção de cenário não autentica pessoas nem comprova RLS, Auth ou PostgREST reais.</p><a class="text-link" href="/">Escolher outro cenário</a></main></div>
    </div>`,
  );
}

export const DEMO_CSS = `
:root{--brand-main:#102a43;--brand-secondary:#1e3a5f;--brand-accent:#2563eb;--bg:#f3f6fa;--white:#fff;--muted:#64748b;--line:#dce4ef;--surface-soft:#edf3fb;--warning:#92400e;--success:#047857;--error:#b91c1c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--brand-main);font:14px/1.6 Arial,Helvetica,sans-serif}a{color:inherit}button{font:inherit}h1,h2,p{margin:0}h1{font-size:clamp(25px,3vw,34px);line-height:1.25;letter-spacing:-.6px;overflow-wrap:anywhere}h2{font-size:19px;line-height:1.4}p{overflow-wrap:anywhere}:focus-visible{outline:3px solid var(--brand-accent);outline-offset:4px}.skip-link{position:absolute;top:-100px;left:12px;padding:12px;background:var(--white);z-index:5}.skip-link:focus{top:12px}.demo-banner{position:sticky;top:0;z-index:3;padding:12px 20px;background:var(--brand-main);color:var(--white);font-weight:700;text-align:center;overflow-wrap:anywhere}.brand{display:flex;align-items:center;gap:12px;padding:24px 20px;font-size:16px;font-weight:700;text-decoration:none;line-height:1.4}.brand>span:last-child{min-width:0;overflow-wrap:anywhere}.brand small{display:block;font-size:12px;font-weight:400;color:var(--muted)}.brand-mark{display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border-radius:10px;background:var(--brand-secondary);color:var(--white);font-size:24px}.entry{max-width:1100px;margin:auto;padding:20px 24px 45px}.entry>.brand{padding-left:0}.entry-heading{max-width:780px;margin:22px 0}.entry-heading h1{margin:8px 0 14px}.entry-heading>p:last-child{color:var(--muted)}.eyebrow,.nav-group{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}.notice{padding:18px 20px;border:1px solid var(--line);border-left:4px solid var(--brand-accent);border-radius:8px;background:var(--surface-soft)}.notice p{margin-top:5px}.scenario-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:24px 0}.panel{background:var(--white);border:1px solid var(--line);border-radius:12px}.scenario-card{display:flex;align-items:flex-start;flex-direction:column;gap:14px;padding:24px;min-width:0}.scenario-card p{color:var(--muted);flex:1}.badge{display:inline-block;border:1px solid var(--line);border-radius:6px;padding:4px 9px;font-size:11px;font-weight:700;background:var(--surface-soft);overflow-wrap:anywhere}.button{display:inline-flex;align-items:center;justify-content:center;padding:11px 16px;border:1px solid var(--brand-accent);border-radius:7px;background:var(--brand-accent);color:var(--white);font-weight:700;text-align:center;text-decoration:none;min-height:44px;max-width:100%;overflow-wrap:anywhere}.button:disabled{cursor:not-allowed;background:var(--surface-soft);color:var(--muted);border-color:var(--line)}.portal{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:calc(100vh - 150px)}.sidebar{background:var(--white);border-right:1px solid var(--line);padding-bottom:24px;min-width:0}.nav-group{padding:15px 22px 8px}.sidebar nav{display:grid;gap:5px;padding:0 12px}.sidebar nav a{display:block;padding:10px 12px;border-radius:7px;text-decoration:none;overflow-wrap:anywhere}.sidebar nav a[aria-current=page]{background:var(--surface-soft);font-weight:700;color:var(--brand-secondary)}.sidebar nav a:hover{background:var(--bg)}.sidebar nav small{display:block;font-size:11px;color:var(--muted)}.exit-link{display:block;margin:25px 24px 0;color:var(--brand-secondary);font-weight:700}.workspace{min-width:0}.topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 32px;background:var(--white);border-bottom:1px solid var(--line)}.topbar>div{min-width:0;overflow-wrap:anywhere}.topbar strong{font-size:16px}.workspace main{padding:28px 32px 40px;max-width:1400px;min-width:0}.scope{display:flex;flex-wrap:wrap;gap:6px 14px;padding:16px 18px;background:var(--surface-soft);border:1px solid var(--line);border-radius:8px;margin-bottom:26px}.scope p{width:100%;color:var(--muted);font-size:12px}.page-heading{margin-bottom:22px}.page-heading h1{margin:6px 0 10px}.page-heading>p:last-child{color:var(--muted)}.data-panel{min-width:0;overflow:hidden}.table-scroll{max-width:100%;overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}caption{text-align:left;padding:18px 20px;font-weight:700;color:var(--brand-secondary)}th,td{padding:14px 20px;vertical-align:top;border-top:1px solid var(--line);overflow-wrap:anywhere}th{background:var(--surface-soft);font-size:12px}td{font-size:13px;min-width:110px}tbody tr:nth-child(even){background:#fafbfd}.controls{padding:22px;margin-top:22px}.controls p{margin:8px 0 15px;color:var(--muted)}.button-row{display:flex;flex-wrap:wrap;gap:10px}.empty-note{padding:20px;color:var(--muted)}.refusal{padding:28px;border-left:4px solid var(--warning)}.refusal h1{margin:16px 0}.refusal p{margin-bottom:14px}.text-link{color:var(--brand-secondary);font-weight:700;display:inline-block;padding:5px 0}.limitation{font-size:12px;color:var(--muted);margin:24px 0 12px}footer{padding:18px 24px;border-top:1px solid var(--line);background:var(--white);font-size:12px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;color:var(--muted)}
@media(max-width:900px){.portal{grid-template-columns:220px minmax(0,1fr)}.brand{padding:20px 14px;font-size:14px}.workspace main{padding:24px 20px}.topbar{padding:18px 20px;flex-wrap:wrap}.scenario-grid{gap:16px}.scenario-card{padding:20px}th,td{padding:12px 15px}}
@media(max-width:640px){.portal{display:block}.sidebar{border-right:0;border-bottom:1px solid var(--line);padding-bottom:16px}.sidebar>.brand{padding:18px 20px}.nav-group{padding-top:0}.sidebar nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:0 10px}.sidebar nav a{font-size:13px;padding:9px 10px}.sidebar nav small{font-size:10px}.exit-link{margin:16px 20px 0}.workspace main{padding:22px 16px 30px}.topbar{padding:16px}.entry{padding:16px 16px 30px}.scenario-grid{grid-template-columns:minmax(0,1fr)}.demo-banner{font-size:12px;padding:10px 14px}.scope{padding:13px}.refusal{padding:22px 18px}.button{width:100%}.button-row{display:grid;grid-template-columns:minmax(0,1fr)}footer{padding:16px}}
`;
