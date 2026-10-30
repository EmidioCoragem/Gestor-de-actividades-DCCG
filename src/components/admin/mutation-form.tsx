"use client";
import { useActionState, type ReactNode } from "react";
import { adminMutation, inviteUser } from "@/modules/access/actions";
export function MutationForm({
  operation,
  title,
  children,
  invitation = false,
}: {
  operation?: string;
  title: string;
  children: ReactNode;
  invitation?: boolean;
}) {
  const [state, action, pending] = useActionState(
    invitation ? inviteUser : adminMutation,
    { message: "" },
  );
  return (
    <section className="panel admin-section">
      <h2>{title}</h2>
      <form action={action} className="data-form">
        {operation && (
          <input type="hidden" name="operation" value={operation} />
        )}
        <fieldset disabled={pending}>{children}</fieldset>
        <button className="button" disabled={pending}>
          {pending ? "A guardar…" : "Confirmar"}
        </button>
        <p
          role="status"
          className={state.success ? "feedback success" : "feedback"}
        >
          {state.message}
        </p>
      </form>
    </section>
  );
}
