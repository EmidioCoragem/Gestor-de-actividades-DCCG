import type { ReactNode } from "react";

export function AdminReadState({
  status,
  children,
}: {
  status: "empty" | "refused" | "unavailable";
  children: ReactNode;
}) {
  return (
    <p
      className={status === "empty" ? "empty-note" : "notice"}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {children}
    </p>
  );
}

export function AdminLoading() {
  return (
    <div className="panel admin-section">
      <p role="status" aria-live="polite" aria-atomic="true">
        A carregar informação…
      </p>
    </div>
  );
}
