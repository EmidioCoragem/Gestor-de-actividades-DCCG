"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useActionState, useId, useRef, useState, useSyncExternalStore } from "react";
import { createActivityDraft, type ActivityActionResult } from "@/modules/activities/actions";
import styles from "./activities.module.css";

const subscribeToHydration = () => () => {};

export function ActivityDraftForm({
  requestId,
  units,
  disabled = false,
  disabledReason,
}: {
  requestId: string;
  units: readonly { id: string; code: string; name: string }[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  // Revalidation must not turn an uncertain request into a new intention.
  const [intentId] = useState(requestId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const inFlight = useRef(false);
  const id = useId();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  async function submit(previous: ActivityActionResult, form: FormData): Promise<ActivityActionResult> {
    try {
      return await createActivityDraft(previous, form);
    } catch (error) {
      unstable_rethrow(error);
      return {
        status: "unavailable",
        message: "Não foi possível confirmar o resultado. O pedido e os dados foram conservados; não inicie outro pedido sem conferir os rascunhos.",
        retryable: true,
      };
    } finally {
      inFlight.current = false;
    }
  }

  const [state, action, pending] = useActionState(submit, {
    status: "idle",
    message: "",
  } satisfies ActivityActionResult);
  const success = state.status === "success";
  const uncertain = state.status === "unavailable";
  const conflict = state.status === "conflict";
  const frozen = uncertain || conflict;
  const unavailable = disabled || units.length === 0 || !hydrated;
  const locked = unavailable || pending || success;
  const errors = state.fieldErrors ?? {};
  const reason = disabledReason || (units.length === 0 ? "Não existem unidades autorizadas disponíveis para criar este rascunho." : "");

  return (
    <section className="panel admin-section" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Criar rascunho</h2>
      <p id={`${id}-help`}>
        Guarde o título, a descrição e a unidade responsável. O rascunho permanece incompleto, sem executores, prazos ou gestor validador.
      </p>
      <form
        action={action}
        className={`data-form ${styles.form}`}
        aria-busy={pending}
        aria-describedby={`${id}-help${reason ? ` ${id}-reason` : ""}`}
        onSubmit={(event) => {
          if (inFlight.current || locked || conflict || (uncertain && state.retryable === false)) {
            event.preventDefault();
            return;
          }
          inFlight.current = true;
        }}
      >
        <input type="hidden" name="request_id" value={intentId} />
        <fieldset disabled={locked}>
          <label htmlFor={`${id}-title`}>
            Título
            <input
              id={`${id}-title`}
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={400}
              readOnly={frozen}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${id}-title-error` : undefined}
            />
          </label>
          <span className={styles.hint}>Até 200 caracteres. Preenchidos: {Array.from(title.trim()).length}.</span>
          {errors.title && <span className={styles.error} id={`${id}-title-error`}>{errors.title}</span>}
          <label htmlFor={`${id}-description`}>
            Descrição (opcional)
            <textarea
              id={`${id}-description`}
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={20000}
              readOnly={frozen}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? `${id}-description-error` : undefined}
            />
          </label>
          <span className={styles.hint}>Até 10 000 caracteres. Preenchidos: {Array.from(description).length}.</span>
          {errors.description && <span className={styles.error} id={`${id}-description-error`}>{errors.description}</span>}
          <label htmlFor={`${id}-unit`}>
            Unidade responsável
            <select
              id={`${id}-unit`}
              name={frozen ? undefined : "responsible_unit_id"}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              required
              disabled={frozen}
              aria-invalid={Boolean(errors.responsible_unit_id)}
              aria-describedby={`${id}-unit-help${errors.responsible_unit_id ? ` ${id}-unit-error` : ""}`}
            >
              <option value="">Seleccionar unidade autorizada…</option>
              {units.map((option) => <option key={option.id} value={option.id}>{option.code} — {option.name}</option>)}
            </select>
          </label>
          {frozen && <input type="hidden" name="responsible_unit_id" value={unit} />}
          <span className={styles.hint} id={`${id}-unit-help`}>A lista apresenta as unidades permitidas; a autorização é novamente verificada ao guardar.</span>
          {errors.responsible_unit_id && <span className={styles.error} id={`${id}-unit-error`}>{errors.responsible_unit_id}</span>}
        </fieldset>
        {reason && <p id={`${id}-reason`} role="status">{reason}</p>}
        <noscript>Active o JavaScript para guardar o rascunho com segurança.</noscript>
        <div className={styles.actions}>
          <button className="button" type="submit" disabled={locked || conflict || (uncertain && state.retryable === false)}>
            {pending ? "A guardar…" : uncertain ? "Repetir o mesmo pedido" : "Guardar rascunho"}
          </button>
          {success && state.draftId && <Link className="text-link" href={`/actividades/${state.draftId}`}>Consultar rascunho guardado</Link>}
          {success && <Link className="text-link" href={`/actividades?novo=${intentId}`} prefetch={false}>Criar outro rascunho</Link>}
        </div>
        {frozen && <p className={styles.hint}>Os dados estão bloqueados para preservar a intenção deste pedido. Confira a lista antes de iniciar uma nova criação; repetir este pedido conserva a mesma chave e o mesmo conteúdo.</p>}
        <p role="status" aria-live="polite" aria-atomic="true" className={success ? "feedback success" : "feedback"}>
          {state.message}
        </p>
      </form>
    </section>
  );
}
