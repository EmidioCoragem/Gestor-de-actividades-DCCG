"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/modules/auth/session";
import { applicationOrigin } from "@/modules/auth/environment";
import { validateActivityDraftForm } from "./validation";
import { isActivityOriginAllowed } from "./policy";
import { createActivityDraftRecord } from "./repository";
import type { ActivityActionResult } from "./contracts";
export type { ActivityActionResult } from "./contracts";

export async function createActivityDraft(_state: ActivityActionResult, form: FormData): Promise<ActivityActionResult> {
  try {
    if (!isActivityOriginAllowed((await headers()).get("origin"), applicationOrigin()))
      return { status: "refused", message: "A origem do pedido não foi reconhecida. Reabra o formulário na origem autorizada.", retryable: false };
  } catch {
    return { status: "refused", message: "Não foi possível confirmar a origem autorizada do pedido.", retryable: false };
  }
  // Redirect de autenticação deve conservar a semântica do Next, fora do catch.
  await requireViewer();
  const parsed = validateActivityDraftForm(form);
  if (!parsed.success) return { status: "validation", message: "Verifique os campos do rascunho antes de guardar.", fieldErrors: parsed.fieldErrors, retryable: false };
  // Elegibilidade funcional, capacidade, âmbito e actor são resolvidos novamente
  // pela RPC da sessão. O browser não fornece criador, código, estado ou versão.
  const result = await createActivityDraftRecord(parsed.data);
  if (result.state !== "ok") return { status: result.state, message: result.message, retryable: result.retryable };
  // Só invalidar caches depois de uma resposta confirmada, incluindo replay.
  revalidatePath("/actividades");
  return { status: "success", message: "Rascunho guardado e auditado.", draftId: result.data.id, code: result.data.code, retryable: false };
}
