"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission, requireViewer } from "@/modules/auth/session";
import { applicationOrigin } from "@/modules/auth/environment";
import type { ActionResult } from "@/modules/auth/actions";
import { validateMutation } from "./validation";
export async function adminMutation(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requireViewer();
  const operation = String(form.get("operation") ?? "");
  const payload = validateMutation(operation, Object.fromEntries(form));
  if (!payload)
    return {
      message: "Verifique os campos obrigatórios e os formatos indicados.",
    };
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc("admin_mutation", { operation, payload });
  if (error)
    return {
      message:
        "Operação recusada. Verifique o âmbito, as relações e as restrições de integridade. Nenhuma alteração parcial foi aplicada.",
    };
  revalidatePath("/", "layout");
  return { message: "Alteração guardada e auditada.", success: true };
}
export async function inviteUser(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  await requirePermission("users.manage"); // Convites não associados ainda a unidades exigem âmbito global.
  const values = z
    .object({
      email: z.email().max(254),
      full_name: z.string().trim().min(1).max(160),
    })
    .safeParse(Object.fromEntries(form));
  if (!values.success)
    return { message: "Indique nome e correio electrónico válidos." };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return {
      message:
        "O envio de convites precisa da chave administrativa no servidor de desenvolvimento. Nenhum convite foi enviado.",
    };
  let origin;
  try {
    origin = applicationOrigin();
  } catch {
    return { message: "Configure APP_ORIGIN antes de enviar convites." };
  }
  // Esta chave nunca é serializada nem entregue ao cliente. Usada apenas na API Auth Admin.
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const db = await createSupabaseServerClient();
  const { error: auditError } = await db.rpc("audit_invitation", {
    email: values.data.email,
    stage: "requested",
  });
  if (auditError)
    return {
      message:
        "Não foi possível registar a intenção do convite. Nenhum convite foi enviado.",
    };
  const { data: invitation, error } = await admin.auth.admin.inviteUserByEmail(
    values.data.email,
    {
      data: { full_name: values.data.full_name },
      redirectTo: `${origin}/auth/confirm`,
    },
  );
  if (error) {
    await db.rpc("audit_invitation", {
      email: values.data.email,
      stage: "failed",
    });
    return {
      message:
        "Não foi possível enviar o convite. Verifique a configuração Auth/SMTP e o registo de auditoria do Supabase.",
    };
  }
  const { error: resultAuditError } = await db.rpc("audit_invitation", {
    email: values.data.email,
    stage: "sent",
    invited_user: invitation.user?.id ?? null,
  });
  if (resultAuditError)
    return {
      message:
        "O convite foi enviado, mas o registo final precisa de reconciliação. A intenção e o actor foram registados. Não repita o convite automaticamente.",
    };
  revalidatePath("/administracao");
  return {
    message:
      "Convite enviado. A conta permanece inactiva até activação e atribuição autorizadas.",
    success: true,
  };
}
