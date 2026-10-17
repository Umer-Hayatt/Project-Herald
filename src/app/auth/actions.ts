"use server";
import { redirect } from "next/navigation";
import { createClient, authConfigured } from "@/lib/supabase/server";
export async function signIn() {
  if (!authConfigured() || !process.env.APP_URL) redirect("/login?error=setup");
  const supabase = await createClient();
  let url: string | undefined;
  try {
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL("/auth/callback", process.env.APP_URL).toString(),
        scopes: "openid email profile",
      },
    });
    if (!result.error) url = result.data.url ?? undefined;
  } catch {
    /* Return a recoverable error without logging provider credentials. */
  }
  if (!url) redirect("/login?error=signin");
  redirect(url);
}
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/login?error=signout");
  redirect("/login");
}
