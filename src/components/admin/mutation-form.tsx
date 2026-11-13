"use client";
import { useActionState, useId, type ReactNode } from "react";
import { adminMutation, inviteUser } from "@/modules/access/actions";
export function MutationForm({
  operation,
  title,
  children,
  invitation = false,
  disabled = false,
  disabledReason,
}: {
  operation?: string;
  title: string;
  children: ReactNode;
  invitation?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const disabledReasonId = useId();
  const [state, action, pending] = useActionState(
    invitation ? inviteUser : adminMutation,
    { message: "" },
  );
  return (
    <section className="panel admin-section">
      <h2>{title}</h2>
      <form
        action={action}
        className="data-form"
        aria-busy={pending}
        aria-describedby={disabled && disabledReason ? disabledReasonId : undefined}
      >
        {operation && (
          <input type="hidden" name="operation" value={operation} />
        )}
        <fieldset disabled={pending || disabled}>{children}</fieldset>
        {disabled && disabledReason && (
          <p id={disabledReasonId} role="status" aria-live="polite">
            {disabledReason}
          </p>
        )}
        <button type="submit" className="button" disabled={pending || disabled}>
          {pending ? "A guardar…" : "Confirmar"}
        </button>
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={state.success ? "feedback success" : "feedback"}
        >
          {state.message}
        </p>
      </form>
    </section>
  );
}
