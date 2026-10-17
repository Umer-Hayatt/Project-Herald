import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const destination = (path: string) =>
    NextResponse.redirect(new URL(path, process.env.APP_URL || request.url));
  const parameters = request.nextUrl.searchParams;
  if (parameters.has("error") || parameters.has("error_code")) {
    const denied = parameters.get("error") === "access_denied";
    const code = parameters.get("error_code");
    const cancelled = denied && (!code || code === "access_denied");
    return destination(
      "/login?error=" + (cancelled ? "cancelled" : "callback"),
    );
  }
  const code = parameters.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return destination("/paper");
    } catch {
      /* A failed callback must remain recoverable. */
    }
  }
  return destination("/login?error=callback");
}
