"use client";
import { useActionState } from "react";
import type { ActionResult } from "@/modules/auth/actions";
export function AuthForm({
  action,
  mode,
  disabled = false,
}: {
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  mode: "login" | "recovery" | "password";
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { message: "" });
  return (
    <form action={formAction} className="data-form">
      {mode !== "password" && (
        <label>
          Correio electrónico
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={disabled}
          />
        </label>
      )}
      {mode !== "recovery" && (
        <label>
          Palavra-passe
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={mode === "password" ? 12 : 1}
            maxLength={128}
            required
            disabled={disabled}
          />
        </label>
      )}
      {mode === "password" && (
        <label>
          Confirmar palavra-passe
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            disabled={disabled}
          />
        </label>
      )}
      <button className="button" disabled={disabled || pending}>
        {pending
          ? "A processar…"
          : mode === "login"
            ? "Entrar"
            : mode === "recovery"
              ? "Enviar instruções"
              : "Guardar palavra-passe"}
      </button>
      <p
        role="status"
        className={state.success ? "feedback success" : "feedback"}
      >
        {state.message}
      </p>
    </form>
  );
}
