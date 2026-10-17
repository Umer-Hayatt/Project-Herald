import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const destination = (path: string) =>
    NextResponse.redirect(new URL(path, process.env.APP_URL || request.url));
  if (request.nextUrl.searchParams.has("error"))
    return destination("/login?error=cancelled");
  const code = request.nextUrl.searchParams.get("code");
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
