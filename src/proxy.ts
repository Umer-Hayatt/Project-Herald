import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADULT_CONFIRMATION_COOKIE, ADULT_CONFIRMATION_VERSION } from "@/lib/age-policy";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return response;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    },
  );
  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const privatePage = /^\/(paper|settings|onboarding|archive)(\/|$)/.test(path);
  const privateApi = path.startsWith("/api/") && path !== "/api/editions/sample/pdf";
  if (data?.claims?.sub && (privatePage || privateApi) &&
    request.cookies.get(ADULT_CONFIRMATION_COOKIE)?.value !== ADULT_CONFIRMATION_VERSION) {
    const blocked = privateApi
      ? NextResponse.json({ error: "Confirm that you are 18 or older to continue.", code: "AGE_CONFIRMATION_REQUIRED" }, { status: 403 })
      : NextResponse.redirect(new URL("/age-check", request.url));
    for (const cookie of response.cookies.getAll()) blocked.cookies.set(cookie);
    blocked.headers.set("Cache-Control", "private, no-store");
    return blocked;
  }
  return response;
}
export const config = {
  matcher: ["/login", "/age-check", "/settings", "/archive/:path*", "/onboarding", "/paper", "/auth/:path*", "/api/:path*"],
};
