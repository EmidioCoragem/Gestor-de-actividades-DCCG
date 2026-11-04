import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseConfig } from "@/lib/supabase/config";
import { applicationOrigin } from "@/modules/auth/environment";
import { protectFormOrigin, formOriginCookie, formOriginCookieOptions } from "@/modules/auth/form-origin";
export async function proxy(request: NextRequest) {
  const protection = await protectFormOrigin(request);
  if (protection.blocked) return new NextResponse("Pedido de formulário recusado.", {
    status: 403,
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
  const next = () => {
    const result = NextResponse.next({ request: { headers: request.headers } });
    if (protection.issuedNonce)
      result.cookies.set(formOriginCookie, protection.issuedNonce, formOriginCookieOptions);
    if (["/entrar", "/recuperar-acesso", "/actualizar-palavra-passe"].includes(request.nextUrl.pathname)) {
      result.headers.set("Cache-Control", "private, no-store");
      result.headers.set("Referrer-Policy", "no-referrer");
    }
    return result;
  };
  let response = next();
  let config;
  let origin;
  try {
    config = readSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
    if (config) origin = applicationOrigin();
  } catch {
    return response;
  }
  if (!config || !origin) return response;
  const client = createServerClient(config.url, config.key, {
    auth: { debug: false },
    cookieOptions: { sameSite: "lax", secure: new URL(origin).protocol === "https:" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = next();
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
