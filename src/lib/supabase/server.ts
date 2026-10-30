import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseConfig } from "./config";
// Reservado a Server Actions e Route Handlers que possam actualizar cookies.
// Na Fase 1, acrescentar renovação de sessão e autorização antes de usar dados.
export async function createSupabaseServerClient() {
  const config = readSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!config) throw new Error("Supabase ainda não configurado. Não é necessário na Fase 0.");
  const store = await cookies();
  return createServerClient(config.url, config.key, { cookies: {
    getAll: () => store.getAll(),
    setAll: (values) => { for (const { name, value, options } of values) store.set(name, value, options); },
  } });
}
