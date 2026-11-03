import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseConfig } from "@/lib/supabase/config";
import { applicationOrigin } from "@/modules/auth/environment";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
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
        response = NextResponse.next({ request });
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
