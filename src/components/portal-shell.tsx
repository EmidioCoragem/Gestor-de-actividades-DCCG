"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { getNavigationItems } from "@/modules/navigation";
import { UserIdentification } from "./user-identification";
import { ModuleIcon } from "./module-icon";

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navigation = getNavigationItems();
  const [open, setOpen] = useState(false);
  const current = navigation.find(
    (item) => (item.slug ? `/${item.slug}` : "/") === pathname,
  );
  return (
    <div className="portal">
      <a href="#conteudo" className="skip-link">
        Saltar para o conteúdo
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            G
          </span>
          <span>
            Gestor de Actividades<small>Gestão Integrada</small>
          </span>
        </Link>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="navegacao"
          onClick={() => setOpen(!open)}
        >
          {open ? "Fechar menu" : "Abrir menu"}
        </button>
        <nav
          id="navegacao"
          aria-label="Navegação principal"
          className={open ? "navigation is-open" : "navigation"}
        >
          {navigation.map((item, index) => (
            <div key={item.slug}>
              {(index === 0 || navigation[index - 1].group !== item.group) && (
                <p className="nav-group">{item.group}</p>
              )}
              <Link
                href={item.slug ? `/${item.slug}` : "/"}
                aria-current={current?.slug === item.slug ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="nav-symbol" aria-hidden="true">
                  <ModuleIcon symbol={item.symbol} />
                </span>
                {item.title}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" /> Fundação técnica{" "}
          <small>Fase 0 · Ambiente de desenvolvimento</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              Gestor de Actividades <span aria-hidden="true">/</span>
            </span>{" "}
            <strong>{current?.title ?? "Página"}</strong>
          </div>
          <div className="topbar-meta">
            <span>Africa/Luanda</span>
            <span className="phase-tag">Fase 0</span>
            <UserIdentification />
          </div>
        </header>
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
        <footer className="footer">
          Gestor de Actividades{" "}
          <span>Empresa única · Vários departamentos</span>
        </footer>
      </div>
    </div>
  );
}
