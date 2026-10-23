"use server";
import { redirect } from "next/navigation";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ADULT_CONFIRMATION_COOKIE, ADULT_CONFIRMATION_VERSION } from "@/lib/age-policy";

async function saveAdultDeclaration(formData: FormData, failurePath: string) {
  if (formData.get("adult_confirmation") !== "yes") redirect(failurePath);
  (await cookies()).set(ADULT_CONFIRMATION_COOKIE, ADULT_CONFIRMATION_VERSION, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
  });
}

export async function confirmAdult(formData: FormData) {
  await saveAdultDeclaration(formData, "/age-check?error=age");
  redirect("/paper");
}

export async function signIn(formData: FormData) {
  if (!authConfigured() || !process.env.APP_URL) redirect("/login?error=setup");
  await saveAdultDeclaration(formData, "/login?error=age");
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
  (await cookies()).delete(ADULT_CONFIRMATION_COOKIE);
  redirect("/login");
}
