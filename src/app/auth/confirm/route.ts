import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  applicationOrigin,
  supabaseIsConfigured,
} from "@/modules/auth/environment";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: NextRequest) {
  let origin: string;
  try {
    origin = applicationOrigin();
  } catch {
    // Sem origem confiável, não usar Host, forwarded headers ou request.url.
    return new NextResponse("Confirmação indisponível: configuração necessária.", {
      status: 503,
      headers: privateHeaders,
    });
  }
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, origin), {
      status: 303,
      headers: privateHeaders,
    });
  const token = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (
    supabaseIsConfigured() &&
    token &&
    token.length <= 2048 &&
    /^[a-zA-Z0-9_-]+$/.test(token) &&
    request.nextUrl.searchParams.getAll("token_hash").length === 1 &&
    request.nextUrl.searchParams.getAll("type").length === 1 &&
    (type === "recovery" || type === "invite")
  ) {
    try {
      const db = await createSupabaseServerClient();
      const { error } = await db.auth.verifyOtp({ token_hash: token, type });
      if (!error) return redirectTo("/actualizar-palavra-passe");
    } catch {
      // Não imprimir excepções do fornecedor: podem conter URL ou sessão.
    }
  }
  return redirectTo("/entrar?erro=ligacao-invalida");
}
