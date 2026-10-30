import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseConfig } from "./config";
// O proxy renova cookies durante navegação; Server Actions e Route Handlers podem escrevê-los.
export async function createSupabaseServerClient() {
  const config = readSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!config)
    throw new Error("Supabase de desenvolvimento ainda não configurado.");
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values)
            store.set(name, value, options);
        } catch {
          /* Renderização de Server Component: cookies são renovados no proxy. */
        }
      },
    },
  });
}
