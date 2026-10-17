export const metadata = { title: "Create your paper | Herald" };

import { Header } from "@/components/header";
import { OnboardingForm } from "./preferences-form";
import { loadReaderPreferences } from "@/lib/account";
export default async function Onboarding() {
  const data = await loadReaderPreferences();
  return (
    <>
      <Header signedIn />
      <main id="main" className="onboarding">
        <div className="onboarding-heading">
          <h1>
            What makes
            <br />
            your paper yours?
          </h1>
          <p>
            Choose what you care about. We’ll leave room for a fresh
            perspective, too.
          </p>
        </div>
        <OnboardingForm saved={data} />
      </main>
    </>
  );
}
