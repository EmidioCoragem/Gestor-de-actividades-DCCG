import { readSupabaseConfig } from "@/lib/supabase/config";
export function supabaseIsConfigured() {
  try {
    return (
      readSupabaseConfig(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ) !== null
    );
  } catch {
    return false;
  }
}
export function applicationOrigin() {
  const value = process.env.APP_ORIGIN;
  if (!value)
    throw new Error(
      "APP_ORIGIN deve indicar o endereço autorizado do ambiente de desenvolvimento.",
    );
  const url = new URL(value);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("Origem da aplicação inválida.");
  return url.origin;
}
