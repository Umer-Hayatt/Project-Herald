import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { SubmitButton } from "@/components/submit-button";
import { signIn, signOut } from "@/app/auth/actions";
import { authConfigured, createClient } from "@/lib/supabase/server";
const messages: Record<string, string> = {
  cancelled:
    "Google sign-in was cancelled. You can try again whenever you’re ready.",
  callback:
    "We couldn’t finish signing you in. Please try Google sign-in again.",
  signin: "Google sign-in is unavailable right now. Please try again.",
  setup: "Sign-in is being configured. Please try again soon.",
  signout: "We couldn’t sign you out. Please retry using the button below.",
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = authConfigured();
  if (configured && !error) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/paper");
  }
  return (
    <>
      <Header />
      <main id="main" className="account-layout">
        <section className="account-intro">
          <h1>
            A fresh
            <br />
            perspective
            <br />
            starts here.
          </h1>
          <p>
            A few things you care about.
            <br />A little room for the unexpected.
          </p>
          <div
            className="reserved-art"
            aria-label="Reserved for final human-made comic artwork"
          />
        </section>
        <section className="account-panel">
          <h2>
            Make yourself
            <br />
            at home.
          </h2>
          <p>
            Sign in to set up your personal daily paper. Returning? Your
            preferences will be waiting.
          </p>
          {error && (
            <p role="alert" className="notice error">
              {messages[error] || messages.callback}
            </p>
          )}
          {!configured && (
            <p role="status" className="notice">
              Sign-in is being configured. Please try again soon.
            </p>
          )}
          <form action={error === "signout" ? signOut : signIn}>
            <SubmitButton
              pendingText={
                error === "signout" ? "Signing out…" : "Opening Google…"
              }
            >
              {error === "signout" ? "Retry sign out" : "Continue with Google"}
            </SubmitButton>
          </form>
          <p className="small-note">
            We use your Google account to sign you in. Your reading preferences
            stay in Herald.
          </p>
        </section>
      </main>
    </>
  );
}
