import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  applicationOrigin,
  supabaseIsConfigured,
} from "@/modules/auth/environment";
import {
  issuePasswordSetup, passwordSetupCookie, passwordSetupCookieOptions, sessionIdentity,
  consumeRecoveryRequest, recoveryRequestCookie, recoveryRequestCookieOptions, recoveryUserMatches, verifierFingerprint,
} from "@/modules/auth/password-setup";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

async function exchangeRecovery(db: Awaited<ReturnType<typeof createSupabaseServerClient>>, code: string) {
  let recovery = false;
  const { data: { subscription } } = db.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") recovery = true;
  });
  try {
    const result = await db.auth.exchangeCodeForSession(code);
    return { result, recovery };
  } finally {
    subscription.unsubscribe();
  }
}

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
  const code = request.nextUrl.searchParams.get("code");
  const params = request.nextUrl.searchParams;
  const valid = (value: string | null) => Boolean(value && value.length <= 2048 && /^[a-zA-Z0-9_-]+$/.test(value));
  const pkce = valid(code) && params.getAll("code").length === 1 &&
    !params.has("token_hash") && !params.has("type");
  const otp = valid(token) && !params.has("code") &&
    params.getAll("token_hash").length === 1 && params.getAll("type").length === 1 &&
    (type === "recovery" || type === "invite");
  const conflicting = ["access_token", "refresh_token", "error", "error_description"].some((key) => params.has(key));
  if (supabaseIsConfigured() && !conflicting && (pkce || otp)) {
    try {
      let expectedEmailHash: string | undefined;
      if (pkce) {
        const store = await cookies();
        const pending = consumeRecoveryRequest(store.get(recoveryRequestCookie)?.value, verifierFingerprint(store.getAll()));
        if (!pending) return redirectTo("/entrar?erro=ligacao-invalida");
        expectedEmailHash = pending.emailHash;
        store.set(recoveryRequestCookie, "", recoveryRequestCookieOptions(0));
      }
      const db = await createSupabaseServerClient({ requireCookieWrites: true });
      const verified = pkce
        ? await exchangeRecovery(db, code!)
        : { result: await db.auth.verifyOtp({ token_hash: token!, type: type as "invite" | "recovery" }), recovery: false };
      const { result } = verified;
      const kind = pkce
        ? (verified.recovery ? "recovery" : null)
        : type;
      // O tipo PKCE vem do SDK/verificador, nunca de type/next fornecidos no URL.
      if (!result.error && (kind === "recovery" || (!pkce && kind === "invite")) &&
          result.data.user && result.data.session &&
          (!pkce || recoveryUserMatches(result.data.user.email, expectedEmailHash!))) {
        const identity = sessionIdentity(result.data.session.access_token, result.data.user.id);
        if (identity) {
          const grant = issuePasswordSetup(identity, kind);
          const response = redirectTo("/actualizar-palavra-passe");
          response.cookies.set(passwordSetupCookie, grant.nonce, passwordSetupCookieOptions(grant.maxAge));
          return response;
        }
      }
    } catch {
      // Não imprimir excepções do fornecedor: podem conter URL ou sessão.
    }
  }
  return redirectTo("/entrar?erro=ligacao-invalida");
}
