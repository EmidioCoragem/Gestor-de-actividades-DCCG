import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseIsConfigured } from "@/modules/auth/environment";
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (
    supabaseIsConfigured() &&
    token &&
    (type === "recovery" || type === "invite")
  ) {
    const db = await createSupabaseServerClient();
    const { error } = await db.auth.verifyOtp({ token_hash: token, type });
    if (!error)
      return NextResponse.redirect(
        new URL("/actualizar-palavra-passe", request.url),
      );
  }
  return NextResponse.redirect(
    new URL("/entrar?erro=ligacao-invalida", request.url),
  );
}
