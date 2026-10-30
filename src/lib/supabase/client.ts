"use client";
import { createBrowserClient } from "@supabase/ssr";
import { readSupabaseConfig } from "./config";
export function createSupabaseBrowserClient() {
  const config = readSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!config) throw new Error("Supabase ainda não configurado. Não é necessário na Fase 0.");
  return createBrowserClient(config.url, config.key);
}
