import type { ReactNode } from "react";
export function AuthPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-screen">
      <section className="auth-card panel">
        <div className="brand auth-brand">
          <span className="brand-mark">G</span>
          <span>
            Gestor de Actividades<small>Gestão Integrada</small>
          </span>
        </div>
        <p className="eyebrow">Acesso reservado à organização</p>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
