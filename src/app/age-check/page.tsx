import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Header } from "@/components/header";
import { AdultDeclaration } from "@/components/adult-declaration";
import { SubmitButton } from "@/components/submit-button";
import { confirmAdult } from "@/app/auth/actions";
import { authConfigured, createClient } from "@/lib/supabase/server";
import { ADULT_CONFIRMATION_COOKIE, ADULT_CONFIRMATION_VERSION } from "@/lib/age-policy";

export const metadata = { title: "Age confirmation | Herald" };

export default async function AgeCheck({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!authConfigured()) redirect("/login?error=setup");
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) redirect("/login");
  if ((await cookies()).get(ADULT_CONFIRMATION_COOKIE)?.value === ADULT_CONFIRMATION_VERSION) redirect("/paper");
  const { error } = await searchParams;
  return <>
    <Header signedIn />
    <main id="main" className="account-layout">
      <section className="account-intro"><h1>A paper<br />for adults.</h1><p>Herald is for readers aged 18 and over.</p></section>
      <section className="account-panel">
        <h2>Before you continue</h2>
        <p>Please confirm that you meet the age requirement. Your saved papers and preferences stay as they are.</p>
        {error && <p role="alert" className="notice error">You must be 18 or older to use Herald.</p>}
        <form action={confirmAdult}>
          <AdultDeclaration />
          <SubmitButton pendingText="Continuing…">Continue to Herald</SubmitButton>
        </form>
        <p className="small-note">We remember this declaration for your browser session. We do not collect your date of birth.</p>
      </section>
    </main>
  </>;
}
