"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applicationOrigin, supabaseIsConfigured } from "./environment";
import {
  consumePasswordSetup, passwordSetupCookie, passwordSetupCookieOptions, sessionIdentity,
  issueRecoveryRequest, recoveryRequestCookie, recoveryRequestCookieOptions, verifierFingerprint,
} from "./password-setup";
export type ActionResult = { message: string; success?: boolean };
const emailSchema = z.email().max(254);
const passwordSchema = z
  .string()
  .min(12, "Use pelo menos 12 caracteres.")
  .max(128);
export async function signIn(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (!supabaseIsConfigured())
    return { message: "Supabase de desenvolvimento ainda não configurado." };
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1).max(128) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { message: "Preencha o correio electrónico e a palavra-passe." };
  const db = await createSupabaseServerClient();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      message: "Não foi possível entrar. Verifique os dados de acesso.",
    };
  redirect("/");
}
export async function recoverAccess(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (!supabaseIsConfigured())
    return { message: "Supabase de desenvolvimento ainda não configurado." };
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success)
    return { message: "Indique um correio electrónico válido." };
  let origin;
  try {
    origin = applicationOrigin();
  } catch {
    return { message: "O endereço de recuperação ainda não está configurado." };
  }
  try {
    // O SDK grava o verificador PKCE por setAll ANTES de efectuar /recover.
    // Falhar fechado se Set-Cookie não puder ser propagado pela Server Action.
    const db = await createSupabaseServerClient({ requireCookieWrites: true });
    const { error } = await db.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${origin}/auth/confirm`,
    });
    if (!error) {
      const store = await cookies();
      const fingerprint = verifierFingerprint(store.getAll());
      if (!fingerprint) throw new Error("Verificador não conservado.");
      const nonce = issueRecoveryRequest(email.data, fingerprint);
      store.set(recoveryRequestCookie, nonce, recoveryRequestCookieOptions());
    }
  } catch {
    // A mesma resposta para endereço inexistente, limite ou falha de transporte.
    // Não registar endereço, ligação de recuperação ou excepção do fornecedor.
  }
  return {
    message:
      "Se existir uma conta autorizada, receberá as instruções de recuperação.",
    success: true,
  };
}
export async function changePassword(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (!supabaseIsConfigured())
    return { message: "Supabase ainda não configurado." };
  const values = z
    .object({ password: passwordSchema, confirmation: z.string() })
    .refine((v) => v.password === v.confirmation)
    .safeParse(Object.fromEntries(form));
  if (!values.success)
    return {
      message: "Use pelo menos 12 caracteres e confirme a mesma palavra-passe.",
    };
  try {
    const db = await createSupabaseServerClient({ requireCookieWrites: true });
    const {
      data: { user },
      error: userError,
    } = await db.auth.getUser();
    if (userError || !user)
      return { message: "A ligação expirou. Solicite uma nova recuperação." };
    const { data: { session }, error: sessionError } = await db.auth.getSession();
    const identity = session && !sessionError ? sessionIdentity(session.access_token, user.id) : null;
    const store = await cookies();
    if (!identity || !consumePasswordSetup(store.get(passwordSetupCookie)?.value, identity))
      return { message: "A ligação expirou. Solicite uma nova recuperação." };
    store.set(passwordSetupCookie, "", passwordSetupCookieOptions(0));
    const { error } = await db.auth.updateUser({ password: values.data.password });
    if (error)
      return {
        message: "Não foi possível actualizar a palavra-passe. Solicite nova ligação se necessário.",
      };
    const { error: signOutError } = await db.auth.signOut();
    if (signOutError)
      return {
        message: "A palavra-passe foi actualizada, mas não foi possível terminar a sessão. Termine a sessão antes de continuar.",
      };
  } catch {
    return {
      message: "Não foi possível concluir a operação. Verifique o estado da sessão antes de repetir.",
    };
  }
  // redirect lança uma excepção de controlo Next.js; fica fora do catch.
  redirect("/entrar?mensagem=palavra-passe-actualizada");
}
export async function signOut() {
  if (supabaseIsConfigured()) {
    const db = await createSupabaseServerClient();
    await db.auth.signOut();
  }
  redirect("/entrar");
}
