"use client";
import { useActionState, useSyncExternalStore } from "react";
import type { ActionResult } from "@/modules/auth/actions";
const subscribeToHydration = () => () => {};
export function AuthForm({
  action,
  mode,
  disabled = false,
  formOriginNonce,
}: {
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  mode: "login" | "recovery" | "password" | "logout";
  disabled?: boolean;
  formOriginNonce?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { message: "" });
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  // Com no-referrer, um POST HTML nativo pode ter Origin: null. Só activar
  // quando React já instalou o transporte da Server Action, mantendo o CSRF.
  const unavailable = disabled || !hydrated;
  return (
    <form action={formAction} className="data-form">
      {formOriginNonce && <input type="hidden" name="gestor_form_origin" value={formOriginNonce} />}
      {(mode === "login" || mode === "recovery") && (
        <label>
          Correio electrónico
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={unavailable}
          />
        </label>
      )}
      {(mode === "login" || mode === "password") && (
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
            disabled={unavailable}
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
            disabled={unavailable}
          />
        </label>
      )}
      <button className="button" disabled={unavailable || pending}>
        {pending
          ? "A processar…"
          : mode === "login"
            ? "Entrar"
            : mode === "recovery"
              ? "Enviar instruções"
              : mode === "logout"
                ? "Terminar sessão e voltar à entrada"
                : "Guardar palavra-passe"}
      </button>
      <noscript>Active o JavaScript para utilizar este formulário.</noscript>
      <p
        role="status"
        className={state.success ? "feedback success" : "feedback"}
      >
        {state.message}
      </p>
    </form>
  );
}
