import { z } from "zod";
const schema = z.object({
  url: z.url().refine((value) => value.startsWith("https://"), "Utilize HTTPS"),
  key: z.string().min(1),
});
export function readSupabaseConfig(
  url: string | undefined,
  key: string | undefined,
) {
  if (!url && !key) return null;
  const result = schema.safeParse({ url, key });
  if (!result.success)
    throw new Error(
      "Configuração Supabase incompleta ou inválida. Consulte .env.example.",
    );
  return result.data;
}
