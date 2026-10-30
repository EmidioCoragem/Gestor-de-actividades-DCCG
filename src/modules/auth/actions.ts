"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applicationOrigin, supabaseIsConfigured } from "./environment";
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
  const db = await createSupabaseServerClient();
  await db.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/confirm`,
  });
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
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return { message: "A ligação expirou. Solicite uma nova recuperação." };
  const { error } = await db.auth.updateUser({
    password: values.data.password,
  });
  if (error)
    return {
      message:
        "Não foi possível actualizar a palavra-passe. Solicite nova ligação se necessário.",
    };
  await db.auth.signOut();
  redirect("/entrar?mensagem=palavra-passe-actualizada");
}
export async function signOut() {
  if (supabaseIsConfigured()) {
    const db = await createSupabaseServerClient();
    await db.auth.signOut();
  }
  redirect("/entrar");
}
