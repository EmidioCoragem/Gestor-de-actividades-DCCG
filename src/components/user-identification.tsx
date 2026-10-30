"use client";

import { useEffect, useRef } from "react";
import type { ViewerIdentity } from "./portal-shell";
import { signOut } from "@/modules/auth/actions";

export function UserIdentification({ viewer }: { viewer: ViewerIdentity }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      const details = detailsRef.current;
      if (event.key === "Escape" && details?.open) {
        details.open = false;
        details.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  return (
    <details ref={detailsRef} className="user-identification">
      <summary>
        <span className="user-avatar" aria-hidden="true">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
          </svg>
        </span>
        <span>
          {viewer.name}
          <small>{viewer.position}</small>
        </span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="user-panel">
        <h2>Conta autenticada</h2>
        <p>{viewer.email}</p>
        <dl>
          {[
            ["Nome do utilizador", viewer.name],
            ["Cargo", viewer.position],
            ["Departamento", viewer.department],
            [
              "Perfil funcional",
              viewer.roles.join(", ") || "Sem perfil atribuído",
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <form action={signOut}>
          <button type="submit">Terminar sessão</button>
        </form>
      </div>
    </details>
  );
}
